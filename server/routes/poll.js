const express = require("express");
const pollRouter = express.Router();
const { getPollByHashRoute, getPollAnswers, addPoll } = require("../../database/db-poll");

// Saves poll and answers to the database
pollRouter.post("/save-poll", async (req, res) => {
  try {
    const { question, answers } = req.body;

    const result = await addPoll(question, answers);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

// Renders display-poll.ejs file
pollRouter.get("/:hashRoute", async (req, res) => {
  try {
    const pollData = await getPollByHashRoute(req.params.hashRoute);
    const answers = await getPollAnswers(pollData.poll_id);
    if (pollData) {
      res.render("display-poll", {
        title: pollData.question,
        hashRoute: req.params.hashRoute,
        id: pollData.poll_id,
        multipleAnswers: pollData.multiple_answers,
        duration: pollData.duration,
        answers: JSON.stringify(answers),
      });
    }
  } catch (error) {
    console.error(error);
    res.render("error", { text: "Es ist ein Fehler aufgetaucht, während des Speicherns deiner Umfrage...", url: process.env.URL });
  }
});

module.exports = { pollRouter };
