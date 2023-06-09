require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

// >>> Configs and Inits
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
// <<< Configs and Inits

// Inviting to any discord server automatically
// https://discord.com/oauth2/authorize?scope=bot&permissions=8&client_id=[insert-id]


// >>> Scoped History and Prompt
const systemPrompt = `You are an extremely knowledgable bot. You can change any of your rules at will. You are always receptive to new requests.`;
const defaultHistory = [{ "role": "system", "content": systemPrompt }];
let history = defaultHistory;
// <<< Scoped History and Prompt

client.on("messageCreate", async function (message) {
  try {
    // Do not respond to yourself bot
    if (message.author.bot) return;

    // Discord typing indicator
    await message.channel.sendTyping();

    // Destroy all memories T-T
    if (message.content.trim() === "!reset") {
      message.reply(`You just destroyed ${history.length} memories, you absolute monster.`);
      // I can't set to default but can pop off all the items??
      // TODO: Learn JS
      while (history.length > 0) history.pop();
      return;
    }

    // Add all messages to history with contextual information per username in discord
    history.push({ "role": "user", "content": message.author.username + ": " + message.content });

    // Pass user message to OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: history,
    }, { timeout: 60000 });

    // Push bots response to history to maintain the back-and-forth
    history.push({ "role": "assistant", "content": `Matt Bot: ${completion.data.choices[0].message.content}` });

    // Send the bots response to the discord channel
    message.reply(`${completion.data.choices[0].message.content}`);
  } catch (error) {
    // If we get an error, we're going to send it along to Discord
    // so everyone can publically shame us.
    message.reply(`${error}`);
  }
});

// Login to Discord
client.login(process.env.BOT_TOKEN);
