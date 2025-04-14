const { startBot } = require("./bot/bot");
const { startServer } = require("./server/server");

const { Client, GatewayIntentBits, IntentsBitField } = require("discord.js");

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
});

discordClient.login(process.env.TOKEN);

// Start Discord bot
startBot(discordClient);

// Start web server
startServer(discordClient);
