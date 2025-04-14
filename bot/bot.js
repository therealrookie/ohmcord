const { Collection, Events } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { handleModalInteraction, handleCommandInteraction } = require("./handleInteractions");
const { registerCommands } = require("./register-commands");

require("dotenv").config();

function startBot(client) {
  registerCommands(client);

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
}

module.exports = { startBot };
