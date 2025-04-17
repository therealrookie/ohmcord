async function handleModalInteraction(interaction) {
  /*
    Modal Interaction should be handled here: Globally

    Right now it is handled in every instance of a command, which is not ideal, can lead to longer loading times and thus errors when submitting modals
  */
}

// Executes command if it exists
// https://discordjs.guide/creating-your-bot/command-handling.html#executing-commands
async function handleCommandInteraction(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { handleModalInteraction, handleCommandInteraction };
