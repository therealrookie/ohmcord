const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const {
  addQuizParticipant,
  getUserQuestionStatus,
  setUserQuestionStatus,
  setQuestionAttemptsById,
  updateCorrectAnswers,
} = require("../../database/db-quiz");

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

// Returns userdata by Questionbutton-Interaction
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

// Returns userdata by Answerbutton-Interaction
async function getUserAnswerData(quizId, buttonInteraction) {
  const subString = buttonInteraction.customId.replace("quiz_answer_", "");
  const arr = subString.split("_");
  const userId = buttonInteraction.user.id;
  const userQuestionStatus = await getUserQuestionStatus(quizId, userId);

  return { userId: userId, userQuestionStatus: userQuestionStatus, givenAnswerIndex: parseInt(arr[0]), questionIndex: parseInt(arr[1]) };
}

// Returns String for correct or wrong answer
async function createAnswerReplyMessage(quizId, currentQuestion, userId, givenAnswerIndex) {
  const givenAnswer = currentQuestion.answers[givenAnswerIndex];
  if (givenAnswer.isCorrect) {
    await updateCorrectAnswers(quizId, userId);
    await setQuestionAttemptsById(currentQuestion.questionId, true);
    return `Deine Antwort **${givenAnswer.quizAnswer}** ist richtig! Glückwunsch!`;
  } else {
    await setQuestionAttemptsById(currentQuestion.questionId, false);
    const correctAnswer = currentQuestion.answers.find((answer) => answer.isCorrect)?.quizAnswer;
    return `Deine Antwort **${givenAnswer.quizAnswer}** ist nicht richtig! Die richtige Antwort ist **${correctAnswer}**.`;
  }
}

// Returns Actionrow for [finish-quiz] or [next-question]
function buildNextQuestionActionRow(questionIndex, totalQuestions) {
  let customId, label, buttonStyle;

  if (questionIndex === totalQuestions) {
    customId = "finish_button";
    label = "Quiz beenden";
    buttonStyle = ButtonStyle.Success;
  } else {
    customId = `quiz_question_button_${questionIndex}`;
    label = "Nächste Frage";
    buttonStyle = ButtonStyle.Primary;
  }

  const nextQuestion = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(buttonStyle);

  return new ActionRowBuilder().addComponents(nextQuestion);
}

// Sends a reply message after an answer-button was pressed
async function checkAnswerMessage(buttonInteraction, quizData, questions) {
  const { userId, userQuestionStatus, givenAnswerIndex, questionIndex } = await getUserAnswerData(quizData.quiz_id, buttonInteraction);

  if (userQuestionStatus < questionIndex) {
    await setUserQuestionStatus(quizData.quiz_id, userId, questionIndex);
  } else {
    return; // Button was already pressed
  }

  const message = await createAnswerReplyMessage(quizData.quiz_id, questions[questionIndex - 1], buttonInteraction.user.id, givenAnswerIndex);
  const actionRow = buildNextQuestionActionRow(questionIndex, questions.length);

  await buttonInteraction.reply({ content: message, components: [actionRow], ephemeral: true });
}

module.exports = {
  sendNextQuestionEmbed,
  checkAnswerMessage,
};
