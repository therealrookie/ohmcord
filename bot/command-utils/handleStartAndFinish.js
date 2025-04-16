const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getTimeMinsAndSecs } = require("../utils/utils-functions");
const {
  getQuestionAttemptsById,
  getQuizParticipantsRanking,
  getQuizParticipantData,
  addQuizEndtime,
  clearQuizData,
} = require("../../database/dbQuizFunctions");

// Clears previous participant data, sends message to end quiz and embed for users to start quiz
async function startQuiz(client, interaction, quizData, questions) {
  await clearQuizData(quizData.quiz_id);

  await startQuizEmbed(client, interaction, quizData, questions);

  await sendEndQuizButton(interaction);
}

// Returns the visibility option (String)
function determineVisibility(index) {
  switch (index) {
    case 0:
      return "Niemand ist sichtbar.";
    case 1:
      return "Nur Plätze 1 - 3 sichtbar.";
    case 2:
      return "Alle Teilnehmer sichtbar.";
  }
}

// Creates an embed, shows general data about the quiz, adds a button for the user to start the quiz
async function startQuizEmbed(client, interaction, quizData, questions) {
  const startQuizEmbed = new EmbedBuilder()
    .setColor(0x1b263b)
    .setTitle(quizData.quiz_title)
    .setDescription(`**@${interaction.user.globalName}** hat ein Quiz gestartet.`)
    .addFields(
      { name: "Anzahl der Fragen:", value: `${questions.length}` },
      { name: "Sichtbarkeit:", value: determineVisibility(quizData.visibility) }
    );
  const startButton = new ButtonBuilder().setCustomId("quiz_question_button_0").setLabel("Start Quiz").setStyle(ButtonStyle.Success);

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

// Creates an array with a field for every question (attempts, correct and not correct answers)
function getQuestionStatFields(questionStatsData) {
  let started, finished;

  const questionStats = questionStatsData.map((stats, index) => {
    const { attempts, correct } = stats;

    if (index === 0) started = attempts; // Sets value for started at the first question
    if (index === questionStatsData.length - 1) finished = attempts; // Sets value for finished at the last question

    return {
      name: `Frage ${index + 1}:`,
      value: `**${attempts}** Versuche${attempts === 1 ? "" : "s"} - **${correct}** Richtig - **${attempts - correct}** Falsch`,
    };
  });

  return { questionStats, started, finished };
}

// Returns a String describing how many users started and finished the quiz.
function createStartedFinishedString(started, finished) {
  return `**${started}** User ha${started === 1 ? "t" : "ben"} das Quiz gestartet. \n 
      **${finished}** User ha${started === 1 ? "t" : "ben"} das Quiz beendet.`;
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

// Sends ephemeral message with the button to end the quiz and publish the stats
async function sendEndQuizButton(interaction) {
  const publishButton = new ButtonBuilder().setCustomId("publish_quiz_stats").setLabel("Quiz beenden").setStyle(ButtonStyle.Danger);

  const actionRowPublishStats = new ActionRowBuilder().addComponents(publishButton);

  await interaction.editReply({
    content: "Drücke hier um das Quiz zu beenden und die Ergebnisse zu veröffentlichen",
    components: [actionRowPublishStats],
    ephemeral: true,
  });
}

// Sends public embed for quiz-stats, button to show personal stats
async function publishQuizStatsEmbed(buttonInteraction, questions, quizData) {
  let quizStats = await getQuizStats(questions);

  const quizStatsEmbed = new EmbedBuilder()
    .setColor(0x1b263b)
    .setTitle(`${quizData.quiz_title}-Stats`)
    .setDescription(`Finale Ergebnisse des Quiz`)
    .addFields(quizStats);

  const personalStatsButton = new ButtonBuilder()
    .setCustomId("see_personal_stats")
    .setLabel("Zu den persönlichen Ergebnissen")
    .setStyle(ButtonStyle.Primary);

  const actionRowPersonalStats = new ActionRowBuilder().addComponents(personalStatsButton);

  await buttonInteraction.reply({ embeds: [quizStatsEmbed], components: [actionRowPersonalStats] });
}

// Returns the Strings for name and value of the personal stats embed field
function getPersonalStatStrings(participantData, index, totalParticipants, totalQuestions) {
  const { minutes, seconds } = getTimeMinsAndSecs(participantData.end_time_ms - participantData.start_time_ms);

  const name = `Du bist Platz ${index + 1} von ${totalParticipants}`;

  const value = `Du hast insgesamt **${participantData.correct_answers}** Frage${
    participantData.correct_answers === 1 ? "" : "n"
  } von **${totalQuestions}** Frage${totalQuestions === 1 ? "" : "n"} richtig beantwortet. \n 
  Du hast das Quiz in insgesamt ${minutes} Minute${minutes === 1 ? "" : "n"} und ${seconds} Sekunde${seconds === 1 ? "" : "n"} abgeschlossen.`;

  return { name: name, value: value };
}

// Returns the field for the Personal rank, time and correctly answered questions
async function getPersonalStats(discordUserId, quizId, totalQuestions) {
  const rankedParticipants = await getQuizParticipantsRanking(quizId);

  return rankedParticipants.map((participantData, index) => {
    if (participantData.participant_discord_id === discordUserId) {
      return getPersonalStatStrings(participantData, index, rankedParticipants.length, totalQuestions);
    }
  });
}

// Creates a single field with name: rank, value: userName, correctAnswers and time
async function getRankField(client, participantData, index) {
  const user = await client.users.fetch(participantData.participant_discord_id);
  const { minutes, seconds } = getTimeMinsAndSecs(participantData.end_time_ms - participantData.start_time_ms);

  return {
    name: `#${index + 1}`,
    value: `**${user.globalName}** ${participantData.correct_answers} richtige Antworten \n
     Zeit:  ${minutes} Minute${minutes === 1 ? "" : "n"} und ${seconds} Sekunde${seconds === 1 ? "" : "n"}`,
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

// Sends an ephemeral embed message with personal rank
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

// Sends a message after the user finishes the quiz
async function finishQuizMessage(buttonInteraction, quizData, totalQuestions) {
  await addQuizEndtime(quizData.quiz_id, buttonInteraction.user.id, Date.now());

  const quizParticipantData = await getQuizParticipantData(quizData.quiz_id, buttonInteraction.user.id);
  const { minutes, seconds } = getTimeMinsAndSecs(quizParticipantData.end_time_ms - quizParticipantData.start_time_ms);

  const text = `Glückwunsch **@${buttonInteraction.user.globalName}**! Du hast das Quiz erfolgreich beendet! \n
     Du hast **${quizParticipantData.correct_answers}** richtige Antwort${
    quizParticipantData.correct_answers === 1 ? "" : "en"
  } von **${totalQuestions}** Frage${totalQuestions === 1 ? "" : "n"}. \n
    Deine Zeit: ${minutes} Minute${minutes === 1 ? "" : "n"} und ${seconds} Sekunde${seconds === 1 ? "" : "n"}`;
  await buttonInteraction.reply({ content: text, ephemeral: true });
}

module.exports = {
  startQuiz,
  startQuizEmbed,
  publishQuizStatsEmbed,
  sendPersonalStatsEmbed,
  finishQuizMessage,
};
