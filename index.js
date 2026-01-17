require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Regex to find: discord.com/channels/GuildID/ChannelID/MessageID
const linkRegex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;

client.on('messageCreate', async (message) => {
    // Ignore bots to prevent infinite loops
    if (message.author.bot) return;

    const match = message.content.match(linkRegex);
    if (!match) return;

    const [_, guildId, channelId, messageId] = match;

    try {
        // 1. Fetch the channel where the linked message lives
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        // 2. Fetch the specific message
        const targetMsg = await channel.messages.fetch(messageId);

        // 3. Construct the Embed
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: targetMsg.author.tag, 
                iconURL: targetMsg.author.displayAvatarURL() 
            })
            .setDescription(targetMsg.content || "_[No text content]_")
            .setColor('#5865F2')
            .setTimestamp(targetMsg.createdAt)
            .setFooter({ text: `Quoted from #${channel.name}` });

        // If the original message had an image, add it to the embed
        const image = targetMsg.attachments.first();
        if (image) embed.setImage(image.url);

        // 4. Send the embed to the current channel
        await message.reply({ 
            embeds: [embed],
            allowedMentions: { repliedUser: false }
        });

    } catch (error) {
        console.error('Could not fetch message:', error);
        // Usually fails if the bot isn't in that server or channel
    }
});

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);
