const { SlashCommandBuilder } = require("discord.js");

const { getQuizByHashUrl, getAllQuizQuestions } = require("../../../database/dbQuizFunctions");
const { startQuiz, publishQuizStatsEmbed, sendPersonalStatsEmbed, finishQuizMessage } = require("../command-handlers/quiz/handleStartAndFinish");
const { sendNextQuestionEmbed, checkAnswerMessage } = require("../command-handlers/quiz/handleQuestionsAndAnswers");

async function handleQuiz(interaction) {
  const client = interaction.client;
  const hashRoute = interaction.options.get("code").value; // Get Hashroute-code from command-input-field
  const quizData = await getQuizByHashUrl(hashRoute); // Get quizData from database
  const questions = await getAllQuizQuestions(quizData.quiz_id); // Get questions (+answers) from database

  // Start quiz: Send start-quiz-embed and quiz-stats-embed
  await startQuiz(client, interaction, quizData, questions);

  // Listen on all interactions
  client.on("interactionCreate", async (buttonInteraction) => {
    // Break if interaction is not from a pressed button
    if (!buttonInteraction.isButton()) return;

    const customId = buttonInteraction.customId;
    if (customId.includes("publish_quiz_stats")) {
      // Publish the quiz-stats to all members of the chat
      await publishQuizStatsEmbed(buttonInteraction, questions, quizData);
    } else if (customId.includes("see_personal_stats")) {
      // Send the personal stats to each participant
      await sendPersonalStatsEmbed(client, buttonInteraction, quizData, questions.length);
    } else if (customId.includes("quiz_question_button_")) {
      // Send the next question
      await sendNextQuestionEmbed(buttonInteraction, quizData, questions);
    } else if (customId.includes("quiz_answer_")) {
      // Send a message after a given answer, wether it's correct or not
      await checkAnswerMessage(interaction, buttonInteraction, quizData, questions);
    } else if (customId.includes("finish_button")) {
      // Send a message, when user finished the quiz
      await finishQuizMessage(buttonInteraction, quizData, questions.length);
    }
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Starte ein Quiz.")
    .addStringOption((option) =>
      option.setName("code").setDescription("Füge hier den Code des Quiz ein, das du auf der Website erstellt hast.").setRequired(true)
    ),

  async execute(interaction) {
    await handleQuiz(interaction);
  },
};
