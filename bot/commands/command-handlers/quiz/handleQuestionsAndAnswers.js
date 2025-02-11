const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const {
  addQuizParticipant,
  getUserQuestionStatus,
  setUserQuestionStatus,
  setQuestionAttemptsById,
  updateCorrectAnswers,
} = require("../../../../database/dbQuizFunctions");
const { updateQuizStats } = require("./handleStartAndFinish");

// Returns the Fields, Buttons and the questionsString for a given answer
function createAnswers(questions, questionIndex) {
  const alphabet = ["A", "B", "C", "D", "E"];
  const currentQuestion = questions[questionIndex];

  const answerFields = currentQuestion.answers.map((answer, i) => ({
    name: `${alphabet[i]}: `,
    value: answer.quizAnswer,
  }));

  const answerButtons = currentQuestion.answers.map((answer, i) =>
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${i}_${questionIndex + 1}`)
      .setLabel(alphabet[i])
      .setStyle(ButtonStyle.Secondary)
  );

  const questionString = currentQuestion.questionString;

  return { answerButtons, answerFields, questionString };
}

// Returns Discord-userId, the index of the current question and the index of which question the user is currently answering
async function getUserQuestionData(quizId, buttonInteraction) {
  const userId = buttonInteraction.user.id;
  const questionIndex = parseInt(buttonInteraction.customId.replace("quiz_question_button_", ""));
  const userQuestionStatus = await getUserQuestionStatus(quizId, userId);

  return { userId, questionIndex, userQuestionStatus };
}

// Creates an Embed with the question, its answer and a button for each answer
async function sendNextQuestionEmbed(buttonInteraction, quizData, questions) {
  const { userId, questionIndex, userQuestionStatus } = await getUserQuestionData(quizData.quiz_id, buttonInteraction);

  if (userQuestionStatus === undefined) {
    const data = { quizId: quizData.quiz_id, userId: userId, startTimeMs: Date.now(), questionStatus: questionIndex };
    await addQuizParticipant(data);
  } else if (userQuestionStatus <= questionIndex) {
    await setUserQuestionStatus(quizData.quiz_id, userId, questionIndex);
  } else {
    return;
  }

  const { answerButtons, answerFields, questionString } = createAnswers(questions, questionIndex);

  const questionEmbed = new EmbedBuilder().setColor(0x415a77).setTitle(questionString).addFields(answerFields);

  const actionRow = new ActionRowBuilder().addComponents(answerButtons);

  await buttonInteraction.reply({ embeds: [questionEmbed], components: [actionRow], ephemeral: true });
}

async function getUserAnswerData(quizId, buttonInteraction) {
  const subString = buttonInteraction.customId.replace("quiz_answer_", "");
  const arr = subString.split("_");
  const userId = buttonInteraction.user.id;
  const userQuestionStatus = await getUserQuestionStatus(quizId, userId);

  return { userId: userId, userQuestionStatus: userQuestionStatus, givenAnswerIndex: parseInt(arr[0]), questionIndex: parseInt(arr[1]) };
}

async function createAnswerReplyMessage(quizId, currentQuestion, userId, givenAnswerIndex) {
  const givenAnswer = currentQuestion.answers[givenAnswerIndex];
  if (givenAnswer.isCorrect) {
    await updateCorrectAnswers(quizId, userId);
    await setQuestionAttemptsById(currentQuestion.questionId, true);
    return `Your Answer **${givenAnswer.quizAnswer}** is correct! Congratulations! \n ${"Description: "}`;
  } else {
    await setQuestionAttemptsById(currentQuestion.questionId, false);
    const correctAnswer = currentQuestion.answers.find((answer) => answer.isCorrect)?.quizAnswer;
    return `Your Answer **${givenAnswer.quizAnswer}** is not correct! The correct answer is **${correctAnswer}**! \n ${"Description: "}`;
  }
}

function buildNextQuestionActionRow(questionIndex, totalQuestions) {
  let customId, label;

  if (questionIndex === totalQuestions) {
    customId = "finish_button";
    label = "Finish quiz";
  } else {
    customId = `quiz_question_button_${questionIndex}`;
    label = "Next Question";
  }

  const nextQuestion = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(ButtonStyle.Primary);

  return new ActionRowBuilder().addComponents(nextQuestion);
}

// Sends a reply message to an answered question with some additional information
async function checkAnswerMessage(interaction, buttonInteraction, quizData, questions) {
  const { userId, userQuestionStatus, givenAnswerIndex, questionIndex } = await getUserAnswerData(quizData.quiz_id, buttonInteraction);
  console.log({ userId, userQuestionStatus, givenAnswerIndex, questionIndex });

  if (userQuestionStatus < questionIndex) {
    await setUserQuestionStatus(quizData.quiz_id, userId, questionIndex);
  } else {
    return; // This button was already pressed, prevent message from being sent twice
  }

  const message = await createAnswerReplyMessage(quizData.quiz_id, questions[questionIndex - 1], buttonInteraction.user.id, givenAnswerIndex);
  const actionRow = buildNextQuestionActionRow(questionIndex, questions.length);

  console.log(message, actionRow);

  await buttonInteraction.reply({ content: message, components: [actionRow], ephemeral: true });

  await updateQuizStats(interaction, quizData, questions);
}

module.exports = {
  sendNextQuestionEmbed,
  checkAnswerMessage,
};
