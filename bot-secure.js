const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildPresences,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Discord.Partials.Channel, Discord.Partials.Message, Discord.Partials.Reaction]
});

const axios = require('axios');
const chalk = require('chalk');
const gradient = require('gradient-string');
const figlet = require('figlet');

// Configuration
const config = {
    token: process.env.TOKEN,
    prefix: process.env.PREFIX || '.',
    ownerID: process.env.OWNER_ID
};
    colors: {
        primary: '#FF1493',
        success: '#00FF00',
        error: '#FF0000',
        warning: '#FFA500',
        info: '#00BFFF',
        economy: '#FFD700',
        level: '#9B59B6'
    }
};

// Data Storage
const cooldowns = new Map();
const userXP = new Map();
const economy = new Map();
const warnings = new Map();
const afkUsers = new Map();
const snipes = new Map();
const giveaways = new Map();

// Utility Functions
const formatNumber = (num) => num.toLocaleString();
const getProgressBar = (current, max, length = 20) => {
    const filled = Math.floor((current / max) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
};

// Ready Event
client.on('ready', () => {
    console.log(gradient.rainbow(figlet.textSync('BOT ONLINE', { font: 'ANSI Shadow' })));
    console.log(chalk.hex('#FF1493')('═'.repeat(60)));
    console.log(chalk.green.bold(`✅ Bot: ${client.user.tag}`));
    console.log(chalk.blue.bold(`🌐 Servers: ${client.guilds.cache.size}`));
    console.log(chalk.yellow.bold(`👥 Users: ${client.users.cache.size}`));
    console.log(chalk.magenta.bold(`📺 Channels: ${client.channels.cache.size}`));
    console.log(chalk.cyan.bold(`🎯 Prefix: ${config.prefix}`));
    console.log(chalk.hex('#FF1493')('═'.repeat(60)));
    
    const activities = [
        { name: `${config.prefix}help | 🚀 100+ Commands`, type: Discord.ActivityType.Playing },
        { name: `${client.guilds.cache.size} Servers 🖥️`, type: Discord.ActivityType.Watching },
        { name: `${client.users.cache.size} Users 👥`, type: Discord.ActivityType.Listening },
        { name: `AI Chat 🤖 | ${config.prefix}ai`, type: Discord.ActivityType.Playing },
        { name: `Economy System 💰`, type: Discord.ActivityType.Playing }
    ];
    
    let i = 0;
    setInterval(() => {
        client.user.setPresence({
            activities: [activities[i]],
            status: 'online'
        });
        i = (i + 1) % activities.length;
    }, 10000);
});

// Message Handler
client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    
    // AFK System
    if (afkUsers.has(msg.author.id)) {
        afkUsers.delete(msg.author.id);
        const embed = new Discord.EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`✅ **Welcome back!** ${msg.author}\nYour AFK status has been removed.`)
            .setTimestamp();
        const reply = await msg.reply({ embeds: [embed] });
        setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
    
    // Check mentions for AFK
    msg.mentions.users.forEach(user => {
        if (afkUsers.has(user.id)) {
            const afk = afkUsers.get(user.id);
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.info)
                .setDescription(`😴 **${user.tag}** is currently AFK\n💬 Reason: ${afk.reason}\n⏰ Since: <t:${Math.floor(afk.timestamp / 1000)}:R>`)
                .setTimestamp();
            msg.reply({ embeds: [embed] });
        }
    });
    
    // Bot Mention
    if (msg.content.match(new RegExp(`^<@!?${client.user.id}>$`))) {
        const embed = new Discord.EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle('👋 Hello! I\'m here to help!')
            .setDescription(`> **I'm a powerful multi-purpose Discord bot!**\n\n🎯 **Prefix:** \`${config.prefix}\`\n📚 **Help:** \`${config.prefix}help\`\n🤖 **AI Chat:** \`${config.prefix}ai <message>\``)
            .addFields(
                { name: '🖥️ Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: '👥 Users', value: `\`${formatNumber(client.users.cache.size)}\``, inline: true },
                { name: '🏓 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
                { name: '⚡ Features', value: '```\n• AI Chatbot\n• Economy System\n• Leveling System\n• Moderation Tools\n• Fun Commands\n• Giveaways & More```', inline: false }
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `Requested by ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
            .setTimestamp();
        return msg.reply({ embeds: [embed] });
    }
    
    // Command Handler
    const isOwner = msg.author.id === config.ownerID;
    const prefix = isOwner ? '' : config.prefix;
    
    if (!isOwner && !msg.content.startsWith(prefix)) return;
    
    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    
    // All Commands
    const commands = {
        'help': async () => {
            const categories = [
                {
                    label: '📚 Information & Stats',
                    value: 'info',
                    description: 'Bot info, server stats, user info',
                    emoji: '📚',
                    commands: [
                        '`help` - Show this menu',
                        '`ping` - Bot latency',
                        '`stats` - Bot statistics',
                        '`botinfo` - Bot information',
                        '`serverinfo` - Server details',
                        '`userinfo` - User information',
                        '`avatar` - User avatar',
                        '`banner` - User banner',
                        '`invite` - Invite bot',
                        '`uptime` - Bot uptime',
                        '`membercount` - Member stats',
                        '`emojis` - Server emojis',
                        '`roles` - Server roles',
                        '`boosters` - Server boosters'
                    ]
                },
                {
                    label: '🎮 Fun & Games',
                    value: 'fun',
                    description: 'Memes, jokes, games, trivia',
                    emoji: '🎮',
                    commands: [
                        '`meme` - Random meme',
                        '`joke` - Random joke',
                        '`8ball` - Magic 8-ball',
                        '`flip` - Coin flip',
                        '`dice` - Roll dice',
                        '`rps` - Rock paper scissors',
                        '`rate` - Rate something',
                        '`roast` - Roast someone',
                        '`compliment` - Compliment',
                        '`advice` - Random advice',
                        '`fact` - Random fact',
                        '`quote` - Random quote',
                        '`reverse` - Reverse text',
                        '`ascii` - ASCII art'
                    ]
                },
                {
                    label: '💰 Economy System',
                    value: 'economy',
                    description: 'Money, gambling, shop',
                    emoji: '💰',
                    commands: [
                        '`bal/balance` - Check balance',
                        '`daily` - Daily reward',
                        '`weekly` - Weekly reward',
                        '`work` - Work for money',
                        '`beg` - Beg for coins',
                        '`rob` - Rob someone',
                        '`gamble <amount>` - Gamble coins',
                        '`slots <bet>` - Slot machine',
                        '`coinflip <bet> <h/t>` - Flip coin',
                        '`deposit <amount>` - Deposit to bank',
                        '`withdraw <amount>` - Withdraw from bank',
                        '`give <user> <amount>` - Give coins',
                        '`leaderboard` - Top users',
                        '`shop` - View shop'
                    ]
                },
                {
                    label: '🛡️ Moderation Tools',
                    value: 'mod',
                    description: 'Server moderation',
                    emoji: '🛡️',
                    commands: [
                        '`kick <user> [reason]` - Kick member',
                        '`ban <user> [reason]` - Ban member',
                        '`unban <userID>` - Unban user',
                        '`timeout <user> <time>` - Timeout member',
                        '`warn <user> [reason]` - Warn member',
                        '`warnings [user]` - Check warnings',
                        '`clearwarns <user>` - Clear warnings',
                        '`clear <amount>` - Delete messages',
                        '`purge <amount>` - Purge messages',
                        '`nuke` - Nuke channel',
                        '`lock` - Lock channel',
                        '`unlock` - Unlock channel',
                        '`slowmode <seconds>` - Set slowmode'
                    ]
                },
                {
                    label: '📊 Leveling & Ranks',
                    value: 'level',
                    description: 'XP system and ranks',
                    emoji: '📊',
                    commands: [
                        '`rank [user]` - View rank card',
                        '`level [user]` - Check level',
                        '`top` - XP leaderboard',
                        '`leaderboard` - Top users',
                        '`setxp <user> <xp>` - Set XP (Owner)',
                        '`addxp <user> <xp>` - Add XP (Owner)',
                        '`resetxp <user>` - Reset XP (Owner)'
                    ]
                },
                {
                    label: '🤖 AI & ChatBot',
                    value: 'ai',
                    description: 'AI features',
                    emoji: '🤖',
                    commands: [
                        '`ai <message>` - Chat with AI',
                        '`chat <message>` - AI conversation',
                        '`ask <question>` - Ask AI',
                        '`weather <city>` - Weather info',
                        '`translate <text>` - Translate',
                        '`define <word>` - Dictionary',
                        '`calculate <math>` - Calculator'
                    ]
                },
                {
                    label: '🎉 Giveaways',
                    value: 'giveaway',
                    description: 'Create giveaways',
                    emoji: '🎉',
                    commands: [
                        '`giveaway` - Start giveaway',
                        '`gstart` - Create giveaway',
                        '`gend <msgID>` - End giveaway',
                        '`greroll <msgID>` - Reroll winner',
                        '`poll <question>` - Create poll'
                    ]
                },
                {
                    label: '🔧 Utility Tools',
                    value: 'utility',
                    description: 'Useful commands',
                    emoji: '🔧',
                    commands: [
                        '`afk [reason]` - Set AFK',
                        '`snipe` - Snipe deleted msg',
                        '`enlarge <emoji>` - Enlarge emoji',
                        '`steal <emoji>` - Steal emoji',
                        '`color <hex>` - Show color',
                        '`qr <text>` - Generate QR',
                        '`shorten <url>` - Shorten URL',
                        '`embed <text>` - Create embed',
                        '`say <text>` - Make bot say'
                    ]
                },
                {
                    label: '👑 Owner Commands',
                    value: 'owner',
                    description: 'Owner only',
                    emoji: '👑',
                    commands: [
                        '`eval <code>` - Evaluate code',
                        '`exec <cmd>` - Execute command',
                        '`serverlist` - List servers',
                        '`leave [guildID]` - Leave server',
                        '`shutdown` - Shutdown bot',
                        '`restart` - Restart bot',
                        '`blacklist <user>` - Blacklist user'
                    ]
                }
            ];
            
            const mainEmbed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: `${client.user.username} Command Center`, 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('📚 Help Menu - Command Categories')
                .setDescription('> Select a category from the dropdown menu below!\n\n**✨ Quick Information:**')
                .addFields(
                    { 
                        name: '🎯 Bot Prefix', 
                        value: `\`\`\`${config.prefix}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📊 Total Commands', 
                        value: '```100+```', 
                        inline: true 
                    },
                    { 
                        name: '🖥️ Active Servers', 
                        value: `\`\`\`${client.guilds.cache.size}\`\`\``, 
                        inline: true 
                    }
                )
                .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
                .setImage('https://i.imgur.com/AfFp7pu.png')
                .setFooter({ 
                    text: `Requested by ${msg.author.tag} | Page 1/1`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            categories.forEach((cat, index) => {
                mainEmbed.addFields({
                    name: `${cat.emoji} **${cat.label}**`,
                    value: `> ${cat.description}\n> Commands: \`${cat.commands.length}\``,
                    inline: true
                });
            });
            
            const selectMenu = new Discord.StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('📂 Choose a category to explore...')
                .addOptions(
                    categories.map(cat => ({
                        label: cat.label,
                        value: cat.value,
                        description: cat.description,
                        emoji: cat.emoji
                    }))
                );
            
            const row = new Discord.ActionRowBuilder().addComponents(selectMenu);
            
            const message = await msg.reply({ 
                embeds: [mainEmbed], 
                components: [row] 
            });
            
            const collector = message.createMessageComponentCollector({
                componentType: Discord.ComponentType.StringSelect,
                time: 300000
            });
            
            collector.on('collect', async interaction => {
                if (interaction.user.id !== msg.author.id) {
                    return interaction.reply({ 
                        content: '❌ **This menu is not for you!** Use `!help` to get your own menu.', 
                        ephemeral: true 
                    });
                }
                
                const selected = categories.find(c => c.value === interaction.values[0]);
                
                const categoryEmbed = new Discord.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setAuthor({ 
                        name: `${client.user.username} Commands`, 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTitle(`${selected.emoji} ${selected.label}`)
                    .setDescription(`> ${selected.description}\n\n**Available Commands:**\n\n${selected.commands.join('\n')}`)
                    .setFooter({ 
                        text: `${selected.commands.length} commands | Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                await interaction.update({ embeds: [categoryEmbed] });
            });
            
            collector.on('end', () => {
                selectMenu.setDisabled(true);
                message.edit({ 
                    components: [new Discord.ActionRowBuilder().addComponents(selectMenu)] 
                }).catch(() => {});
            });
        },
        
        'ping': async () => {
            const startTime = Date.now();
            const sent = await msg.reply('🏓 **Pinging...**');
            const latency = sent.createdTimestamp - msg.createdTimestamp;
            const apiLatency = Math.round(client.ws.ping);
            
            const getStatus = (ping) => {
                if (ping < 100) return { status: 'Excellent', emoji: '🟢', color: config.colors.success };
                if (ping < 200) return { status: 'Good', emoji: '🟡', color: config.colors.warning };
                return { status: 'Poor', emoji: '🔴', color: config.colors.error };
            };
            
            const botStatus = getStatus(latency);
            const apiStatus = getStatus(apiLatency);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(botStatus.color)
                .setTitle('🏓 Pong! Network Status')
                .setDescription('> **Network latency measurements**')
                .addFields(
                    { 
                        name: `${botStatus.emoji} Bot Latency`, 
                        value: `\`\`\`${latency}ms\`\`\`\n> Status: **${botStatus.status}**`, 
                        inline: true 
                    },
                    { 
                        name: `${apiStatus.emoji} API Latency`, 
                        value: `\`\`\`${apiLatency}ms\`\`\`\n> Status: **${apiStatus.status}**`, 
                        inline: true 
                    },
                    { 
                        name: '⏱️ Response Time', 
                        value: `\`\`\`${Date.now() - startTime}ms\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            await sent.edit({ content: null, embeds: [embed] });
        },
        
        'stats': async () => {
            const uptime = client.uptime;
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor(uptime / 3600000) % 24;
            const minutes = Math.floor(uptime / 60000) % 60;
            const seconds = Math.floor(uptime / 1000) % 60;
            
            const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.info)
                .setAuthor({ 
                    name: `${client.user.username} Statistics`, 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('📊 Bot Statistics Dashboard')
                .setDescription('> **Detailed bot information and metrics**')
                .addFields(
                    { 
                        name: '🖥️ Server Count', 
                        value: `\`\`\`${formatNumber(client.guilds.cache.size)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '👥 Total Users', 
                        value: `\`\`\`${formatNumber(totalMembers)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📺 Channels', 
                        value: `\`\`\`${formatNumber(client.channels.cache.size)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '⏱️ Uptime', 
                        value: `\`\`\`${days}d ${hours}h ${minutes}m ${seconds}s\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '💾 Memory Usage', 
                        value: `\`\`\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🏓 Ping', 
                        value: `\`\`\`${client.ws.ping}ms\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🟢 Node.js', 
                        value: `\`\`\`${process.version}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📚 Discord.js', 
                        value: `\`\`\`v${Discord.version}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📊 Commands', 
                        value: '```100+```', 
                        inline: true 
                    }
                )
                .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'botinfo': async () => {
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: client.user.username, 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('🤖 Bot Information')
                .setDescription('> **Detailed information about me**')
                .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
                .addFields(
                    { 
                        name: '👤 Bot Name', 
                        value: `\`\`\`${client.user.username}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🆔 Bot ID', 
                        value: `\`\`\`${client.user.id}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📅 Created', 
                        value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, 
                        inline: true 
                    },
                    { 
                        name: '👑 Owner', 
                        value: `<@${config.ownerID}>`, 
                        inline: true 
                    },
                    { 
                        name: '🎯 Prefix', 
                        value: `\`\`\`${config.prefix}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📊 Commands', 
                        value: '```100+```', 
                        inline: true 
                    },
                    { 
                        name: '🖥️ Servers', 
                        value: `\`\`\`${formatNumber(client.guilds.cache.size)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '👥 Users', 
                        value: `\`\`\`${formatNumber(client.users.cache.size)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🏓 Ping', 
                        value: `\`\`\`${client.ws.ping}ms\`\`\``, 
                        inline: true 
                    },
                    {
                        name: '⚡ Features',
                        value: '```\n✓ AI Chatbot\n✓ Economy System\n✓ Leveling System\n✓ Moderation Tools\n✓ Fun Commands\n✓ Giveaways\n✓ And More!```',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'serverinfo': async () => {
            const guild = msg.guild;
            const owner = await guild.fetchOwner();
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.info)
                .setAuthor({ 
                    name: guild.name, 
                    iconURL: guild.iconURL({ dynamic: true }) 
                })
                .setTitle('📋 Server Information')
                .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
                .addFields(
                    { 
                        name: '🆔 Server ID', 
                        value: `\`\`\`${guild.id}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '👑 Owner', 
                        value: `${owner.user.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '📅 Created', 
                        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, 
                        inline: true 
                    },
                    { 
                        name: '👥 Members', 
                        value: `\`\`\`${formatNumber(guild.memberCount)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🤖 Bots', 
                        value: `\`\`\`${guild.members.cache.filter(m => m.user.bot).size}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📺 Channels', 
                        value: `\`\`\`${guild.channels.cache.size}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '💬 Text Channels', 
                        value: `\`\`\`${guild.channels.cache.filter(c => c.type === 0).size}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🔊 Voice Channels', 
                        value: `\`\`\`${guild.channels.cache.filter(c => c.type === 2).size}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🎭 Roles', 
                        value: `\`\`\`${guild.roles.cache.size}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '😀 Emojis', 
                        value: `\`\`\`${guild.emojis.cache.size}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🚀 Boost Level', 
                        value: `\`\`\`Tier ${guild.premiumTier}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '💎 Boosts', 
                        value: `\`\`\`${guild.premiumSubscriptionCount || 0}\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ size: 1024 }));
            }
            
            msg.reply({ embeds: [embed] });
        },
        
        'userinfo': async () => {
            const user = msg.mentions.users.first() || msg.author;
            const member = msg.guild.members.cache.get(user.id);
            
            const badges = {
                'Staff': '<:staff:123456789>',
                'Partner': '<:partner:123456789>',
                'HypeSquad': '<:hypesquad:123456789>',
                'BugHunter': '<:bughunter:123456789>',
                'VerifiedDeveloper': '<:developer:123456789>'
            };
            
            const embed = new Discord.EmbedBuilder()
                .setColor(member?.displayHexColor || config.colors.primary)
                .setAuthor({ 
                    name: user.tag, 
                    iconURL: user.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle('👤 User Information')
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { 
                        name: '👤 Username', 
                        value: `\`\`\`${user.username}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🆔 User ID', 
                        value: `\`\`\`${user.id}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🤖 Bot', 
                        value: user.bot ? '```Yes```' : '```No```', 
                        inline: true 
                    },
                    { 
                        name: '📅 Account Created', 
                        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, 
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            if (member) {
                embed.addFields(
                    { 
                        name: '📥 Joined Server', 
                        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, 
                        inline: false 
                    }
                );
                
                const roles = member.roles.cache
                    .filter(r => r.id !== msg.guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(r => r)
                    .slice(0, 10)
                    .join(', ');
                
                if (roles) {
                    embed.addFields({ 
                        name: `🎭 Roles [${member.roles.cache.size - 1}]`, 
                        value: roles || 'None' 
                    });
                }
            }
            
            msg.reply({ embeds: [embed] });
        },
        
        'avatar': async () => {
            const user = msg.mentions.users.first() || msg.author;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: `${user.tag}'s Avatar`, 
                    iconURL: user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`[PNG](${user.displayAvatarURL({ extension: 'png', size: 4096 })}) | [JPG](${user.displayAvatarURL({ extension: 'jpg', size: 4096 })}) | [WEBP](${user.displayAvatarURL({ extension: 'webp', size: 4096 })})`)
                .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'banner': async () => {
            const user = msg.mentions.users.first() || msg.author;
            const fetchedUser = await user.fetch();
            
            if (!fetchedUser.bannerURL()) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **This user has no banner set!**')
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: `${user.tag}'s Banner`, 
                    iconURL: user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`[PNG](${fetchedUser.bannerURL({ extension: 'png', size: 4096 })}) | [JPG](${fetchedUser.bannerURL({ extension: 'jpg', size: 4096 })}) | [WEBP](${fetchedUser.bannerURL({ extension: 'webp', size: 4096 })})`)
                .setImage(fetchedUser.bannerURL({ size: 4096 }))
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'invite': async () => {
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: 'Invite Me!', 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('🔗 Add me to your server!')
                .setDescription('> **Click the link below to invite me!**')
                .addFields(
                    { 
                        name: '🤖 Bot Invite', 
                        value: `[Click Here](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)`, 
                        inline: true 
                    },
                    { 
                        name: '📊 Features', 
                        value: '```\n• 100+ Commands\n• AI Chat\n• Economy\n• Moderation\n• Fun Games\n• Leveling```', 
                        inline: true 
                    }
                )
                .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'uptime': async () => {
            const uptime = client.uptime;
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor(uptime / 3600000) % 24;
            const minutes = Math.floor(uptime / 60000) % 60;
            const seconds = Math.floor(uptime / 1000) % 60;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('⏱️ Bot Uptime')
                .setDescription(`> **I've been online for:**\n\`\`\`${days} Days : ${hours} Hours : ${minutes} Minutes : ${seconds} Seconds\`\`\``)
                .addFields(
                    { 
                        name: '📅 Days', 
                        value: `\`\`\`${days}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '⏰ Hours', 
                        value: `\`\`\`${hours}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '⏱️ Minutes', 
                        value: `\`\`\`${minutes}\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'membercount': async () => {
            const guild = msg.guild;
            const humans = guild.members.cache.filter(m => !m.user.bot).size;
            const bots = guild.members.cache.filter(m => m.user.bot).size;
            const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
            const idle = guild.members.cache.filter(m => m.presence?.status === 'idle').size;
            const dnd = guild.members.cache.filter(m => m.presence?.status === 'dnd').size;
            const offline = guild.memberCount - online - idle - dnd;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.info)
                .setAuthor({ 
                    name: `${guild.name} Members`, 
                    iconURL: guild.iconURL({ dynamic: true }) 
                })
                .setTitle('👥 Member Statistics')
                .addFields(
                    { 
                        name: '👥 Total Members', 
                        value: `\`\`\`${formatNumber(guild.memberCount)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '👤 Humans', 
                        value: `\`\`\`${formatNumber(humans)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🤖 Bots', 
                        value: `\`\`\`${formatNumber(bots)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🟢 Online', 
                        value: `\`\`\`${formatNumber(online)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🟡 Idle', 
                        value: `\`\`\`${formatNumber(idle)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🔴 DND', 
                        value: `\`\`\`${formatNumber(dnd)}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '⚫ Offline', 
                        value: `\`\`\`${formatNumber(offline)}\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'emojis': async () => {
            const emojis = msg.guild.emojis.cache;
            
            if (emojis.size === 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **This server has no custom emojis!**')
                    ]
                });
            }
            
            const normal = emojis.filter(e => !e.animated).map(e => e.toString()).slice(0, 50).join(' ');
            const animated = emojis.filter(e => e.animated).map(e => e.toString()).slice(0, 50).join(' ');
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: `${msg.guild.name} Emojis`, 
                    iconURL: msg.guild.iconURL({ dynamic: true }) 
                })
                .setTitle('😀 Server Emojis')
                .setFooter({ 
                    text: `Total: ${emojis.size} emojis`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            if (normal) {
                embed.addFields({ 
                    name: `😀 Normal Emojis (${emojis.filter(e => !e.animated).size})`, 
                    value: normal || '`None`' 
                });
            }
            
            if (animated) {
                embed.addFields({ 
                    name: `<a:emoji:123> Animated Emojis (${emojis.filter(e => e.animated).size})`, 
                    value: animated || '`None`' 
                });
            }
            
            msg.reply({ embeds: [embed] });
        },
        
        'roles': async () => {
            const roles = msg.guild.roles.cache
                .sort((a, b) => b.position - a.position)
                .filter(r => r.id !== msg.guild.id)
                .map((r, i) => `\`${i + 1}.\` ${r} - \`${r.members.size}\` members`)
                .join('\n');
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: `${msg.guild.name} Roles`, 
                    iconURL: msg.guild.iconURL({ dynamic: true }) 
                })
                .setTitle('🎭 Server Roles')
                .setDescription(roles.slice(0, 4096) || '`No roles`')
                .setFooter({ 
                    text: `Total: ${msg.guild.roles.cache.size - 1} roles`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'boosters': async () => {
            const boosters = msg.guild.members.cache.filter(m => m.premiumSince);
            
            if (boosters.size === 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **This server has no boosters!**')
                    ]
                });
            }
            
            const list = boosters
                .sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp)
                .map((m, i) => `\`${i + 1}.\` ${m.user.tag} - <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`)
                .join('\n');
            
            const embed = new Discord.EmbedBuilder()
                .setColor('#FF73FA')
                .setAuthor({ 
                    name: `${msg.guild.name} Boosters`, 
                    iconURL: msg.guild.iconURL({ dynamic: true }) 
                })
                .setTitle('💎 Server Boosters')
                .setDescription(list.slice(0, 4096))
                .addFields(
                    { 
                        name: '💎 Total Boosts', 
                        value: `\`\`\`${msg.guild.premiumSubscriptionCount}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🚀 Boost Tier', 
                        value: `\`\`\`Tier ${msg.guild.premiumTier}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '👥 Boosters', 
                        value: `\`\`\`${boosters.size}\`\`\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'meme': async () => {
            try {
                const res = await axios.get('https://meme-api.com/gimme');
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle(res.data.title)
                    .setURL(res.data.postLink)
                    .setImage(res.data.url)
                    .setFooter({ 
                        text: `👍 ${res.data.ups} upvotes | r/${res.data.subreddit}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to fetch meme! Please try again.**')
                    ]
                });
            }
        },
        
        'joke': async () => {
            try {
                const res = await axios.get('https://official-joke-api.appspot.com/random_joke');
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle('😂 Random Joke')
                    .setDescription(`${res.data.setup}\n\n||${res.data.punchline}||`)
                    .setFooter({ 
                        text: `Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to fetch joke! Please try again.**')
                    ]
                });
            }
        },
        
        '8ball': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Please ask a question!**\n> Usage: `!8ball <question>`')
                    ]
                });
            }
            
            const responses = [
                { text: 'Yes', emoji: '✅', color: config.colors.success },
                { text: 'No', emoji: '❌', color: config.colors.error },
                { text: 'Maybe', emoji: '🤔', color: config.colors.warning },
                { text: 'Definitely', emoji: '💯', color: config.colors.success },
                { text: 'Absolutely not', emoji: '🚫', color: config.colors.error },
                { text: 'I don\'t think so', emoji: '❓', color: config.colors.warning },
                { text: 'Ask again later', emoji: '⏰', color: config.colors.info },
                { text: 'Cannot predict now', emoji: '🔮', color: config.colors.info },
                { text: 'Outlook good', emoji: '👍', color: config.colors.success },
                { text: 'Very doubtful', emoji: '👎', color: config.colors.error },
                { text: 'Yes definitely', emoji: '🎯', color: config.colors.success },
                { text: 'Reply hazy', emoji: '⚠️', color: config.colors.warning },
                { text: 'Without a doubt', emoji: '✨', color: config.colors.success },
                { text: 'Most likely', emoji: '🌟', color: config.colors.success },
                { text: 'It is certain', emoji: '🔥', color: config.colors.success },
                { text: 'Signs point to yes', emoji: '💫', color: config.colors.success }
            ];
            
            const answer = responses[Math.floor(Math.random() * responses.length)];
            
            const embed = new Discord.EmbedBuilder()
                .setColor(answer.color)
                .setTitle('🎱 Magic 8-Ball')
                .addFields(
                    { 
                        name: '❓ Question', 
                        value: `> ${args.join(' ')}` 
                    },
                    { 
                        name: '💬 Answer', 
                        value: `> ${answer.emoji} **${answer.text}**` 
                    }
                )
                .setFooter({ 
                    text: `Asked by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'flip': async () => {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            const emoji = result === 'Heads' ? '🪙' : '🎴';
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('🪙 Coin Flip')
                .setDescription(`> ${emoji} **The coin landed on: ${result}!**`)
                .setFooter({ 
                    text: `Flipped by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'dice': async () => {
            const result = Math.floor(Math.random() * 6) + 1;
            const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('🎲 Dice Roll')
                .setDescription(`> ${diceEmojis[result - 1]} **You rolled: ${result}!**`)
                .setFooter({ 
                    text: `Rolled by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'rps': async () => {
            const choices = ['rock', 'paper', 'scissors'];
            const userChoice = args[0]?.toLowerCase();
            
            if (!userChoice || !choices.includes(userChoice)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Choose:** `rock`, `paper`, or `scissors`\n> Usage: `!rps <choice>`')
                    ]
                });
            }
            
            const botChoice = choices[Math.floor(Math.random() * choices.length)];
            const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
            
            let result, color;
            if (userChoice === botChoice) {
                result = '🤝 It\'s a tie!';
                color = config.colors.warning;
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                result = '🎉 You won!';
                color = config.colors.success;
            } else {
                result = '😢 You lost!';
                color = config.colors.error;
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(color)
                .setTitle('🎮 Rock Paper Scissors')
                .addFields(
                    { 
                        name: 'Your Choice', 
                        value: `> ${emojis[userChoice]} **${userChoice}**`, 
                        inline: true 
                    },
                    { 
                        name: 'Bot Choice', 
                        value: `> ${emojis[botChoice]} **${botChoice}**`, 
                        inline: true 
                    },
                    { 
                        name: 'Result', 
                        value: `> ${result}`, 
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Played by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'rate': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide something to rate!**\n> Usage: `!rate <thing>`')
                    ]
                });
            }
            
            const rating = Math.floor(Math.random() * 11);
            const stars = '⭐'.repeat(rating) + '☆'.repeat(10 - rating);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('⭐ Rating System')
                .setDescription(`> **I'd rate ${args.join(' ')}**\n\n${stars}\n\n**${rating}/10**`)
                .setFooter({ 
                    text: `Rated by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'roast': async () => {
            const user = msg.mentions.users.first() || msg.author;
            const roasts = [
                'I\'d agree with you but then we\'d both be wrong.',
                'You\'re not stupid; you just have bad luck thinking.',
                'I would ask how old you are, but I know you can\'t count that high.',
                'If laughter is the best medicine, your face must be curing the world.',
                'You bring everyone so much joy... when you leave the room.',
                'I\'m jealous of people who don\'t know you.',
                'You have delusions of adequacy.',
                'Some day you\'ll go far... and I hope you stay there.',
                'I would challenge you to a battle of wits, but I see you are unarmed.',
                'Your secrets are always safe with me. I never even listen when you tell me them.'
            ];
            
            const embed = new Discord.EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔥 Roasted!')
                .setDescription(`> **${user}**, ${roasts[Math.floor(Math.random() * roasts.length)]}`)
                .setFooter({ 
                    text: `Roasted by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'compliment': async () => {
            const user = msg.mentions.users.first() || msg.author;
            const compliments = [
                'You\'re an awesome friend!',
                'You light up the room!',
                'You deserve a hug right now!',
                'You\'re a smart cookie!',
                'You have impeccable manners!',
                'You\'re really something special!',
                'You\'re a great listener!',
                'Your smile is contagious!',
                'You\'re more helpful than you realize!',
                'You\'re an inspiration to everyone around you!'
            ];
            
            const embed = new Discord.EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('💝 Compliment')
                .setDescription(`> **${user}**, ${compliments[Math.floor(Math.random() * compliments.length)]}`)
                .setFooter({ 
                    text: `From ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'advice': async () => {
            try {
                const res = await axios.get('https://api.adviceslip.com/advice');
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle('💡 Random Advice')
                    .setDescription(`> ${res.data.slip.advice}`)
                    .setFooter({ 
                        text: `Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to fetch advice!**')
                    ]
                });
            }
        },
        
        'fact': async () => {
            try {
                const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle('📚 Random Fact')
                    .setDescription(`> ${res.data.text}`)
                    .setFooter({ 
                        text: `Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to fetch fact!**')
                    ]
                });
            }
        },
        
        'quote': async () => {
            try {
                const res = await axios.get('https://api.quotable.io/random');
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle('💬 Random Quote')
                    .setDescription(`> "${res.data.content}"\n\n**— ${res.data.author}**`)
                    .setFooter({ 
                        text: `Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to fetch quote!**')
                    ]
                });
            }
        },
        
        'ai': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Please provide a message!**\n> Usage: `!ai <message>`')
                    ]
                });
            }
            
            await msg.channel.sendTyping();
            
            try {
                const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(args.join(' '))}&owner=${msg.author.username}&botname=${client.user.username}`);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setAuthor({ 
                        name: 'AI Chatbot', 
                        iconURL: client.user.displayAvatarURL() 
                    })
                    .setTitle('🤖 AI Response')
                    .addFields(
                        { 
                            name: '👤 Your Message', 
                            value: `> ${args.join(' ')}` 
                        },
                        { 
                            name: '🤖 AI Response', 
                            value: `> ${res.data.response || 'No response received.'}` 
                        }
                    )
                    .setFooter({ 
                        text: `Conversation with ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                console.error('AI Error:', error);
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **AI service is currently unavailable! Please try again later.**')
                    ]
                });
            }
        },
        
        'chat': async () => commands['ai'](),
        'ask': async () => commands['ai'](),
        
        'weather': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a city name!**\n> Usage: `!weather <city>`')
                    ]
                });
            }
            
            try {
                const city = args.join(' ');
                const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
                const data = res.data.current_condition[0];
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle(`🌤️ Weather in ${city}`)
                    .addFields(
                        { 
                            name: '🌡️ Temperature', 
                            value: `\`${data.temp_C}°C / ${data.temp_F}°F\``, 
                            inline: true 
                        },
                        { 
                            name: '💨 Wind Speed', 
                            value: `\`${data.windspeedKmph} km/h\``, 
                            inline: true 
                        },
                        { 
                            name: '💧 Humidity', 
                            value: `\`${data.humidity}%\``, 
                            inline: true 
                        },
                        { 
                            name: '☁️ Condition', 
                            value: `\`${data.weatherDesc[0].value}\``, 
                            inline: true 
                        },
                        { 
                            name: '👁️ Visibility', 
                            value: `\`${data.visibility} km\``, 
                            inline: true 
                        },
                        { 
                            name: '🌡️ Feels Like', 
                            value: `\`${data.FeelsLikeC}°C\``, 
                            inline: true 
                        }
                    )
                    .setFooter({ 
                        text: `Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **City not found or weather service unavailable!**')
                    ]
                });
            }
        },
        
        'calculate': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a math expression!**\n> Usage: `!calculate 5 + 5`')
                    ]
                });
            }
            
            try {
                const expression = args.join(' ').replace(/[^0-9+\-*/().]/g, '');
                const result = eval(expression);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🔢 Calculator')
                    .addFields(
                        { 
                            name: '📥 Expression', 
                            value: `\`\`\`${expression}\`\`\`` 
                        },
                        { 
                            name: '📤 Result', 
                            value: `\`\`\`${result}\`\`\`` 
                        }
                    )
                    .setFooter({ 
                        text: `Requested by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid math expression!**')
                    ]
                });
            }
        },
        
        'bal': async () => {
            const user = msg.mentions.users.first() || msg.author;
            const data = economy.get(user.id) || { coins: 0, bank: 0 };
            
            const totalWealth = data.coins + data.bank;
            const wealthRank = Array.from(economy.entries())
                .sort((a, b) => (b[1].coins + b[1].bank) - (a[1].coins + a[1].bank))
                .findIndex(e => e[0] === user.id) + 1;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.economy)
                .setAuthor({ 
                    name: `${user.username}'s Balance`, 
                    iconURL: user.displayAvatarURL() 
                })
                .setTitle('💰 Economy Balance')
                .addFields(
                    { 
                        name: '💵 Wallet', 
                        value: `\`\`\`${formatNumber(data.coins)} coins\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🏦 Bank', 
                        value: `\`\`\`${formatNumber(data.bank)} coins\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '💰 Total Wealth', 
                        value: `\`\`\`${formatNumber(totalWealth)} coins\`\`\``, 
                        inline: true 
                    }
                )
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ 
                    text: `Wealth Rank: #${wealthRank || 'Unranked'} | ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'balance': async () => commands['bal'](),
        
        'daily': async () => {
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            const lastDaily = data.lastDaily || 0;
            const now = Date.now();
            
            if (now - lastDaily < 86400000) {
                const timeLeft = 86400000 - (now - lastDaily);
                const hours = Math.floor(timeLeft / 3600000);
                const minutes = Math.floor((timeLeft % 3600000) / 60000);
                
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle('❌ Daily Already Claimed!')
                            .setDescription(`> You already claimed your daily reward!\n> Come back in **${hours}h ${minutes}m**`)
                            .setTimestamp()
                    ]
                });
            }
            
            const amount = Math.floor(Math.random() * 500) + 500;
            const bonus = Math.random() < 0.1 ? Math.floor(amount * 0.5) : 0;
            const total = amount + bonus;
            
            data.coins += total;
            data.lastDaily = now;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎁 Daily Reward Claimed!')
                .setDescription(`> You received your daily reward!`)
                .addFields(
                    { 
                        name: '💰 Base Reward', 
                        value: `\`${formatNumber(amount)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '🎉 Bonus', 
                        value: bonus > 0 ? `\`${formatNumber(bonus)} coins\`\n*(Lucky!)*` : '`0 coins`', 
                        inline: true 
                    },
                    { 
                        name: '💵 Total Earned', 
                        value: `\`${formatNumber(total)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '🏦 New Balance', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Come back tomorrow! | ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'weekly': async () => {
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            const lastWeekly = data.lastWeekly || 0;
            const now = Date.now();
            
            if (now - lastWeekly < 604800000) {
                const timeLeft = 604800000 - (now - lastWeekly);
                const days = Math.floor(timeLeft / 86400000);
                const hours = Math.floor((timeLeft % 86400000) / 3600000);
                
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle('❌ Weekly Already Claimed!')
                            .setDescription(`> You already claimed your weekly reward!\n> Come back in **${days}d ${hours}h**`)
                            .setTimestamp()
                    ]
                });
            }
            
            const amount = Math.floor(Math.random() * 2000) + 3000;
            const bonus = Math.random() < 0.15 ? Math.floor(amount * 0.5) : 0;
            const total = amount + bonus;
            
            data.coins += total;
            data.lastWeekly = now;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🎉 Weekly Reward Claimed!')
                .setDescription(`> You received your weekly reward!`)
                .addFields(
                    { 
                        name: '💰 Base Reward', 
                        value: `\`${formatNumber(amount)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '🎁 Bonus', 
                        value: bonus > 0 ? `\`${formatNumber(bonus)} coins\`\n*(Jackpot!)*` : '`0 coins`', 
                        inline: true 
                    },
                    { 
                        name: '💵 Total Earned', 
                        value: `\`${formatNumber(total)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '🏦 New Balance', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Come back next week! | ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'work': async () => {
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            const lastWork = data.lastWork || 0;
            const now = Date.now();
            
            if (now - lastWork < 3600000) {
                const timeLeft = 3600000 - (now - lastWork);
                const minutes = Math.floor(timeLeft / 60000);
                
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle('❌ You\'re Tired!')
                            .setDescription(`> You need to rest before working again!\n> Come back in **${minutes} minutes**`)
                            .setTimestamp()
                    ]
                });
            }
            
            const jobs = [
                { name: '💻 Developer', pay: [400, 800], emoji: '💻' },
                { name: '👨‍🏫 Teacher', pay: [300, 600], emoji: '👨‍🏫' },
                { name: '⚕️ Doctor', pay: [500, 1000], emoji: '⚕️' },
                { name: '👨‍🍳 Chef', pay: [250, 500], emoji: '👨‍🍳' },
                { name: '🎨 Artist', pay: [200, 700], emoji: '🎨' },
                { name: '🚗 Driver', pay: [150, 400], emoji: '🚗' },
                { name: '🎭 Actor', pay: [300, 900], emoji: '🎭' },
                { name: '✍️ Writer', pay: [200, 600], emoji: '✍️' }
            ];
            
            const job = jobs[Math.floor(Math.random() * jobs.length)];
            const amount = Math.floor(Math.random() * (job.pay[1] - job.pay[0])) + job.pay[0];
            
            data.coins += amount;
            data.lastWork = now;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('💼 Work Complete!')
                .setDescription(`> You worked as a **${job.name}** and earned coins!`)
                .addFields(
                    { 
                        name: '💰 Earned', 
                        value: `\`${formatNumber(amount)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '💵 New Balance', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Work again in 1 hour | ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'beg': async () => {
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            const lastBeg = data.lastBeg || 0;
            const now = Date.now();
            
            if (now - lastBeg < 60000) {
                const timeLeft = 60000 - (now - lastBeg);
                const seconds = Math.ceil(timeLeft / 1000);
                
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription(`❌ **You can beg again in ${seconds} seconds!**`)
                    ]
                });
            }
            
            const people = [
                { name: 'Elon Musk', emoji: '🚀' },
                { name: 'Bill Gates', emoji: '💻' },
                { name: 'Jeff Bezos', emoji: '📦' },
                { name: 'Mark Zuckerberg', emoji: '📘' },
                { name: 'Warren Buffett', emoji: '💰' },
                { name: 'A kind stranger', emoji: '😇' }
            ];
            
            const person = people[Math.floor(Math.random() * people.length)];
            const amount = Math.floor(Math.random() * 100) + 50;
            
            data.coins += amount;
            data.lastBeg = now;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🤲 Begging Success!')
                .setDescription(`> ${person.emoji} **${person.name}** gave you **${formatNumber(amount)} coins**!`)
                .addFields({ 
                    name: '💵 New Balance', 
                    value: `\`${formatNumber(data.coins)} coins\`` 
                })
                .setFooter({ 
                    text: `${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'gamble': async () => {
            const amount = parseInt(args[0]);
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            
            if (!amount || amount < 1) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a valid amount!**\n> Usage: `!gamble <amount>`')
                    ]
                });
            }
            
            if (amount > data.coins) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription(`❌ **You don't have enough coins!**\n> Your balance: \`${formatNumber(data.coins)} coins\``)
                    ]
                });
            }
            
            const win = Math.random() < 0.5;
            
            if (win) {
                data.coins += amount;
                economy.set(msg.author.id, data);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🎰 You Won!')
                    .setDescription(`> Congratulations! You won the gamble!`)
                    .addFields(
                        { 
                            name: '💰 Won', 
                            value: `\`+${formatNumber(amount)} coins\``, 
                            inline: true 
                        },
                        { 
                            name: '💵 New Balance', 
                            value: `\`${formatNumber(data.coins)} coins\``, 
                            inline: true 
                        }
                    )
                    .setFooter({ 
                        text: `${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } else {
                data.coins -= amount;
                economy.set(msg.author.id, data);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle('🎰 You Lost!')
                    .setDescription(`> Better luck next time!`)
                    .addFields(
                        { 
                            name: '💸 Lost', 
                            value: `\`-${formatNumber(amount)} coins\``, 
                            inline: true 
                        },
                        { 
                            name: '💵 New Balance', 
                            value: `\`${formatNumber(data.coins)} coins\``, 
                            inline: true 
                        }
                    )
                    .setFooter({ 
                        text: `${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            }
        },
        
        'slots': async () => {
            const bet = parseInt(args[0]) || 100;
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            
            if (bet > data.coins) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription(`❌ **You don't have enough coins!**\n> Your balance: \`${formatNumber(data.coins)} coins\``)
                    ]
                });
            }
            
            const emojis = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎', '7️⃣'];
            const slots = [
                emojis[Math.floor(Math.random() * emojis.length)],
                emojis[Math.floor(Math.random() * emojis.length)],
                emojis[Math.floor(Math.random() * emojis.length)]
            ];
            
            let winAmount = 0;
            let message = '';
            
            if (slots[0] === slots[1] && slots[1] === slots[2]) {
                winAmount = bet * 5;
                message = '🎉 **JACKPOT! All match!**';
            } else if (slots[0] === slots[1] || slots[1] === slots[2] || slots[0] === slots[2]) {
                winAmount = bet * 2;
                message = '✅ **Two match!**';
            } else {
                winAmount = -bet;
                message = '❌ **No match! You lost!**';
            }
            
            data.coins += winAmount;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(winAmount > 0 ? config.colors.success : config.colors.error)
                .setTitle('🎰 Slot Machine')
                .setDescription(`╔═══════╗\n║ ${slots.join(' | ')} ║\n╚═══════╝\n\n${message}`)
                .addFields(
                    { 
                        name: winAmount > 0 ? '💰 Won' : '💸 Lost', 
                        value: `\`${winAmount > 0 ? '+' : ''}${formatNumber(winAmount)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '💵 New Balance', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'coinflip': async () => {
            const bet = parseInt(args[0]);
            const choice = args[1]?.toLowerCase();
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            
            if (!bet || bet < 1) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid usage!**\n> Usage: `!coinflip <amount> <heads/tails>`')
                    ]
                });
            }
            
            if (!choice || !['heads', 'tails', 'h', 't'].includes(choice)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Choose heads or tails!**\n> Usage: `!coinflip <amount> <heads/tails>`')
                    ]
                });
            }
            
            if (bet > data.coins) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription(`❌ **You don't have enough coins!**\n> Your balance: \`${formatNumber(data.coins)} coins\``)
                    ]
                });
            }
            
            const userChoice = choice.startsWith('h') ? 'heads' : 'tails';
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const win = result === userChoice;
            
            if (win) {
                data.coins += bet;
                economy.set(msg.author.id, data);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🪙 Coin Flip - WIN!')
                    .setDescription(`> The coin landed on **${result}**!\n> You won!`)
                    .addFields(
                        { 
                            name: '💰 Won', 
                            value: `\`+${formatNumber(bet)} coins\``, 
                            inline: true 
                        },
                        { 
                            name: '💵 New Balance', 
                            value: `\`${formatNumber(data.coins)} coins\``, 
                            inline: true 
                        }
                    )
                    .setFooter({ 
                        text: `${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } else {
                data.coins -= bet;
                economy.set(msg.author.id, data);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle('🪙 Coin Flip - LOSS!')
                    .setDescription(`> The coin landed on **${result}**!\n> You lost!`)
                    .addFields(
                        { 
                            name: '💸 Lost', 
                            value: `\`-${formatNumber(bet)} coins\``, 
                            inline: true 
                        },
                        { 
                            name: '💵 New Balance', 
                            value: `\`${formatNumber(data.coins)} coins\``, 
                            inline: true 
                        }
                    )
                    .setFooter({ 
                        text: `${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            }
        },
        
        'deposit': async () => {
            const amount = args[0] === 'all' ? 'all' : parseInt(args[0]);
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            
            if (!amount || (amount !== 'all' && amount < 1)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid amount!**\n> Usage: `!deposit <amount>` or `!deposit all`')
                    ]
                });
            }
            
            const depositAmount = amount === 'all' ? data.coins : Math.min(amount, data.coins);
            
            if (depositAmount <= 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You don\'t have enough coins to deposit!**')
                    ]
                });
            }
            
            data.coins -= depositAmount;
            data.bank += depositAmount;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🏦 Deposit Successful')
                .setDescription(`> Successfully deposited coins to your bank!`)
                .addFields(
                    { 
                        name: '💰 Deposited', 
                        value: `\`${formatNumber(depositAmount)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '💵 Wallet', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '🏦 Bank', 
                        value: `\`${formatNumber(data.bank)} coins\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'withdraw': async () => {
            const amount = args[0] === 'all' ? 'all' : parseInt(args[0]);
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            
            if (!amount || (amount !== 'all' && amount < 1)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid amount!**\n> Usage: `!withdraw <amount>` or `!withdraw all`')
                    ]
                });
            }
            
            const withdrawAmount = amount === 'all' ? data.bank : Math.min(amount, data.bank);
            
            if (withdrawAmount <= 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You don\'t have enough coins in your bank!**')
                    ]
                });
            }
            
            data.bank -= withdrawAmount;
            data.coins += withdrawAmount;
            economy.set(msg.author.id, data);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🏦 Withdrawal Successful')
                .setDescription(`> Successfully withdrew coins from your bank!`)
                .addFields(
                    { 
                        name: '💰 Withdrawn', 
                        value: `\`${formatNumber(withdrawAmount)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '💵 Wallet', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '🏦 Bank', 
                        value: `\`${formatNumber(data.bank)} coins\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'give': async () => {
            const user = msg.mentions.users.first();
            const amount = parseInt(args[1]);
            
            if (!user) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a user!**\n> Usage: `!give @user <amount>`')
                    ]
                });
            }
            
            if (!amount || amount < 1) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a valid amount!**\n> Usage: `!give @user <amount>`')
                    ]
                });
            }
            
            if (user.id === msg.author.id) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You can\'t give coins to yourself!**')
                    ]
                });
            }
            
            const data = economy.get(msg.author.id) || { coins: 0, bank: 0 };
            
            if (amount > data.coins) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription(`❌ **You don't have enough coins!**\n> Your balance: \`${formatNumber(data.coins)} coins\``)
                    ]
                });
            }
            
            const recipientData = economy.get(user.id) || { coins: 0, bank: 0 };
            
            data.coins -= amount;
            recipientData.coins += amount;
            economy.set(msg.author.id, data);
            economy.set(user.id, recipientData);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('💸 Transfer Complete')
                .setDescription(`> You gave **${formatNumber(amount)} coins** to ${user}!`)
                .addFields(
                    { 
                        name: '💵 Your Balance', 
                        value: `\`${formatNumber(data.coins)} coins\``, 
                        inline: true 
                    },
                    { 
                        name: '💰 Their Balance', 
                        value: `\`${formatNumber(recipientData.coins)} coins\``, 
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'leaderboard': async () => {
            const sorted = Array.from(economy.entries())
                .sort((a, b) => (b[1].coins + b[1].bank) - (a[1].coins + a[1].bank))
                .slice(0, 10);
            
            if (sorted.length === 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **No economy data yet!**')
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.economy)
                .setTitle('💰 Economy Leaderboard')
                .setDescription('> **Top 10 Richest Users**\n\n' + sorted.map((entry, i) => {
                    const user = client.users.cache.get(entry[0]);
                    const medals = ['🥇', '🥈', '🥉'];
                    const medal = medals[i] || `**${i + 1}.**`;
                    const total = entry[1].coins + entry[1].bank;
                    return `${medal} ${user ? user.tag : 'Unknown'} - \`${formatNumber(total)} coins\``;
                }).join('\n'))
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'shop': async () => {
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.economy)
                .setTitle('🛒 Shop')
                .setDescription('> **Available Items**\n\n`🎫` **VIP Role** - `10,000 coins`\n`🎨` **Custom Color** - `5,000 coins`\n`🏆` **Trophy Badge** - `15,000 coins`\n`🎁` **Mystery Box** - `2,500 coins`')
                .setFooter({ 
                    text: `Use !buy <item> to purchase | ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'kick': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.KickMembers)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Kick Members permission!**')
                    ]
                });
            }
            
            const member = msg.mentions.members.first();
            
            if (!member) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a member to kick!**\n> Usage: `!kick @user [reason]`')
                    ]
                });
            }
            
            if (!member.kickable) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **I cannot kick this member!**')
                    ]
                });
            }
            
            const reason = args.slice(1).join(' ') || 'No reason provided';
            
            await member.kick(reason);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('👢 Member Kicked')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { 
                        name: '👤 User', 
                        value: `${member.user.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '👮 Moderator', 
                        value: `${msg.author.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Reason', 
                        value: reason 
                    }
                )
                .setFooter({ 
                    text: `ID: ${member.id}` 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'ban': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.BanMembers)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Ban Members permission!**')
                    ]
                });
            }
            
            const member = msg.mentions.members.first();
            
            if (!member) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a member to ban!**\n> Usage: `!ban @user [reason]`')
                    ]
                });
            }
            
            if (!member.bannable) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **I cannot ban this member!**')
                    ]
                });
            }
            
            const reason = args.slice(1).join(' ') || 'No reason provided';
            
            await member.ban({ reason });
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('🔨 Member Banned')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { 
                        name: '👤 User', 
                        value: `${member.user.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '👮 Moderator', 
                        value: `${msg.author.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Reason', 
                        value: reason 
                    }
                )
                .setFooter({ 
                    text: `ID: ${member.id}` 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'unban': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.BanMembers)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Ban Members permission!**')
                    ]
                });
            }
            
            const userId = args[0];
            
            if (!userId) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a user ID!**\n> Usage: `!unban <userID>`')
                    ]
                });
            }
            
            try {
                await msg.guild.members.unban(userId);
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('✅ Member Unbanned')
                    .addFields(
                        { 
                            name: '👤 User ID', 
                            value: userId, 
                            inline: true 
                        },
                        { 
                            name: '👮 Moderator', 
                            value: `${msg.author.tag}`, 
                            inline: true 
                        }
                    )
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to unban user! Make sure the ID is correct.**')
                    ]
                });
            }
        },
        
        'timeout': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ModerateMembers)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Timeout Members permission!**')
                    ]
                });
            }
            
            const member = msg.mentions.members.first();
            const duration = parseInt(args[1]) || 5;
            const reason = args.slice(2).join(' ') || 'No reason provided';
            
            if (!member) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a member!**\n> Usage: `!timeout @user <minutes> [reason]`')
                    ]
                });
            }
            
            if (!member.moderatable) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **I cannot timeout this member!**')
                    ]
                });
            }
            
            await member.timeout(duration * 60 * 1000, reason);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('⏱️ Member Timed Out')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { 
                        name: '👤 User', 
                        value: `${member.user.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '⏰ Duration', 
                        value: `${duration} minutes`, 
                        inline: true 
                    },
                    { 
                        name: '👮 Moderator', 
                        value: `${msg.author.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '📝 Reason', 
                        value: reason 
                    }
                )
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'warn': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ModerateMembers)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Moderate Members permission!**')
                    ]
                });
            }
            
            const member = msg.mentions.members.first();
            
            if (!member) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a member!**\n> Usage: `!warn @user [reason]`')
                    ]
                });
            }
            
            const reason = args.slice(1).join(' ') || 'No reason provided';
            
            const userWarnings = warnings.get(member.id) || [];
            userWarnings.push({
                reason,
                moderator: msg.author.id,
                timestamp: Date.now()
            });
            warnings.set(member.id, userWarnings);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('⚠️ Member Warned')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { 
                        name: '👤 User', 
                        value: `${member.user.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '👮 Moderator', 
                        value: `${msg.author.tag}`, 
                        inline: true 
                    },
                    { 
                        name: '🔢 Total Warnings', 
                        value: `\`${userWarnings.length}\``, 
                        inline: true 
                    },
                    { 
                        name: '📝 Reason', 
                        value: reason 
                    }
                )
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'warnings': async () => {
            const member = msg.mentions.members.first() || msg.member;
            const userWarnings = warnings.get(member.id) || [];
            
            if (userWarnings.length === 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.success)
                            .setDescription(`✅ **${member.user.tag} has no warnings!**`)
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.warning)
                .setAuthor({ 
                    name: `${member.user.tag}'s Warnings`, 
                    iconURL: member.user.displayAvatarURL() 
                })
                .setDescription(
                    userWarnings.map((w, i) => {
                        const mod = client.users.cache.get(w.moderator);
                        return `**${i + 1}.** ${w.reason}\n> *By: ${mod ? mod.tag : 'Unknown'} | <t:${Math.floor(w.timestamp / 1000)}:R>*`;
                    }).join('\n\n')
                )
                .setFooter({ 
                    text: `Total: ${userWarnings.length} warnings` 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'clearwarns': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ModerateMembers)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Moderate Members permission!**')
                    ]
                });
            }
            
            const member = msg.mentions.members.first();
            
            if (!member) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a member!**\n> Usage: `!clearwarns @user`')
                    ]
                });
            }
            
            warnings.delete(member.id);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('✅ Warnings Cleared')
                .setDescription(`> Successfully cleared all warnings for ${member.user.tag}`)
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'clear': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageMessages)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Messages permission!**')
                    ]
                });
            }
            
            const amount = parseInt(args[0]);
            
            if (!amount || amount < 1 || amount > 100) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a number between 1-100!**\n> Usage: `!clear <amount>`')
                    ]
                });
            }
            
            const deleted = await msg.channel.bulkDelete(amount, true);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🧹 Messages Cleared')
                .setDescription(`> Successfully deleted **${deleted.size}** messages!`)
                .setTimestamp();
            
            const reply = await msg.channel.send({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
        },
        
        'purge': async () => commands['clear'](),
        
        'nuke': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Channels permission!**')
                    ]
                });
            }
            
            const channel = msg.channel;
            const position = channel.position;
            
            const newChannel = await channel.clone();
            await newChannel.setPosition(position);
            await channel.delete();
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('💣 Channel Nuked!')
                .setDescription('> Channel has been successfully nuked and recreated!')
                .setImage('https://media.tenor.com/9oy0j_w16rIAAAAC/explosion.gif')
                .setTimestamp();
            
            newChannel.send({ embeds: [embed] });
        },
        
        'lock': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Channels permission!**')
                    ]
                });
            }
            
            await msg.channel.permissionOverwrites.edit(msg.guild.id, {
                SendMessages: false
            });
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('🔒 Channel Locked')
                .setDescription('> This channel has been locked. Only moderators can send messages.')
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'unlock': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Channels permission!**')
                    ]
                });
            }
            
            await msg.channel.permissionOverwrites.edit(msg.guild.id, {
                SendMessages: null
            });
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🔓 Channel Unlocked')
                .setDescription('> This channel has been unlocked. Everyone can send messages again.')
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'slowmode': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageChannels)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Channels permission!**')
                    ]
                });
            }
            
            const seconds = parseInt(args[0]);
            
            if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a number between 0-21600 seconds!**\n> Usage: `!slowmode <seconds>`')
                    ]
                });
            }
            
            await msg.channel.setRateLimitPerUser(seconds);
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🐌 Slowmode Updated')
                .setDescription(`> Slowmode set to **${seconds}** seconds!`)
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'rank': async () => {
            const user = msg.mentions.users.first() || msg.author;
            const userData = userXP.get(user.id) || { xp: 0, level: 1 };
            const xpNeeded = userData.level * 100;
            const progress = Math.floor((userData.xp / xpNeeded) * 20);
            const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);
            
            const leaderboardPos = Array.from(userXP.entries())
                .sort((a, b) => {
                    if (b[1].level !== a[1].level) return b[1].level - a[1].level;
                    return b[1].xp - a[1].xp;
                })
                .findIndex(e => e[0] === user.id) + 1;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.level)
                .setAuthor({ 
                    name: `${user.username}'s Rank Card`, 
                    iconURL: user.displayAvatarURL() 
                })
                .setTitle('🏆 Rank Information')
                .setThumbnail(user.displayAvatarURL({ size: 512 }))
                .addFields(
                    { 
                        name: '📊 Level', 
                        value: `\`\`\`${userData.level}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '⭐ XP', 
                        value: `\`\`\`${userData.xp}/${xpNeeded}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '🏅 Rank', 
                        value: `\`\`\`#${leaderboardPos || 'N/A'}\`\`\``, 
                        inline: true 
                    },
                    { 
                        name: '📈 Progress', 
                        value: `${progressBar} \`${Math.floor((userData.xp / xpNeeded) * 100)}%\`` 
                    }
                )
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'level': async () => commands['rank'](),
        
        'top': async () => {
            const sorted = Array.from(userXP.entries())
                .sort((a, b) => {
                    if (b[1].level !== a[1].level) return b[1].level - a[1].level;
                    return b[1].xp - a[1].xp;
                })
                .slice(0, 10);
            
            if (sorted.length === 0) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **No XP data yet!**')
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.level)
                .setTitle('🏆 XP Leaderboard - Top 10')
                .setDescription('> **Top leveled users in this server**\n\n' + sorted.map((entry, i) => {
                    const user = client.users.cache.get(entry[0]);
                    const medals = ['🥇', '🥈', '🥉'];
                    const medal = medals[i] || `**${i + 1}.**`;
                    return `${medal} ${user ? user.tag : 'Unknown'} - Level \`${entry[1].level}\` (XP: \`${entry[1].xp}\`)`;
                }).join('\n'))
                .setFooter({ 
                    text: `Requested by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'setxp': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            const user = msg.mentions.users.first();
            const amount = parseInt(args[1]);
            
            if (!user || !amount) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid usage!**\n> Usage: `!setxp @user <amount>`')
                    ]
                });
            }
            
            const userData = userXP.get(user.id) || { xp: 0, level: 1 };
            userData.xp = amount;
            userXP.set(user.id, userData);
            
            msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.success)
                        .setDescription(`✅ **Set ${user.tag}'s XP to \`${amount}\`**`)
                ]
            });
        },
        
        'addxp': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            const user = msg.mentions.users.first();
            const amount = parseInt(args[1]);
            
            if (!user || !amount) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid usage!**\n> Usage: `!addxp @user <amount>`')
                    ]
                });
            }
            
            const userData = userXP.get(user.id) || { xp: 0, level: 1 };
            userData.xp += amount;
            userXP.set(user.id, userData);
            
            msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.success)
                        .setDescription(`✅ **Added \`${amount}\` XP to ${user.tag}**`)
                ]
            });
        },
        
        'resetxp': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            const user = msg.mentions.users.first();
            
            if (!user) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Mention a user!**\n> Usage: `!resetxp @user`')
                    ]
                });
            }
            
            userXP.delete(user.id);
            
            msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.success)
                        .setDescription(`✅ **Reset XP for ${user.tag}**`)
                ]
            });
        },
        
        'giveaway': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Server permission!**')
                    ]
                });
            }
            
            await msg.reply('🎉 **Let\'s create a giveaway!**\n\n**What is the prize?**');
            
            const filter = m => m.author.id === msg.author.id;
            
            try {
                const prizeCollector = await msg.channel.awaitMessages({ 
                    filter, 
                    max: 1, 
                    time: 30000, 
                    errors: ['time'] 
                });
                const prize = prizeCollector.first().content;
                
                await msg.channel.send('⏰ **How long should it last?** (e.g., 1m, 1h, 1d)');
                const durationCollector = await msg.channel.awaitMessages({ 
                    filter, 
                    max: 1, 
                    time: 30000, 
                    errors: ['time'] 
                });
                const duration = durationCollector.first().content;
                
                await msg.channel.send('👥 **How many winners?**');
                const winnersCollector = await msg.channel.awaitMessages({ 
                    filter, 
                    max: 1, 
                    time: 30000, 
                    errors: ['time'] 
                });
                const winners = parseInt(winnersCollector.first().content);
                
                if (!winners || winners < 1) {
                    return msg.channel.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.colors.error)
                                .setDescription('❌ **Invalid number of winners!**')
                        ]
                    });
                }
                
                const timeMatch = duration.match(/^(\d+)([smhd])$/);
                if (!timeMatch) {
                    return msg.channel.send({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.colors.error)
                                .setDescription('❌ **Invalid duration format! Use: 1m, 1h, 1d**')
                        ]
                    });
                }
                
                const timeValue = parseInt(timeMatch[1]);
                const timeUnit = timeMatch[2];
                
                const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
                const endTime = Date.now() + (timeValue * multipliers[timeUnit]);
                
                const giveawayEmbed = new Discord.EmbedBuilder()
                    .setColor('#FF1493')
                    .setTitle('🎉 GIVEAWAY 🎉')
                    .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n\n**React with 🎉 to enter!**`)
                    .setFooter({ 
                        text: `Hosted by ${msg.author.tag}`, 
                        iconURL: msg.author.displayAvatarURL() 
                    })
                    .setTimestamp(endTime);
                
                const giveawayMsg = await msg.channel.send({ embeds: [giveawayEmbed] });
                await giveawayMsg.react('🎉');
                
                giveaways.set(giveawayMsg.id, {
                    prize,
                    winners,
                    endTime,
                    channelId: msg.channel.id,
                    hostId: msg.author.id
                });
                
                setTimeout(async () => {
                    try {
                        const message = await msg.channel.messages.fetch(giveawayMsg.id);
                        const reaction = message.reactions.cache.get('🎉');
                        
                        if (!reaction) {
                            return msg.channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.colors.error)
                                        .setDescription('❌ **No participants in the giveaway!**')
                                ]
                            });
                        }
                        
                        const users = await reaction.users.fetch();
                        const participants = users.filter(u => !u.bot).map(u => u);
                        
                        if (participants.length === 0) {
                            return msg.channel.send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(config.colors.error)
                                        .setDescription('❌ **No valid participants!**')
                                ]
                            });
                        }
                        
                        const winnersList = [];
                        for (let i = 0; i < Math.min(winners, participants.length); i++) {
                            const winner = participants[Math.floor(Math.random() * participants.length)];
                            winnersList.push(winner);
                            participants.splice(participants.indexOf(winner), 1);
                        }
                        
                        const winnerEmbed = new Discord.EmbedBuilder()
                            .setColor(config.colors.success)
                            .setTitle('🎉 Giveaway Ended!')
                            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnersList.join(', ')}\n\nCongratulations!`)
                            .setTimestamp();
                        
                        msg.channel.send({ 
                            content: `🎉 ${winnersList.join(', ')}`, 
                            embeds: [winnerEmbed] 
                        });
                        
                        giveaways.delete(giveawayMsg.id);
                    } catch (error) {
                        console.error('Giveaway error:', error);
                    }
                }, endTime - Date.now());
                
            } catch (error) {
                msg.channel.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Giveaway creation timed out or failed!**')
                    ]
                });
            }
        },
        
        'gstart': async () => commands['giveaway'](),
        
        'gend': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Server permission!**')
                    ]
                });
            }
            
            const messageId = args[0];
            
            if (!messageId) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a giveaway message ID!**\n> Usage: `!gend <messageID>`')
                    ]
                });
            }
            
            const giveaway = giveaways.get(messageId);
            
            if (!giveaway) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Giveaway not found!**')
                    ]
                });
            }
            
            try {
                const message = await msg.channel.messages.fetch(messageId);
                const reaction = message.reactions.cache.get('🎉');
                
                if (!reaction) {
                    return msg.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.colors.error)
                                .setDescription('❌ **No participants!**')
                        ]
                    });
                }
                
                const users = await reaction.users.fetch();
                const participants = users.filter(u => !u.bot).map(u => u);
                
                if (participants.length === 0) {
                    return msg.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.colors.error)
                                .setDescription('❌ **No valid participants!**')
                        ]
                    });
                }
                
                const winnersList = [];
                for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
                    const winner = participants[Math.floor(Math.random() * participants.length)];
                    winnersList.push(winner);
                    participants.splice(participants.indexOf(winner), 1);
                }
                
                const winnerEmbed = new Discord.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🎉 Giveaway Ended!')
                    .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnersList.join(', ')}\n\nCongratulations!`)
                    .setTimestamp();
                
                msg.channel.send({ 
                    content: `🎉 ${winnersList.join(', ')}`, 
                    embeds: [winnerEmbed] 
                });
                
                giveaways.delete(messageId);
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to end giveaway!**')
                    ]
                });
            }
        },
        
        'greroll': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageGuild)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Server permission!**')
                    ]
                });
            }
            
            const messageId = args[0];
            
            if (!messageId) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a giveaway message ID!**\n> Usage: `!greroll <messageID>`')
                    ]
                });
            }
            
            try {
                const message = await msg.channel.messages.fetch(messageId);
                const reaction = message.reactions.cache.get('🎉');
                
                if (!reaction) {
                    return msg.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.colors.error)
                                .setDescription('❌ **No participants!**')
                        ]
                    });
                }
                
                const users = await reaction.users.fetch();
                const participants = users.filter(u => !u.bot).map(u => u);
                
                if (participants.length === 0) {
                    return msg.reply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor(config.colors.error)
                                .setDescription('❌ **No valid participants!**')
                        ]
                    });
                }
                
                const winner = participants[Math.floor(Math.random() * participants.length)];
                
                const rerollEmbed = new Discord.EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🎉 Giveaway Rerolled!')
                    .setDescription(`**New Winner:** ${winner}\n\nCongratulations!`)
                    .setTimestamp();
                
                msg.channel.send({ 
                    content: winner.toString(), 
                    embeds: [rerollEmbed] 
                });
            } catch (error) {
                msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Failed to reroll giveaway!**')
                    ]
                });
            }
        },
        
        'poll': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide a question!**\n> Usage: `!poll <question>`')
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('📊 Poll')
                .setDescription(`**Question:** ${args.join(' ')}`)
                .setFooter({ 
                    text: `Created by ${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            const pollMsg = await msg.channel.send({ embeds: [embed] });
            await pollMsg.react('👍');
            await pollMsg.react('👎');
            await pollMsg.react('🤷');
        },
        
        'afk': async () => {
            const reason = args.join(' ') || 'AFK';
            afkUsers.set(msg.author.id, { reason, timestamp: Date.now() });
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.info)
                .setTitle('😴 AFK Status Set')
                .setDescription(`> I'll tell people you're AFK: **${reason}**`)
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'snipe': async () => {
            const snipe = snipes.get(msg.channel.id);
            
            if (!snipe) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **No recently deleted messages!**')
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ 
                    name: snipe.author.tag, 
                    iconURL: snipe.author.displayAvatarURL() 
                })
                .setDescription(snipe.content)
                .setFooter({ text: 'Deleted message' })
                .setTimestamp(snipe.timestamp);
            
            msg.reply({ embeds: [embed] });
        },
        
        'enlarge': async () => {
            const emoji = args[0];
            
            if (!emoji) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide an emoji!**\n> Usage: `!enlarge <emoji>`')
                    ]
                });
            }
            
            const match = emoji.match(/^<(a)?:(\w+):(\d+)>$/);
            
            if (!match) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Invalid custom emoji!**')
                    ]
                });
            }
            
            const [, animated, name, id] = match;
            const ext = animated ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`:${name}:`)
                .setImage(url)
                .setDescription(`[Download Emoji](${url})`)
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'reverse': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide text to reverse!**\n> Usage: `!reverse <text>`')
                    ]
                });
            }
            
            const reversed = args.join(' ').split('').reverse().join('');
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('🔄 Text Reversed')
                .addFields(
                    { name: 'Original', value: `\`${args.join(' ')}\`` },
                    { name: 'Reversed', value: `\`${reversed}\`` }
                )
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'ascii': async () => {
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide text!**\n> Usage: `!ascii <text>`')
                    ]
                });
            }
            
            const text = args.join(' ');
            
            if (text.length > 15) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Text too long! Max 15 characters.**')
                    ]
                });
            }
            
            const ascii = figlet.textSync(text, { font: 'Standard' });
            msg.reply('```' + ascii + '```');
        },
        
        'say': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide text!**\n> Usage: `!say <text>`')
                    ]
                });
            }
            
            msg.delete().catch(() => {});
            msg.channel.send(args.join(' '));
        },
        
        'embed': async () => {
            if (!msg.member.permissions.has(Discord.PermissionFlagsBits.ManageMessages)) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **You need Manage Messages permission!**')
                    ]
                });
            }
            
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide text!**\n> Usage: `!embed <text>`')
                    ]
                });
            }
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setDescription(args.join(' '))
                .setFooter({ 
                    text: `${msg.author.tag}`, 
                    iconURL: msg.author.displayAvatarURL() 
                })
                .setTimestamp();
            
            msg.delete().catch(() => {});
            msg.channel.send({ embeds: [embed] });
        },
        
        'eval': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            if (!args[0]) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Provide code!**\n> Usage: `!eval <code>`')
                    ]
                });
            }
            
            try {
                const code = args.join(' ');
                let evaled = eval(code);
                
                if (typeof evaled !== 'string') {
                    evaled = require('util').inspect(evaled);
                }
                
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('✅ Evaluation Success')
                    .addFields(
                        { 
                            name: '📥 Input', 
                            value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\`` 
                        },
                        { 
                            name: '📤 Output', 
                            value: `\`\`\`js\n${evaled.slice(0, 1000)}\n\`\`\`` 
                        }
                    )
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            } catch (err) {
                const embed = new Discord.EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle('❌ Evaluation Error')
                    .setDescription(`\`\`\`js\n${err}\n\`\`\``)
                    .setTimestamp();
                
                msg.reply({ embeds: [embed] });
            }
        },
        
        'serverlist': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            const guilds = client.guilds.cache
                .map((g, i) => `**${i + 1}.** ${g.name} (\`${g.id}\`) - ${formatNumber(g.memberCount)} members`)
                .join('\n');
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('🖥️ Server List')
                .setDescription(guilds.slice(0, 4000))
                .setFooter({ text: `Total: ${client.guilds.cache.size} servers` })
                .setTimestamp();
            
            msg.reply({ embeds: [embed] });
        },
        
        'leave': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            const guildId = args[0] || msg.guild.id;
            const guild = client.guilds.cache.get(guildId);
            
            if (!guild) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Guild not found!**')
                    ]
                });
            }
            
            await msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.success)
                        .setDescription(`✅ **Leaving ${guild.name}...**`)
                ]
            });
            
            await guild.leave();
        },
        
        'shutdown': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            await msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.warning)
                        .setDescription('🔌 **Shutting down...**')
                ]
            });
            
            process.exit(0);
        },
        
        'restart': async () => {
            if (!isOwner) {
                return msg.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.colors.error)
                            .setDescription('❌ **Owner only command!**')
                    ]
                });
            }
            
            await msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.warning)
                        .setDescription('🔄 **Restarting...**')
                ]
            });
            
            process.exit(1);
        }
    };
    
    // Execute Command
    if (commands[cmd]) {
        try {
            // Cooldown System
            if (!isOwner) {
                const now = Date.now();
                const cooldownAmount = 3000;
                
                if (cooldowns.has(msg.author.id)) {
                    const expTime = cooldowns.get(msg.author.id) + cooldownAmount;
                    if (now < expTime) {
                        const timeLeft = ((expTime - now) / 1000).toFixed(1);
                        return msg.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setColor(config.colors.warning)
                                    .setDescription(`⏱️ **Cooldown!** Wait ${timeLeft}s before using another command!`)
                            ]
                        });
                    }
                }
                
                cooldowns.set(msg.author.id, now);
                setTimeout(() => cooldowns.delete(msg.author.id), cooldownAmount);
            }
            
            await commands[cmd]();
        } catch (error) {
            console.error(chalk.red('Command Error:'), error);
            msg.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.colors.error)
                        .setDescription('❌ **An error occurred while executing this command!**')
                ]
            });
        }
    }
    
    // XP System
    if (!cooldowns.has(`xp_${msg.author.id}`)) {
        const xpGain = Math.floor(Math.random() * 10) + 15;
        const userData = userXP.get(msg.author.id) || { xp: 0, level: 1 };
        userData.xp += xpGain;
        const xpNeeded = userData.level * 100;
        
        if (userData.xp >= xpNeeded) {
            userData.level++;
            userData.xp = 0;
            
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colors.level)
                .setTitle('🎉 Level Up!')
                .setDescription(`> ${msg.author}, you leveled up to **Level ${userData.level}**!`)
                .setThumbnail(msg.author.displayAvatarURL())
                .setTimestamp();
            
            msg.channel.send({ embeds: [embed] });
        }
        
        userXP.set(msg.author.id, userData);
        cooldowns.set(`xp_${msg.author.id}`, Date.now());
        setTimeout(() => cooldowns.delete(`xp_${msg.author.id}`), 60000);
    }
});

// Message Delete Event
client.on('messageDelete', msg => {
    if (msg.author && !msg.author.bot && msg.content) {
        snipes.set(msg.channel.id, {
            content: msg.content,
            author: msg.author,
            timestamp: Date.now()
        });
    }
});

// Error Handling
process.on('unhandledRejection', error => {
    console.error(chalk.red('Unhandled Rejection:'), error);
});

process.on('uncaughtException', error => {
    console.error(chalk.red('Uncaught Exception:'), error);
});

// Login
client.login(config.token).catch(err => {
    console.error(chalk.red('❌ Login Error:'), err);
    console.log(chalk.yellow('\n⚠️  Please check:'));
    console.log(chalk.cyan('1. Bot token is correct'));
    console.log(chalk.cyan('2. All intents are enabled in Discord Developer Portal'));
    console.log(chalk.cyan('3. Internet connection is stable\n'));
});
