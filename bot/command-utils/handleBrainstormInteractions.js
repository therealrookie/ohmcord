const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const { addBrainstorm, addBrainstormMessage, getBrainstormMessages } = require("../../../database/dbBrainstormFunctions");
const { createHashRoute } = require("../../utils/utils-functions");
const path = require("path");

// Extracts important brainstorm-data and saves it to the database
async function saveBrainStormData(interaction) {
  const theme = interaction.options.get("theme").value;
  const timeLimit = interaction.options.get("time_limit").value * 60000;
  const endBrainstormAt = Date.now() + timeLimit;
  const hashRoute = createHashRoute(`${theme} + ${Date.now()}`);

  const brainstormId = await addBrainstorm(theme, hashRoute, endBrainstormAt);
  return { brainstormId, theme, timeLimit, hashRoute };
}

// Checks if the Websocket connection is established
async function handleWebsocket(ws, theme) {
  ws.on("open", () => {
    console.log(`WebSocket connection established (brainstorm: ${theme})`);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

// Exports Actionrow with "+"-Button and Canvas-Link-Button
function createLastRow(hashRoute) {
  const contributeButton = new ButtonBuilder().setCustomId("contribute_button").setLabel("+").setStyle(ButtonStyle.Success);
  const linkButton = new ButtonBuilder()
    .setLabel("Brainstorm Canvas")
    .setURL(`${process.env.URL}/brainstorm/${hashRoute}`)
    .setStyle(ButtonStyle.Link);

  const actionRow = new ActionRowBuilder().addComponents(contributeButton).addComponents(linkButton);
  return actionRow;
}

// Creates Actionrows filled with buttons for each contribution
function createContributionActionRows(contributions, hashRoute) {
  let actionRows = [];

  for (let i = 0; i < contributions.length; i += 5) {
    const actionRow = new ActionRowBuilder();

    for (let j = i; j < i + 5 && j < contributions.length; j++) {
      console.log(contributions[j]);
      const contributionButton = new ButtonBuilder()
        .setCustomId(`contribution_${contributions[j].contributionId}`)
        .setLabel(`${contributions[j].contribution} (${contributions[j].score})`)
        .setStyle(ButtonStyle.Primary);

      actionRow.addComponents(contributionButton);
    }
    actionRows.push(actionRow);
  }

  const lastRow = createLastRow(hashRoute);
  actionRows.push(lastRow);

  return actionRows;
}

// Returns the String of the brainstorm message
function createBsMessage(theme, timeLimit) {
  return `**Thema:** ** ** *${theme}* \n **Zeitlimit:** ** ** *${timeLimit / 60000} Minute${
    timeLimit > 1 ? "n" : ""
  }* \n **Bewerten:** 1.Klick +1, 2.Klick 0, 3.Klick -1`;
}

// Sends messages for all contributions
async function startBrainstormMessage(interaction, brainstormData, contributions) {
  const { brainstormId, theme, timeLimit, hashRoute } = brainstormData;
  const actionRows = createContributionActionRows(contributions, hashRoute);

  for (let i = 0; i < actionRows.length; i += 5) {
    const messageActionRows = [];
    for (let j = i; j < i + 5 && j < actionRows.length; j++) {
      messageActionRows.push(actionRows[j]);
    }
    const messageIndex = Math.floor(i / 5);
    const messages = await getBrainstormMessages(brainstormId);

    const channel = await interaction.client.channels.fetch(interaction.channelId);

    if (i === 0) {
      const message = createBsMessage(theme, timeLimit);
      await interaction.editReply({
        content: message,
        components: messageActionRows,
      });
    } else if (messages[messageIndex]) {
      const newMessage = await channel.messages.fetch(messages[messageIndex].message_id);
      await newMessage.edit({ components: messageActionRows });
    } else {
      const message = await channel.send({
        components: messageActionRows,
      });
      await addBrainstormMessage(brainstormId, message.id);
    }
  }
}

// Opens the contribution-modal
async function openContributionModal(buttonInteraction, theme) {
  const modal = new ModalBuilder().setCustomId("brainstorm_modal").setTitle(`Brainstorm: ${theme.length > 33 ? theme.slice(0, 30) + "..." : theme}`);

  const ideaInput = new TextInputBuilder()
    .setCustomId("idea_input")
    .setLabel("Neuer Beitrag:")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(69)
    .setPlaceholder("Dein Beitrag...")
    .setRequired(true);

  const modalActionRow = new ActionRowBuilder().addComponents(ideaInput);
  modal.addComponents(modalActionRow);

  await buttonInteraction.showModal(modal);
}

// Sends a ws-message to the website to add it to the canvas
async function addContributionToCanvas(ws, contributionId, brainstormId, userIdea) {
  ws.send(
    JSON.stringify({
      source: "discord",
      type: "contribution",
      brainstormId: brainstormId,
      contributionId: contributionId,
      contribution: userIdea,
    })
  );
}

// Sends the canvas-image to the channel
async function sendBrainstormCanvas(client, hashRoute, interaction) {
  const uploadDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.png`);

  const channel = await client.channels.fetch(interaction.channelId);
  await channel.send({
    files: [filePath],
  });
}

module.exports = {
  handleWebsocket,
  saveBrainStormData,
  startBrainstormMessage,
  openContributionModal,
  addContributionToCanvas,
  sendBrainstormCanvas,
};
