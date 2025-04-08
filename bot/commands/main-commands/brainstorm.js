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

const {
  addBrainstormContribution,
  updateBrainstormContributionScoring,
  updateContributionScore,
} = require("../../../database/dbBrainstormFunctions");

async function handleBrainstormCommand(interaction) {
  await interaction.deferReply(); // Delay reply

  const client = interaction.client;

  console.log("WebSocket URL: ", process.env.WS_URL);

  let imageSent = false; // Flag to indicate if the canvas has already been sent to the channel
  const contributions = []; // Store all the contributions in a temporary array

  // Get / store important brainstorm data from / inside database
  const brainstormData = await saveBrainStormData(interaction);
  const { brainstormId, theme, timeLimit, hashRoute } = brainstormData;

  const ws = new WebSocket(`${process.env.WS_URL}/brainstorm`);

  await handleWebsocket(ws, theme);

  // Open an embed with a button to see and add contributions
  await startBrainstormEmbed(interaction, brainstormData, contributions);

  // Handle ws-messages from the website (send canvas, add a contribution)
  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message);
    const validBrainstormId = parseInt(parsedMessage.brainstormId) === parseInt(brainstormId);
    const validSource = parsedMessage.source === "server-website";

    //console.log("ParsedMessage: ", parsedMessage, validBrainstormId, validSource, imageSent);

    if (validBrainstormId && validSource && parsedMessage.type === "image" && !imageSent) {
      console.log("ParsedMessage: ", parsedMessage);
      await sendBrainstormCanvas(client, hashRoute, interaction);

      //await sendBrainstormCanvas(client, hashRoute, interaction.channelId);
      imageSent = true;
    } else if (validBrainstormId && validSource && parsedMessage.type === "contribution") {
      //console.log("New WS message: ", parsedMessage);
      await handleNewContribution(parsedMessage.contribution);
    }
  });

  // Handle a new contribution from Discord or the website
  async function handleNewContribution(contribution) {
    const contributionId = await addBrainstormContribution(brainstormId, contribution);
    await addContributionToCanvas(ws, contributionId, brainstormId, contribution);

    contributions.push({ contributionId, contribution, score: 0 }); // Add contribution to temporary array

    await startBrainstormEmbed(interaction, brainstormData, contributions);
  }

  setTimeout(async () => {
    if (!imageSent) {
      ws.send(
        JSON.stringify({
          source: "discord",
          type: "image-request",
          brainstormId: brainstormId,
          hashRoute: hashRoute,
        })
      );
    }
  }, timeLimit);

  // Handle interaction with "add contribution"-button
  client.on("interactionCreate", async (buttonInteraction) => {
    if (!buttonInteraction.isButton()) return;

    if (buttonInteraction.customId === "contribute_button") {
      await openContributionModal(buttonInteraction, theme);
    } else if (buttonInteraction.customId.includes("contribution_")) {
      const contributionId = parseInt(await buttonInteraction.customId.replace("contribution_", ""));
      const userId = buttonInteraction.user.id;

      const score = await updateBrainstormContributionScoring(contributionId, userId);

      for (let cont of contributions) {
        if (cont.contributionId === contributionId) {
          cont.score += score;
          await updateContributionScore(contributionId, cont.score);
          ws.send(
            JSON.stringify({
              source: "discord",
              type: "score",
              brainstormId: brainstormId,
              contribution: { id: contributionId, score: cont.score },
            })
          );
        }
      }

      await startBrainstormEmbed(interaction, brainstormData, contributions);

      await buttonInteraction.deferUpdate();
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
    .addStringOption((option) =>
      option.setName("theme").setDescription("Bestimme ein Thema der Brainstorm-Session.").setRequired(true).setMaxLength(100)
    )
    .addIntegerOption((option) =>
      option.setName("time_limit").setDescription("Zeitlimit für die Brainstorm-Session").setRequired(true).setMaxValue(999)
    ),
  async execute(interaction) {
    await handleBrainstormCommand(interaction);
  },
};
