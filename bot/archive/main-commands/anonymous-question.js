const { Client, Interaction, ApplicationCommandOptionType } = require("discord.js");

const { WebSocket } = require("ws");

const {
  saveQuestionSessionData,
  handleWebsocket,
  sendAddQuestionEmbed,
  createQuestionEmbed,
  editQuestionEmbed,
  sendQuestion,
  sendAnswer,
  openNewQuestionModal,
  openNewAnswerModal,
} = require("../../interactionsHandlers/anonymous_questions/handleAnonymousQuestions");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply(); // Delay reply

    // Get / store important data for an anonymous-question-session
    const questionSessionData = await saveQuestionSessionData(interaction);
    const { topic, hashRoute, questionSessionId } = questionSessionData;

    // Open a new websocket to send and listen to messages from the website
    const ws = new WebSocket(`ws://${process.env.WS_URL}:${process.env.WS_PORT}/questions`);
    await handleWebsocket(ws, topic);

    // Send an embed with a button for the user to ask a question
    await sendAddQuestionEmbed(interaction, questionSessionData);

    // Listen on ws-messages coming from the website
    ws.on("message", async (message) => {
      const parsedMessage = JSON.parse(message);
      const validQuestionSession = parseInt(parsedMessage.questionSessionId) === parseInt(questionSessionId);

      if (validQuestionSession && parsedMessage.type === "question") {
        await createQuestionEmbed(client, interaction, parsedMessage);
      } else if (validQuestionSession && parsedMessage.type === "answer") {
        await editQuestionEmbed(client, interaction, parsedMessage);
      }
    });

    // Handle button interactions opening modals for a new question or answer
    client.on("interactionCreate", async (buttonInteraction) => {
      if (!buttonInteraction.isButton()) return;
      if (buttonInteraction.customId.includes("question_button_")) {
        await openNewQuestionModal(buttonInteraction, topic);
      } else if (buttonInteraction.customId.includes("answer_button_")) {
        await openNewAnswerModal(buttonInteraction);
      } else return;
    });

    // Handle modal submissions for new questions and answers
    client.on("interactionCreate", async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (modalInteraction.customId.includes("questions_modal_")) {
        await sendQuestion(ws, modalInteraction);
      } else if (modalInteraction.customId.includes("answer_modal_")) {
        await sendAnswer(ws, modalInteraction, questionSessionId);
      } else return;
    });
  },

  // Data structure of the anonymous-question command
  name: "anonymous-question",
  description: "Start an anonymous question round",
  options: [
    {
      name: "topic",
      description: "The topic of this question round",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
