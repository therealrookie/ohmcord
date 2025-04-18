const { Collection } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

// Registers commands from main-commands folder
// https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands
function registerCommands(client) {
  client.commands = new Collection();

  const commandsPath = path.join(process.cwd(), "bot", "commands");
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

module.exports = { registerCommands };
