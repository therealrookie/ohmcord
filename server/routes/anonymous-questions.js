const express = require("express");
const questionRouter = express.Router();
const { getQuestionSession, getAnonymousQuestions, getAnonymousAnswers } = require("../../database/db-anon-questions");

// Renders anonymous-question.ejs file
questionRouter.get("/:hashRoute", async (req, res) => {
  try {
    const questionSession = await getQuestionSession(req.params.hashRoute);
    if (questionSession) {
      res.render("anonymous-questions", {
        topic: questionSession.topic,
        hash: req.params.hashRoute,
        id: questionSession.question_session_id,
        wsUrl: process.env.WS_URL,
      });
    }
  } catch (error) {
    console.error(error);
    res.render("error", { text: "Diese Fragerunde existiert leider nicht...", url: process.env.URL });
  }
});

// Gets all questions by questionSessionId
questionRouter.get("/get-questions/:questionSessionId", async (req, res) => {
  try {
    const questions = await getAnonymousQuestions(req.params.questionSessionId);
    res.status(200).send(questions);
  } catch (error) {
    res.status(500).send("Couldn't get questions.");
  }
});

// Gets all answers by questionId
questionRouter.get("/get-answers/:questionId", async (req, res) => {
  try {
    const answers = await getAnonymousAnswers(req.params.questionId);
    res.status(200).send(answers);
  } catch (error) {
    res.status(500).send("Couldn't get answers.");
  }
});

module.exports = { questionRouter };
