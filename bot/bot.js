const { Client, Collection, Events, GatewayIntentBits, IntentsBitField } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { handleModalInteraction, handleCommandInteraction } = require("handleInteractions.js");

require("dotenv").config();

function startBot(client) {
  /*
  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
      GatewayIntentBits.Guilds,
    ],
  });
  */

  client.commands = new Collection();

  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
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

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isModalSubmit()) {
      await handleModalInteraction(interaction);
    }

    if (interaction.isChatInputCommand()) {
      await handleCommandInteraction(interaction);
    }
  });

  //client.login(process.env.TOKEN);
}

module.exports = { startBot };
