const { Client, Interaction, ApplicationCommandOptionType } = require("discord.js");
const { getPollByHashRoute, getPollAnswers } = require("../../../database/dbPollFunctions");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const pollData = await getPollByHashRoute(interaction.options.get("code").value);
    const answersData = await getPollAnswers(pollData.poll_id);

    function getEmoji(code) {
      if (code === "") return "";
      else if (code.includes(",")) return String.fromCodePoint(code.split(",")[0], code.split(",")[1]);
      else return String.fromCodePoint(code);
    }

    const answers = answersData.map((answer) => {
      return { text: answer.answer, emoji: getEmoji(answer.emoji) };
    });

    await interaction.reply({
      poll: {
        question: { text: pollData.question },
        answers: answers,
        allowMultiselect: pollData.multiple_answers,
        duration: pollData.duration,
      },
    });
  },

  // Data structure of the poll-command
  name: "poll",
  description: "Start a poll",
  options: [
    {
      name: "code",
      description: "The code of the online created poll.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
