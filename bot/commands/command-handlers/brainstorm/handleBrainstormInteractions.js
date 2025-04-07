const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

const { addBrainstorm, addBrainstormMessage, getBrainstormMessages } = require("../../../../database/dbBrainstormFunctions");
const { createHashRoute } = require("../../../utils/utilsFunctions");

// Extract important brainstorm-data, save it to the database
async function saveBrainStormData(interaction) {
  const theme = interaction.options.get("theme").value;
  const timeLimit = interaction.options.get("time_limit").value * 60000;
  const endBrainstormAt = Date.now() + timeLimit;
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
    .setURL(`${process.env.URL}/brainstorm/${hashRoute}`)
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
        content: `**Thema:** ** ** *${theme}* \n **Zeitlimit:** ** ** *${timeLimit / 60000} Minute${timeLimit > 1 ? "n" : ""}* \n`,
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

// Send the canvas-image to the channel
async function sendBrainstormCanvas(client, hashRoute, channelId) {
  //const uploadDir = path.join(process.cwd(), "website/public/uploads");
  //const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.jpeg`);

  const filePath = path.join(process.cwd(), `uploads/brainstorm-${hashRoute}.jpeg`);

  //const filePath = await saveCanvasScreenshot(hashRoute);

  console.log("FILEPATH: ", filePath);

  const channel = await client.channels.fetch(channelId);
  await channel.send({
    content: `Here's the brainstorm canvas: ${filePath}`,
    files: [filePath],

    //files: [],
  });
}

/*

function saveImage(response, hashRoute) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, `brainstorm-${hashRoute}.jpeg`);

    console.log("Paths: ", uploadDir, filePath);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);

    fileStream.on("finish", () => resolve(filePath));
    fileStream.on("error", (err) => reject(err));
  });
}

async function saveCanvasScreenshot(hashRoute) {
  try {
    https.get(
      "https://api.apiflash.com/v1/urltoimage?" +
        new URLSearchParams({
          access_key: process.env.API_FLASH_KEY,
          url: `${process.env.URL}/${hashRoute}`,
          element: "#canvas",
        }).toString(),
      async (response) => {
        console.log("API FLASH RESPONSE: ", response);

        const filePath = await saveImage(response, hashRoute);
        return filePath;
      }
    );
  } catch (error) {
    console.log(error);
    return null;
  }
}

*/

module.exports = { handleWebsocket, saveBrainStormData, startBrainstormEmbed, openContributionModal, addContributionToCanvas, sendBrainstormCanvas };
