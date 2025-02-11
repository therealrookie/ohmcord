const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const { addBrainstorm } = require("../../../../database/dbBrainstormFunctions");
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

// Create a String (list) of contributions
function mapContributions(contributions) {
  if (contributions.length === 0) {
    return "No contributions yet. Click + to add your idea!";
  } else {
    return contributions.map((idea, index) => `${index + 1}. ${idea}`).join("\n");
  }
}

// Create and send the brainstorm- embed to the channel with general information, listed contributions & contribution-button
async function startBrainstormEmbed(interaction, brainstormData, contributions) {
  const { brainstormId, theme, timeLimit, hashRoute } = brainstormData;

  const contributionField = mapContributions(contributions);
  const brainstormEmbed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(theme)
    .setURL(`${process.env.URL}:${process.env.port}/brainstorm/${hashRoute}`)
    .setDescription(`A new brainstorming session has begun with the theme **${theme}**.`)
    .addFields(
      { name: "Theme", value: theme, inline: true },
      { name: "Time Limit", value: `${timeLimit} minutes`, inline: true },
      { name: "ID: ", value: hashRoute, inline: true },
      { name: "Contributions", value: contributionField }
    )
    .setFooter({ text: "Click the + button to contribute your ideas!" });

  const contributeButton = new ButtonBuilder().setCustomId("contribute_button").setLabel("+").setStyle(ButtonStyle.Primary);

  const actionRow = new ActionRowBuilder().addComponents(contributeButton);

  await interaction.editReply({ embeds: [brainstormEmbed], components: [actionRow] });
}

// Create and open the contribution-modal
async function openContributionModal(buttonInteraction, theme) {
  const modal = new ModalBuilder().setCustomId("brainstorm_modal").setTitle(`Brainstorm: ${theme.length > 33 ? theme.slice(0, 30) + "..." : theme}`);

  const ideaInput = new TextInputBuilder()
    .setCustomId("idea_input")
    .setLabel("Your Idea")
    .setStyle(TextInputStyle.Short)
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
