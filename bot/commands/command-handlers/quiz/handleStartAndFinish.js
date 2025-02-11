const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getTimeMinsAndSecs } = require("../../../utils/utilsFunctions");
const {
  getQuestionAttemptsById,
  getQuizParticipantsRanking,
  getQuizParticipantData,
  addQuizEndtime,
  clearQuizData,
} = require("../../../../database/dbQuizFunctions");

// Response to the command, sends quiz-stats (only for the "command-executer") and quiz-start-embed
async function startQuiz(client, interaction, quizData, questions) {
  await interaction.deferReply({ ephemeral: true });

  await clearQuizData(quizData.quiz_id);

  await startQuizEmbed(client, interaction, quizData, questions);

  await updateQuizStats(interaction, quizData, questions);
}

function determineVisibility(index) {
  switch (index) {
    case 0:
      return "No results will be published.";
    case 1:
      return "Only results of places #1 - #3 will be published.";
    case 2:
      return "All results will be published.";
  }
}

// Creates an embed, shows general data about the quiz, adds a button for the user to start the quiz
async function startQuizEmbed(client, interaction, quizData, questions) {
  const startQuizEmbed = new EmbedBuilder()
    .setColor(0x1b263b)
    .setTitle(quizData.quiz_title)
    .setDescription(`**@${interaction.user.globalName}** started a quiz.`)
    .addFields({ name: "Questions:", value: `${questions.length}` }, { name: "Visibility:", value: determineVisibility(quizData.visibility) });
  const startButton = new ButtonBuilder().setCustomId("quiz_question_button_0").setLabel("Start Quiz").setStyle(ButtonStyle.Primary);

  const actionRowQuizStart = new ActionRowBuilder().addComponents(startButton);

  const channel = await client.channels.fetch(interaction.channelId);
  await channel.send({ embeds: [startQuizEmbed], components: [actionRowQuizStart] });
}

// Returns an array of objects (attempts, correct) for every question
async function getQuestionStatsData(questions) {
  const questionStatsData = await Promise.all(
    questions.map(async (question) => {
      const { attempts, correct } = await getQuestionAttemptsById(question.questionId);
      return { attempts, correct };
    })
  );
  return questionStatsData;
}

// Creates an array with a field for every questions (attempts, correct and not correct answers)
function getQuestionStatFields(questionStatsData) {
  let started, finished;

  const questionStats = questionStatsData.map((stats, index) => {
    const { attempts, correct } = stats;

    if (index === 0) started = attempts; // Sets value for started at the first question
    if (index === questionStatsData.length - 1) finished = attempts; // Sets value for finished at the last question

    return {
      name: `Question ${index + 1}:`,
      value: `**${attempts}** Attempt${attempts === 1 ? "" : "s"} - **${correct}** Correct - **${attempts - correct}** Not correct`,
    };
  });

  return { questionStats, started, finished };
}

// Returns a String describing how many users started and finished the quiz.
function createStartedFinishedString(started, finished) {
  return `**${started}** user${started === 1 ? "" : "s"} started the quiz. \n 
      **${finished}** user${finished === 1 ? "" : "s"} finished the quiz.`;
}

// Returns the complete array of fields for all the quiz stats
async function getQuizStats(questions) {
  const questionStatsData = await getQuestionStatsData(questions);

  const { questionStats, started, finished } = getQuestionStatFields(questionStatsData);

  questionStats.unshift({
    name: "Stats",
    value: createStartedFinishedString(started, finished),
  });

  return questionStats;
}

// Updates the embed containing all the quiz stats, contains a button that publishes the stats
async function updateQuizStats(interaction, quizData, questions) {
  const quizStats = await getQuizStats(questions);

  const quizStatsEmbed = new EmbedBuilder()
    .setColor(0x1b263b)
    .setTitle(`${quizData.quiz_title}-Stats`)
    .setDescription(`Stats of your Quiz`)
    .addFields(quizStats);
  const publishButton = new ButtonBuilder().setCustomId("publish_quiz_stats").setLabel("Finish & Publish Quiz").setStyle(ButtonStyle.Primary);

  const actionRowPublishStats = new ActionRowBuilder().addComponents(publishButton);

  await interaction.editReply({ embeds: [quizStatsEmbed], components: [actionRowPublishStats], ephemeral: true });
}

// Send public embed for quiz-stats, button to show personal stats
async function publishQuizStatsEmbed(buttonInteraction, questions, quizData) {
  let quizStats = await getQuizStats(questions);

  const quizStatsEmbed = new EmbedBuilder()
    .setColor(0x1b263b)
    .setTitle(`${quizData.quiz_title}-Stats`)
    .setDescription(`Final stats of your Quiz`)
    .addFields(quizStats);

  const personalStatsButton = new ButtonBuilder().setCustomId("see_personal_stats").setLabel("See personal stats").setStyle(ButtonStyle.Primary);

  const actionRowPersonalStats = new ActionRowBuilder().addComponents(personalStatsButton);

  await buttonInteraction.reply({ embeds: [quizStatsEmbed], components: [actionRowPersonalStats] });
}

