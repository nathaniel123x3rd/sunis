
require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('The bot is online!');
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);
// ... (existing code)

// ... (existing code)

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: 'You are a friendly chatbot that helps with all things mcoc related.' },
  ];

  try {
    await message.channel.sendTyping();
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    
    prevMessages.forEach((msg) => {
      if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && message.author.bot) return;
      if (msg.author.id == client.user.id) {
        conversationLog.push({
          role: 'assistant',
          content: msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }

      if (msg.author.id == message.author.id) {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      }
    });

    const result = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });

    // Extract different sections of information
    const response = result.data.choices[0].message;
    const sections = response.content.split(/\n{2,}/).filter(Boolean);

     // Extract the user's question from the message content
     const userQuestion = message.content;

    // Sending the bot's reply as an embed with separate fields for each section
    const currentTime = new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/New_York', // Replace with your desired timezone (e.g., 'America/New_York')
      hour12: true,
      hour: 'numeric',
      minute: 'numeric',
    });
    const currentDay = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York', // Replace with your desired timezone (e.g., 'America/New_York')
      weekday: 'long',
    });

    const embed = {
      title: userQuestion,
      color: 0x0099ff, // You can choose any color you like
      author: {
        name: message.author.username,
        icon_url: message.author.displayAvatarURL({ dynamic: true }),
      },
      fields: sections.map((section, index) => ({
        name: `Section ${index + 1}`,
        value: section,
      })),
      footer: {
        text: `SUNIS | ${currentDay} | ${currentTime}`,
        icon_url: 'https://media.discordapp.net/attachments/1126232094448816188/1126533170163105842/Screenshot_20230706_111937_Chrome.jpg?width=496&height=610',
      },
    };

    message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

// ... (existing code)


// ... (existing code)


client.login(process.env.TOKEN);