const { Events } = require("discord.js");
const { handleModalInteraction, handleCommandInteraction } = require("./utils/handle-interactions");
const { registerCommands } = require("./utils/register-commands");

function startBot(client) {
  // Registers commands from main-commands folder
  registerCommands(client);

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      await handleCommandInteraction(interaction);
    } else return;

    /*

    TODO Modals should be handled globally and not in every instance of the command

    if (interaction.isModalSubmit()) {
      await handleModalInteraction(interaction);
    }
     */
  });
}

module.exports = { startBot };
