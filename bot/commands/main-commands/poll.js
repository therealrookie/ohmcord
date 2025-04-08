const { SlashCommandBuilder } = require("discord.js");

const { getPollByHashRoute, getPollAnswers } = require("../../../database/dbPollFunctions");

async function handlePoll(interaction) {
  await interaction.deferReply(); // Delay reply

  const pollData = await getPollByHashRoute(interaction.options.get("code").value);
  const answersData = await getPollAnswers(pollData.poll_id);

  console.log("POLL: ", pollData, answersData);

  function getEmoji(code) {
    if (code === "") return "";
    else if (code.includes(",")) return String.fromCodePoint(code.split(",")[0], code.split(",")[1]);
    else return String.fromCodePoint(code);
  }

  const answers = answersData.map((answer) => {
    return { text: answer.answer, emoji: getEmoji(answer.emoji) };
  });

  await interaction.editReply({
    poll: {
      question: { text: pollData.question },
      answers: answers,
      allowMultiselect: pollData.multiple_answers,
      duration: pollData.duration,
    },
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Starte eine Umfrage.")
    .addStringOption((option) =>
      option.setName("code").setDescription(`Code von erstellter Umfrage ${process.env.URL}/poll einfügen.`).setRequired(true)
    ),
  async execute(interaction) {
    await handlePoll(interaction);
  },
};
