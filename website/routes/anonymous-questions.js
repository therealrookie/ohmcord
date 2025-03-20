const express = require("express");
const questionRouter = express.Router();
const { getQuestionSession, getAnonymousQuestions, getAnonymousAnswers } = require("../../database/dbAnonymousQuestionFunctions");

/*
const { WebSocket } = require("ws");
const ws = new WebSocket(`${process.env.WS_URL}`);
*/

questionRouter.get("/:url", async (req, res) => {
  try {
    const questionSession = await getQuestionSession(req.params.url);
    if (questionSession) {
      res.render("anonymous-questions", {
        topic: questionSession.topic,
        hash: req.params.url,
        id: questionSession.question_session_id,
      });
    } else {
      res.render("error", { text: "Question-Session couldn't be found" });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "An error occurred while fetching question data" });
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

async function handleQuestionMessage(message, ws, wss) {
  console.log("MESSAGE: ", message);
  const { questionSessionId, question, question_id } = message;

  // Broadcast the new question to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "new-question", data: { questionSessionId, question, question_id } }));
    }
  });
}

async function handleAnswerMessage(message, ws, wss) {
  console.log("MESSAGE: ", message);
  const { answer_id, question_id, answer } = message;

  // Broadcast the new question to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "new-answer", data: { answer_id, question_id, answer } }));
    }
  });
}

module.exports = { questionRouter, handleQuestionMessage, handleAnswerMessage };
