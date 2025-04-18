require("dotenv").config();
const { startBot } = require("./bot/bot");
const { startServer } = require("./server/server");

const { Client } = require("discord.js");

// Instanciate Discord Client
const discordClient = new Client({
  intents: [],
});

discordClient.login(process.env.TOKEN);

// Start Discord bot
startBot(discordClient);

// Start web server
startServer(discordClient);
