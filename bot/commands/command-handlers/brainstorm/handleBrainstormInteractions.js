const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const { addBrainstorm, addBrainstormMessage, getBrainstormMessages } = require("../../../../database/dbBrainstormFunctions");
const { createHashRoute } = require("../../../utils/utilsFunctions");

// Extract important brainstorm-data, save it to the database
async function saveBrainStormData(interaction) {
  const theme = interaction.options.get("theme").value;
  const timeLimit = interaction.options.get("time_limit").value;
  const endBrainstormAt = Date.now() + timeLimit * 60000;
  const hashRoute = createHashRoute(`${theme} + ${Date.now()}`);

  const brainstormId = await addBrainstorm(theme, hashRoute, endBrainstormAt);
  return { brainstormId, theme, timeLimit, hashRoute };
}

// Check if the Websocket connection is established
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

function createLastRow(hashRoute) {
  const contributeButton = new ButtonBuilder().setCustomId("contribute_button").setLabel("+").setStyle(ButtonStyle.Success);
  const linkButton = new ButtonBuilder()
    .setLabel("Brainstorm Canvas")
    .setURL(`${process.env.URL}:${process.env.port}/brainstorm/${hashRoute}`)
    .setStyle(ButtonStyle.Link);

  const actionRow = new ActionRowBuilder().addComponents(contributeButton).addComponents(linkButton);
  return actionRow;
}

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

//await channel.send({ embeds: [startQuizEmbed], components: [actionRowQuizStart] });

async function sendAdditionalMessage(contributions, interaction, brainstormData) {
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
      await interaction.editReply({
        content: `**Thema:** ** ** *${theme}* \n **Zeitlimit:** ** ** *${timeLimit} Minute${timeLimit > 1 ? "n" : ""}* \n`,
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

// Create and send the brainstorm- embed to the channel with general information, listed contributions & contribution-button
async function startBrainstormEmbed(interaction, brainstormData, contributions) {
  const { brainstormId, theme, timeLimit, hashRoute } = brainstormData;

  /*
  const brainstormEmbed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Brainstorm")
    .setDescription(`A new brainstorming session has begun with the theme **${theme}**.`)
    .addFields(
      { name: "Theme", value: theme, inline: true },
      { name: "Time Limit", value: `${timeLimit} minutes`, inline: true },
      { name: "ID: ", value: hashRoute, inline: true }
      //{ name: "Contributions", value: contributionField }
    );
  //.setFooter({ text: "Click the + button to contribute your ideas!" });

  await interaction.editReply({ embeds: [brainstormEmbed] });
  */
  await sendAdditionalMessage(contributions, interaction, brainstormData);
}

// Create and open the contribution-modal
async function openContributionModal(buttonInteraction, theme) {
  const modal = new ModalBuilder().setCustomId("brainstorm_modal").setTitle(`Brainstorm: ${theme.length > 33 ? theme.slice(0, 30) + "..." : theme}`);

  const ideaInput = new TextInputBuilder()
    .setCustomId("idea_input")
    .setLabel("Your Idea")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(69)
    .setPlaceholder("Enter a single-line idea")
    .setRequired(true);

  const modalActionRow = new ActionRowBuilder().addComponents(ideaInput);
  modal.addComponents(modalActionRow);

  await buttonInteraction.showModal(modal);
}

// Send a ws-message to the website to add it to the canvas
async function addContributionToCanvas(ws, hashRoute, brainstormId, userIdea) {
  ws.send(
    JSON.stringify({
      source: "discord",
      type: "contribution",
      brainstormId: brainstormId,
      contribution: userIdea,
    })
  );
}

// Send the canvas-image to the channel
async function sendBrainstormCanvas(client, parsedMessage, channelId) {
  const channel = await client.channels.fetch(channelId);
  await channel.send({
    content: "Here's the brainstorm canvas:",
    files: [parsedMessage.image],
  });
}

module.exports = { handleWebsocket, saveBrainStormData, startBrainstormEmbed, openContributionModal, addContributionToCanvas, sendBrainstormCanvas };
