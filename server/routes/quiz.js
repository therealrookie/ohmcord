const express = require("express");
const quizRouter = express.Router();
const {
  addQuiz,
  getQuizByHashUrl,
  createQuizQuestion,
  getAllQuizQuestions,
  updateQuizQuestion,
  updateQuizSettings,
  createAnswer,
  updateCorrectAnswer,
  updateAnswerText,
  deleteAnswer,
  deleteQuestion,
} = require("../../database/db-quiz");

const { createHashRoute } = require("../../bot/utils/utils-functions");

// Render edit-quiz.ejs file
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

// Determines the visibility of the quiz by its visibilityIndex
function quizVisibility(index) {
  if (index === 0) return "Niemand ist sichtbar";
  else if (index === 1) return "Nur Plätze 1-3 sichtbar";
  else if (index === 2) return "Alle Teilnehmer sichtbar";
}

// Renders the fin-quiz.ejs file
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

// Adds / Creates new quiz in the database
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

// Updates quiz settings (title and visibility)
quizRouter.post("/update-settings", async (req, res) => {
  try {
    await updateQuizSettings(req.body);
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

// Adds a new question to the database
quizRouter.post("/create-question", async (req, res) => {
  try {
    const { quizId, question } = req.body;

    const quizQuestionId = await createQuizQuestion(quizId, question);

    res.status(200).json({ quizQuestionId: quizQuestionId });
  } catch (error) {
    res.status(500).send("Couldn't get Brainstorm contributions.");
  }
});

// Gets all questions and answers from the database
// [{questionId, questionString, answers: [answerId, quizAnswer, isCorrect]}, {...}]
quizRouter.get(`/get-questions/:quizId`, async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const allQuestions = await getAllQuizQuestions(quizId);
    res.status(200).send(allQuestions);
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't get Quiz questions.");
  }
});

// Updates the question (String)
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

// Creates an empty answer for a questionId
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

// Updates the is_correct flag of an answer in the database
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

// Updates the answer (String)
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

// Deletes an answer
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

// Deletes a question and its answers
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

module.exports = { quizRouter };
