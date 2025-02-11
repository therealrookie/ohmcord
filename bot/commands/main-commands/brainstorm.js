const { SlashCommandBuilder } = require("discord.js");
const { WebSocket } = require("ws");

const {
  handleWebsocket,
  saveBrainStormData,
  startBrainstormEmbed,
  openContributionModal,
  addContributionToCanvas,
  sendBrainstormCanvas,
} = require("../command-handlers/brainstorm/handleBrainstormInteractions");

const { addBrainstormContribution } = require("../../../database/dbBrainstormFunctions");

async function handleBrainstormCommand(interaction) {
  const client = interaction.client;

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

    if (validBrainstormId && discordSource && parsedMessage.type === "image" && !imageSent) {
      await sendBrainstormCanvas(client, parsedMessage, interaction.channelId);
      imageSent = true;
    } else if (validBrainstormId && discordSource && parsedMessage.type === "contribution") {
      await handleNewContribution(parsedMessage.contribution);
    }
  });

  // Handle a new contribution from Discord or the website
  async function handleNewContribution(contribution) {
    await addContributionToCanvas(ws, hashRoute, brainstormId, contribution);
    const contributionId = await addBrainstormContribution(brainstormId, contribution);

    contributions.push({ contributionId, contribution }); // Add contribution to temporary array

    await startBrainstormEmbed(interaction, brainstormData, contributions);
  }

  // Handle interaction with "add contribution"-button
  client.on("interactionCreate", async (buttonInteraction) => {
    if (!buttonInteraction.isButton()) return;

    if (buttonInteraction.customId === "contribute_button") {
      await openContributionModal(buttonInteraction, theme);
    } else if (buttonInteraction.customId.contains("contribution_")) {
      const contributionId = buttonInteraction.customId.replace("contribution_", "");
      const userId = buttonInteraction.user.id;
      console.log(contributionId, userId);
    } else return;
  });

  // Handle interaction with the contribution-modal
  client.on("interactionCreate", async (modalInteraction) => {
    if (!modalInteraction.isModalSubmit()) return;
    if (modalInteraction.customId !== "brainstorm_modal") return;

    const userIdea = modalInteraction.fields.getTextInputValue("idea_input");
    await handleNewContribution(userIdea);

    await modalInteraction.deferUpdate();
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("brainstorm")
    .setDescription("Starte eine Brainstorm-Session!")
    .addStringOption((option) => option.setName("theme").setDescription("Bestimme ein Thema der Brainstorm-Session.").setRequired(true))
    .addIntegerOption((option) => option.setName("time_limit").setDescription("Zeitlimit für die Brainstorm-Session").setRequired(true)),
  async execute(interaction) {
    await handleBrainstormCommand(interaction);
  },
};
