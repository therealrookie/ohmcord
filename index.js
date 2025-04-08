const { startBot } = require("./bot/bot");
const { startServer } = require("./website/server");

// Start Discord bot
startBot();

// Start web server
startServer();
