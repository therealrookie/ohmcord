const { SlashCommandBuilder } = require("discord.js");

const { getQuizByHashUrl, getAllQuizQuestions } = require("../../database/dbQuizFunctions");
const { startQuiz, publishQuizStatsEmbed, sendPersonalStatsEmbed, finishQuizMessage } = require("../command-utils/handleStartAndFinish");
const { sendNextQuestionEmbed, checkAnswerMessage } = require("../command-utils/handleQuestionsAndAnswers");

async function handleQuiz(interaction) {
  await interaction.deferReply({ ephemeral: true }); // Delays reply

  const client = interaction.client;
  const hashRoute = interaction.options.get("code").value; // Gets Hashroute-code from command-input-field
  const quizData = await getQuizByHashUrl(hashRoute); // Gets quizData from database
  const questions = await getAllQuizQuestions(quizData.quiz_id); // Gets questions (+answers) from database

  // Sends start-quiz-embed and quiz-stats-embed
  await startQuiz(client, interaction, quizData, questions);

  // Listens on all interactions
  client.on("interactionCreate", async (buttonInteraction) => {
    // Breaks if interaction is not from a pressed button
    if (!buttonInteraction.isButton()) return;

    const customId = buttonInteraction.customId;
    if (customId.includes("publish_quiz_stats")) {
      // Publishes the quiz-stats to all members of the chat
      await publishQuizStatsEmbed(buttonInteraction, questions, quizData);
    } else if (customId.includes("see_personal_stats")) {
      // Sends the personal stats to each participant
      await sendPersonalStatsEmbed(client, buttonInteraction, quizData, questions.length);
    } else if (customId.includes("quiz_question_button_")) {
      // Sends the next question
      await sendNextQuestionEmbed(buttonInteraction, quizData, questions);
    } else if (customId.includes("quiz_answer_")) {
      // Sends a message after a given answer, wether it's correct or not
      await checkAnswerMessage(buttonInteraction, quizData, questions);
    } else if (customId.includes("finish_button")) {
      // Sends a message, when user finished the quiz
      await finishQuizMessage(buttonInteraction, quizData, questions.length);
    }
  });
}

// Exports the quiz-command Object
module.exports = {
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Starte ein Quiz.")
    .addStringOption((option) =>
      option.setName("code").setDescription(`Füge hier den Code des Quiz ein, das du auf ${process.env.URL} erstellt hast.`).setRequired(true)
    ),

  async execute(interaction) {
    await handleQuiz(interaction);
  },
};
