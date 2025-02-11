const { Client, Interaction, ApplicationCommandOptionType } = require("discord.js");

const { WebSocket } = require("ws");

const {
  handleWebsocket,
  saveBrainStormData,
  startBrainstormEmbed,
  openContributionModal,
  addContributionToCanvas,
  sendBrainstormCanvas,
} = require("../interactionsHandlers/brainstorm/handleBrainstormInteractions");

const { addBrainstormContribution } = require("../../../database/dbBrainstormFunctions");

module.exports = {
  callback: async (client, interaction) => {
    await interaction.deferReply(); // Delay reply

    let imageSent = false; // Flag to indicate if the canvas has already been sent to the channel
    const contributions = []; // Store all the contributions in a temporary array

    // Get / store important brainstorm data from / inside database
    const brainstormData = await saveBrainStormData(interaction);
    const { brainstormId, theme, timeLimit, hashRoute } = brainstormData;

    // Open a new websocket to send and listen to messages from the website
    const ws = new WebSocket(`ws://${process.env.WS_URL}:${process.env.WS_PORT}/brainstorm`);
    await handleWebsocket(ws, theme);

    // Open an embed with a button to see and add contributions
    await startBrainstormEmbed(interaction, brainstormData, contributions);

    // Handle ws-messages from the website (send canvas, add a contribution)
    ws.on("message", async (message) => {
      const parsedMessage = JSON.parse(message);
      const validBrainstormId = parseInt(parsedMessage.brainstormId) === parseInt(brainstormId);
      const isContribution = parsedMessage.type === "contribution";
      const discordSource = parsedMessage.source === "server-website";

      console.log("DISCORD: ", parsedMessage);

      if (validBrainstormId && discordSource && parsedMessage.type === "image" && !imageSent) {
        await sendBrainstormCanvas(client, parsedMessage, interaction.channelId);
        imageSent = true;
      } else if (validBrainstormId && discordSource && parsedMessage.type === "contribution") {
        await handleNewContribution(parsedMessage.contribution);
      }
    });

    // Handle a new contribution from Discord or the website
    async function handleNewContribution(userIdea) {
      await addContributionToCanvas(ws, hashRoute, brainstormId, userIdea);

      contributions.push(userIdea); // Add contribution to temporary array
      await addBrainstormContribution(brainstormId, userIdea);

      await startBrainstormEmbed(interaction, brainstormData, contributions);
    }

    // Handle interaction with "add contribution"-button
    client.on("interactionCreate", async (buttonInteraction) => {
      if (!buttonInteraction.isButton()) return;
      if (buttonInteraction.customId !== "contribute_button") return;

      await openContributionModal(buttonInteraction, theme);
    });

    // Handle interaction with the contribution-modal
    client.on("interactionCreate", async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (modalInteraction.customId !== "brainstorm_modal") return;

      const userIdea = modalInteraction.fields.getTextInputValue("idea_input");
      await handleNewContribution(userIdea);

      await modalInteraction.deferUpdate();
    });
  },

  // Data structure of the brainstorm command
  name: "brainstorm",
  description: "Start a brainstorming session",
  options: [
    {
      name: "theme",
      description: "The theme of the brainstorming session",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "time_limit",
      description: "Time limit in minutes for the brainstorming session",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
};
