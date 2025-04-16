const { SlashCommandBuilder } = require("discord.js");

const { WebSocket } = require("ws");

const {
  saveQuestionSessionData,
  handleWebsocket,
  sendAddQuestionMessage,
  createQuestionEmbed,
  editQuestionEmbed,
  sendQuestion,
  sendAnswer,
} = require("../command-utils/handleAnonymousQuestions");

async function handleAnonymousQuestions(interaction) {
  await interaction.deferReply(); // Delays reply

  const client = interaction.client;

  // Gets / stores important data for an anonymous-question-session
  const questionSessionData = await saveQuestionSessionData(interaction);
  const { topic, hashRoute, questionSessionId } = questionSessionData;

  // Opens a new websocket to send and listen to messages from the website
  const ws = new WebSocket(`${process.env.WS_URL}/questions`);
  await handleWebsocket(ws, topic);

  // Sends the initial message with a button for the user to ask a question
  await sendAddQuestionMessage(interaction, questionSessionData);

  // Listens on ws-messages coming from the website
  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message);
    const validQuestionSession = parseInt(parsedMessage.questionSessionId) === parseInt(questionSessionId);

    if (validQuestionSession && parsedMessage.type === "question") {
      await createQuestionEmbed(client, interaction, parsedMessage);
    } else if (validQuestionSession && parsedMessage.type === "answer") {
      await editQuestionEmbed(client, interaction, parsedMessage);
    }
  });

  // Handles modal submissions for new questions and answers
  client.on("interactionCreate", async (modalInteraction) => {
    if (!modalInteraction.isModalSubmit()) return;
    if (modalInteraction.customId.includes("questions_modal_")) {
      await sendQuestion(ws, modalInteraction);
    } else if (modalInteraction.customId.includes("answer_modal_")) {
      await sendAnswer(ws, modalInteraction, questionSessionId);
    } else return;
  });
}

// Exports the anonymous-question-command Object
module.exports = {
  data: new SlashCommandBuilder()
    .setName("anonymous-question")
    .setDescription("Starte eine anonyme Frage-Runde.")
    .addStringOption((option) => option.setName("topic").setDescription("Bestimme ein Thema der Anonymen-Frage-Runde.").setRequired(true)),
  async execute(interaction) {
    await handleAnonymousQuestions(interaction);
  },
};
