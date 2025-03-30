const express = require("express");
const pollRouter = express.Router();
const { getPollByHashRoute, getPollAnswers, addPoll } = require("../../database/dbPollFunctions");

pollRouter.post("/save-poll", async (req, res) => {
  try {
    console.log(req);

    const { question, answers } = req.body;

    console.log("SAVE POLL: ", req.body);

    const result = await addPoll(question, answers);
    console.log("POLL DATA: : ", result);

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

pollRouter.get("/:hashRoute", async (req, res) => {
  try {
    const pollData = await getPollByHashRoute(req.params.hashRoute);
    const answers = await getPollAnswers(pollData.poll_id);
    console.log("ANSWERS: ", answers);
    if (pollData) {
      res.render("display-poll", {
        title: pollData.question,
        hashRoute: req.params.hashRoute,
        id: pollData.poll_id,
        multipleAnswers: pollData.multiple_answers,
        duration: pollData.duration,
        answers: JSON.stringify(answers),
      });
    } else {
      res.render("error", { text: "Quiz couldn't be found" });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "An error occurred while fetching quiz data" });
  }
});

module.exports = { pollRouter };