// Returns the Strings for name and value of the personal stats embed field
function getPersonalStatStrings(participantData, index, totalParticipants, totalQuestions) {
  const { minutes, seconds } = getTimeMinsAndSecs(participantData.end_time_ms - participantData.start_time_ms);

  const name = `You are rank ${index + 1} of ${totalParticipants}`;

  const value = `You managed to get **${participantData.correct_answers}** answer${
    participantData.correct_answers === 1 ? "" : "s"
  } of **${totalQuestions}** question${totalQuestions === 1 ? "" : "s"} right. \n 
  You finished the quiz in a total of ${minutes} minute${minutes === 1 ? "" : "s"} and ${seconds} second${seconds === 1 ? "" : "s"}`;

  return { name: name, value: value };
}

// Returns the field for the Personal rank, time and correctly answered questions
async function getPersonalStats(discordUserId, quizId, totalQuestions) {
  console.log("QUIZID: ", quizId);
  const rankedParticipants = await getQuizParticipantsRanking(quizId);
  console.log("Ranked participants: ", rankedParticipants);

  return rankedParticipants.map((participantData, index) => {
    if (participantData.participant_discord_id === discordUserId) {
      return getPersonalStatStrings(participantData, index, rankedParticipants.length, totalQuestions);
    }
  });
}

// Create a single field with name: rank, value: userName, correctAnswers and time
async function getRankField(client, participantData, index) {
  const user = await client.users.fetch(participantData.participant_discord_id);
  const { minutes, seconds } = getTimeMinsAndSecs(participantData.end_time_ms - participantData.start_time_ms);

  return {
    name: `#${index + 1}`,
    value: `**${user.globalName}** ${participantData.correct_answers} correct answers \n
     time:  ${minutes} minute${minutes === 1 ? "" : "s"} and ${seconds} second${seconds === 1 ? "" : "s"}`,
  };
}

// Returns the fields for the personal data and rank #1 to #3
async function getRankOneToThree(client, discordUserId, quizId, totalQuestions) {
  const rankedParticipants = await getQuizParticipantsRanking(quizId);

  let fields = [];

  for (const [index, participantData] of rankedParticipants.entries()) {
    if (index < 3) {
      const rankField = await getRankField(client, participantData, index);
      fields.push(rankField);
    }

    if (participantData.participant_discord_id === discordUserId) {
      const personalStats = getPersonalStatStrings(participantData, index, rankedParticipants.length, totalQuestions);
      fields.unshift({ name: "\u200B", value: "\u200B" });
      fields.unshift(personalStats);
    }
  }

  return fields;
}

// Returns the fields for all the ranks
async function getAllRanks(client, quizId) {
  const rankedParticipants = await getQuizParticipantsRanking(quizId);

  let fields = [];

  for (const [index, participantData] of rankedParticipants.entries()) {
    const rankField = await getRankField(client, participantData, index);
    fields.push(rankField);
  }

  return fields;
}

// Send ephemeral embed message with personal rank
async function sendPersonalStatsEmbed(client, buttonInteraction, quizData, totalQuestions) {
  let personalStats;

  switch (quizData.visibility) {
    case 0: // No userdata will be published
      personalStats = await getPersonalStats(buttonInteraction.user.id, quizData.quiz_id, totalQuestions);
      break;
    case 1: // Only rank #1 - #3 will be published
      personalStats = await getRankOneToThree(client, buttonInteraction.user.id, quizData.quiz_id, totalQuestions);
      break;
    case 2: // All ranks will be published
      personalStats = await getAllRanks(client, quizData.quiz_id);
      break;
  }

  const personalStatsEmbed = new EmbedBuilder().setColor(0x1b263b).setTitle(`Ranking`).addFields(personalStats);

  await buttonInteraction.reply({ embeds: [personalStatsEmbed], ephemeral: true });
}

// Send a message after the user finishes the quiz
async function finishQuizMessage(buttonInteraction, quizData, totalQuestions) {
  await addQuizEndtime(quizData.quiz_id, buttonInteraction.user.id, Date.now());

  const quizParticipantData = await getQuizParticipantData(quizData.quiz_id, buttonInteraction.user.id);
  const { minutes, seconds } = getTimeMinsAndSecs(quizParticipantData.end_time_ms - quizParticipantData.start_time_ms);

  const text = `Congrats **@${buttonInteraction.user.globalName}**! You finished the quiz! \n
     **${quizParticipantData.correct_answers}** correct answer${
    quizParticipantData.correct_answers === 1 ? "" : "s"
  } of **${totalQuestions}** question${totalQuestions === 1 ? "" : "s"}.
    Your time: ${minutes} minute${minutes === 1 ? "" : "s"} and ${seconds} second${seconds === 1 ? "" : "s"}`;
  await buttonInteraction.reply({ content: text, ephemeral: true });
}

module.exports = {
  startQuiz,
  startQuizEmbed,
  updateQuizStats,
  publishQuizStatsEmbed,
  sendPersonalStatsEmbed,
  finishQuizMessage,
};
