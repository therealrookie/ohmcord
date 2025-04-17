const express = require("express");
const questionRouter = express.Router();
const { getQuestionSession, getAnonymousQuestions, getAnonymousAnswers } = require("../../database/db-anon-questions");

questionRouter.get("/:url", async (req, res) => {
  try {
    const questionSession = await getQuestionSession(req.params.url);
    if (questionSession) {
      res.render("anonymous-questions", {
        topic: questionSession.topic,
        hash: req.params.url,
        id: questionSession.question_session_id,
        wsUrl: process.env.WS_URL,
      });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "Diese Fragerunde existiert leider nicht...", url: process.env.URL });
  }
});

questionRouter.get("/get-questions/:id", async (req, res) => {
  try {
    const questions = await getAnonymousQuestions(req.params.id);
    res.status(200).send(questions);
  } catch (error) {
    res.status(500).send("Couldn't get questions.");
  }
});

questionRouter.get("/get-answers/:id", async (req, res) => {
  try {
    const answers = await getAnonymousAnswers(req.params.id);
    res.status(200).send(answers);
  } catch (error) {
    res.status(500).send("Couldn't get answers.");
  }
});

questionRouter.param("url", async (req, res, next, url) => {
  next();
});

module.exports = { questionRouter };
