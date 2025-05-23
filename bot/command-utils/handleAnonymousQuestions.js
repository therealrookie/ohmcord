const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} = require("discord.js");

const {
  addQuestionSession,
  getAnonymousAnswers,
  addQuestionMessageId,
  getQuestionMessageId,
  getQuestionById,
  addAnonymousAnswer,
} = require("../../database/db-anon-questions");

const { createHashRoute } = require("../utils/utils-functions");

// Gets and saves important question-session-data
async function saveQuestionSessionData(interaction) {
  const topic = interaction.options.get("topic").value;

  if (topic.length > 256) {
    interaction.editReply({ content: "Dein Thema ist zu lang. \n Die maximale Länge beträgt 256 Zeichen.", ephemeral: true });
  }

  const hashRoute = createHashRoute(`${topic} + ${Date.now()}`);

  const questionSessionId = await addQuestionSession(topic, hashRoute);

  return { topic, hashRoute, questionSessionId };
}

// Checks if the Websocket connection is established
async function handleWebsocket(ws, topic) {
  ws.on("open", () => {
    console.log(`WebSocket connection established (Anonymous questions: ${topic})`);
  });
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

// Sends an embed for the user to ask a question
async function sendAddQuestionMessage(interaction, questionSessionData) {
  const { topic, hashRoute, questionSessionId } = questionSessionData;

  const questionButton = new ButtonBuilder().setCustomId(`question_button_${questionSessionId}`).setLabel("Frag etwas").setStyle(ButtonStyle.Primary);

  const linkButton = new ButtonBuilder().setLabel("Website").setURL(`${process.env.URL}/anonymous-questions/${hashRoute}`).setStyle(ButtonStyle.Link);

  const actionRow = new ActionRowBuilder().addComponents(questionButton).addComponents(linkButton);

  const reply = await interaction.editReply({ content: topic, components: [actionRow] });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
  });

  collector.on("collect", async (interaction) => {
    await openNewQuestionModal(interaction, topic);
  });
}

// Create an embed for an asked question
async function createQuestionEmbed(client, interaction, parsedMessage) {
  const questionId = parsedMessage.questionId;
  const questionEmbed = new EmbedBuilder().setColor(0xf39237).setTitle(parsedMessage.question);

  const answerButton = new ButtonBuilder().setCustomId(`answer_button_${questionId}`).setLabel("Antwort hinzufügen").setStyle(ButtonStyle.Success);

  const actionRow = new ActionRowBuilder().addComponents(answerButton);

  const channel = await client.channels.fetch(interaction.channelId);
  const questionDiscordMessage = await channel.send({ embeds: [questionEmbed], components: [actionRow] });
  await addQuestionMessageId(questionId, questionDiscordMessage.id);

  const collector = questionDiscordMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
  });

  collector.on("collect", async (interaction) => {
    await openNewAnswerModal(interaction);
  });
}

function createAnswerField(answers) {
  const answerText = answers.map((data, index) => `${data.answer}`).join("\n \n");

  if (answerText.length > 1021) return `${answerText.slice(0, 1024)}...`;
  else return answerText;
}

// Edits the question-embed, when a new answer was added
async function editQuestionEmbed(client, interaction, parsedMessage) {
  const questionId = parsedMessage.questionId;
  await addAnonymousAnswer(questionId, parsedMessage.answer);
  const question = await getQuestionById(questionId);
  const answers = await getAnonymousAnswers(questionId);
  const questionDiscordMessageId = await getQuestionMessageId(questionId);

  const channel = await client.channels.fetch(interaction.channelId);
  const message = await channel.messages.fetch(questionDiscordMessageId);

  const answerText = createAnswerField(answers);

  const updatedQuestionEmbed = new EmbedBuilder().setColor(0xf39237).setTitle(question).addFields({
    name: "_ _ _ _ _ _ _ _ _ _ _",
    value: answerText,
  });

  await message.edit({ embeds: [updatedQuestionEmbed] });
}

// Send a new question to the website
async function sendQuestion(ws, modalInteraction) {
  const question = modalInteraction.fields.getTextInputValue("question_input");
  const questionSessionId = parseInt(modalInteraction.customId.replace("questions_modal_", ""));

  await ws.send(
    JSON.stringify({
      source: "discord",
      type: "question",
      questionSessionId: questionSessionId,
      question: question,
    })
  );
  await modalInteraction.deferUpdate(); // Acknowledges the interaction without sending a message
}

// Sends a new answer to the website
async function sendAnswer(ws, modalInteraction, questionSessionId) {
  const questionId = parseInt(modalInteraction.customId.replace("answer_modal_", ""));
  const answer = modalInteraction.fields.getTextInputValue(`answer_input_${questionId}`);

  await ws.send(
    JSON.stringify({
      source: "discord",
      type: "answer",
      questionSessionId: questionSessionId,
      questionId: questionId,
      answer: answer,
    })
  );
  await modalInteraction.deferUpdate(); // Acknowledges the interaction without sending a message
}

// Opens a question-modal for the user to enter a question
async function openNewQuestionModal(buttonInteraction, topic) {
  const questionSessionId = parseInt(buttonInteraction.customId.replace("question_button_", ""));

  const modal = new ModalBuilder()
    .setCustomId(`questions_modal_${questionSessionId}`)
    .setTitle(`${topic.length > 38 ? topic.slice(0, 42) + "..." : topic}`);

  const ideaInput = new TextInputBuilder()
    .setCustomId("question_input")
    .setLabel("Frage etwas:")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Deine Frage...")
    .setRequired(true);

  const modalActionRow = new ActionRowBuilder().addComponents(ideaInput);
  modal.addComponents(modalActionRow);

  await buttonInteraction.showModal(modal);
}

// Opens an answer-modal for the user to enter an answer
async function openNewAnswerModal(buttonInteraction) {
  const questionId = parseInt(buttonInteraction.customId.replace("answer_button_", ""));
  const question = await getQuestionById(questionId);

  const modal = new ModalBuilder()
    .setCustomId(`answer_modal_${questionId}`)
    .setTitle(`${question.length > 45 ? question.slice(0, 42) + "..." : question}`);

  const answerInput = new TextInputBuilder()
    .setCustomId(`answer_input_${questionId}`)
    .setLabel("Eine Antwort hinzufügen:")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Deine Antwort...")
    .setRequired(true);

  const modalActionRow = new ActionRowBuilder().addComponents(answerInput);
  modal.addComponents(modalActionRow);

  await buttonInteraction.showModal(modal);
}

module.exports = {
  saveQuestionSessionData,
  handleWebsocket,
  sendAddQuestionMessage,
  createQuestionEmbed,
  editQuestionEmbed,
  sendQuestion,
  sendAnswer,
  openNewQuestionModal,
  openNewAnswerModal,
};
