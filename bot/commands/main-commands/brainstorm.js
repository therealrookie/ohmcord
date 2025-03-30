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
  const client = interaction.client;

  console.log("WebSocket URL: ", process.env.WS_URL);

  let imageSent = false; // Flag to indicate if the canvas has already been sent to the channel
  const contributions = []; // Store all the contributions in a temporary array

  // Get / store important brainstorm data from / inside database
  const brainstormData = await saveBrainStormData(interaction);
  const { brainstormId, theme, timeLimit, hashRoute } = brainstormData;

  const ws = new WebSocket(`${process.env.WS_URL}/brainstorm`);

  /*
  ws.on("connect", () => {
    console.log("Successfully connected to WebSocket server!");
    ws.emit("message", "Hello from Discord Bot!"); // Send a message from the bot
  });

  ws.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
  });

  ws.on("error", (error) => {
    console.log("Error connecting to WebSocket server", error);
  });
  */

  // Open a new websocket to send and listen to messages from the website
  //const ws = new WebSocket(`${process.env.WS_URL}/brainstorm`);
  //const ws = new WebSocket(`wss://ohmcord.robinvollbracht.com/brainstorm`);

  await handleWebsocket(ws, theme);

  /*

  var conn = new WebSocket("wss://ohmcord-hyxt.onrender.com");
  conn.onopen = function (e) {
    console.log("Connection established!");
  };
  setInterval(() => {
    conn.send("Hello server!");
  }, 1000);
  conn.onmessage = function (e) {
    console.log(e.data);
  };
  conn.onclose = function (e) {
    console.log(e.code);
    console.log(e.reason);
  };
  conn.onerror = function (e) {
    console.log(e);
  };

  */

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
      console.log("New WS message: ", message);
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
