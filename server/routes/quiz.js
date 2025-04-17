const express = require("express");
const quizRouter = express.Router();
const {
  addQuiz,
  getQuizByHashUrl,
  createQuizQuestion,
  addQuizAnswers,
  getAllQuizQuestions,
  updateQuizQuestion,
  //updateQuizAnswers,
  updateQuizSettings,
  createAnswer,
  updateCorrectAnswer,
  updateAnswerText,
  deleteAnswer,
  deleteQuestion,
} = require("../../database/db-quiz");

const { createHashRoute } = require("../../bot/utils/utils-functions");

quizRouter.get("/:url", async (req, res) => {
  try {
    const quizData = await getQuizByHashUrl(req.params.url);
    if (quizData) {
      res.render("edit-quiz", {
        title: quizData.quiz_title,
        hash: req.params.url,
        id: quizData.quiz_id,
        visibility: quizData.visibility,
      });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "Es ist ein Fehler aufgetaucht, während des Speicherns deines Quiz...", url: process.env.URL });
  }
});

function quizVisibility(index) {
  if (index === 0) return "Niemand ist sichtbar";
  else if (index === 1) return "Nur Plätze 1-3 sichtbar";
  else if (index === 2) return "Alle Teilnehmer sichtbar";
}

quizRouter.get("/fin/:url", async (req, res) => {
  try {
    const quizData = await getQuizByHashUrl(req.params.url);
    if (quizData) {
      res.render("fin-quiz", {
        title: quizData.quiz_title,
        hash: req.params.url,
        id: quizData.quiz_id,
        visibility: quizVisibility(quizData.visibility),
      });
    }
  } catch (error) {
    console.log(error);
    res.render("error", { text: "Es ist ein Fehler aufgetaucht, während des Speicherns deines Quiz...", url: process.env.URL });
  }
});

quizRouter.post("/", async (req, res) => {
  try {
    const { title, visibility } = req.body;

    const hashUrl = createHashRoute(title + visibility + Date.now());

    const quizData = await addQuiz(title, visibility, hashUrl);

    res.status(200).json({ hashUrl: quizData.url });
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

quizRouter.post("/update-settings", async (req, res) => {
  try {
    await updateQuizSettings(req.body);
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

quizRouter.post("/create-question", async (req, res) => {
  try {
    const { quizId, question } = req.body;

    const quizQuestionId = await createQuizQuestion(quizId, question);

    res.status(200).json({ quizQuestionId: quizQuestionId });
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

quizRouter.post("/save-answers", async (req, res) => {
  try {
    const { answers, quizQuestionId } = req.body;

    const result = await addQuizAnswers(quizQuestionId, answers);

    res.status(200);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

quizRouter.get(`/get-questions/:quizid`, async (req, res) => {
  try {
    const quizId = req.params.quizid;
    const allQuestions = await getAllQuizQuestions(quizId);
    res.status(200).send(allQuestions);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't get Quiz questions.");
  }
});

quizRouter.put("/update-question", async (req, res) => {
  try {
    const { questionId, question } = req.body;

    const result = await updateQuizQuestion(questionId, question);

    res.status(200).send("Question updated sucessfully.");
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update Question.");
  }
});

/*
quizRouter.put("/update-answers", async (req, res) => {
  try {
    const { questionId, answers, checkboxes } = req.body;

    const result = await updateQuizAnswers(questionId, answers, checkboxes);

    res.status(200).send("Answers updated sucessfully.");
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update answers.");
  }
});
*/

quizRouter.post("/create-answer", async (req, res) => {
  try {
    const { questionId } = req.body;

    const result = await createAnswer(questionId);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update answers.");
  }
});

quizRouter.put("/update-correct-answer", async (req, res) => {
  try {
    const { answerId, isChecked } = req.body;

    const result = await updateCorrectAnswer(answerId, isChecked);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update answers.");
  }
});

quizRouter.put("/update-answer-text", async (req, res) => {
  try {
    const { answerId, text } = req.body;

    const result = await updateAnswerText(answerId, text);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update answers.");
  }
});

quizRouter.delete("/answer", async (req, res) => {
  try {
    const { answerId } = req.body;

    const result = await deleteAnswer(answerId);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update answers.");
  }
});

quizRouter.delete("/question", async (req, res) => {
  try {
    const { questionId } = req.body;

    const result = await deleteQuestion(questionId);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't update answers.");
  }
});

quizRouter.param("url", async (req, res, next, url) => {
  next();
});

module.exports = { quizRouter };
