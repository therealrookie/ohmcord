const pgpool = require("./db");

async function addQuestionSession(topic, hashUrl) {
  try {
    const questionSession = await pgpool.query("INSERT INTO public.question_sessions (topic, url) VALUES($1, $2) RETURNING *", [topic, hashUrl]);
    return questionSession.rows[0].question_session_id;
  } catch (err) {
    return err.message;
  }
}

async function addAnonymousQuestion(id, question) {
  try {
    const newQuestion = await pgpool.query("INSERT INTO public.question_contributions (question_session_id, question) VALUES($1, $2) RETURNING *", [
      id,
      question,
    ]);
    return newQuestion.rows[0].question_id;
  } catch (err) {
    return err.message;
  }
}

async function addQuestionMessageId(questionId, discordMessageId) {
  try {
    const question = await pgpool.query("UPDATE public.question_contributions SET discord_message_id = $1 WHERE question_id = $2 RETURNING *", [
      discordMessageId,
      questionId,
    ]);
    return question.rows[0];
  } catch (err) {
    throw new Error("Failed to update Discord Message ID");
  }
}

async function getQuestionMessageId(questionId) {
  try {
    const questionMessageId = await pgpool.query("SELECT discord_message_id FROM public.question_contributions WHERE question_id = $1", [questionId]);
    return questionMessageId.rows[0].discord_message_id;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch brainstorm data");
  }
}

async function getQuestionById(questionId) {
  try {
    const question = await pgpool.query("SELECT question FROM public.question_contributions WHERE question_id = $1", [questionId]);
    return question.rows[0].question;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch brainstorm data");
  }
}

async function getQuestionSession(hashUrl) {
  try {
    const questionSession = await pgpool.query("SELECT * FROM public.question_sessions WHERE url = $1", [hashUrl]);
    return questionSession.rows[0];
  } catch (err) {
    throw new Error("Failed to fetch question_sessions data");
  }
}

async function getAnonymousQuestions(id) {
  try {
    const questions = await pgpool.query("SELECT * FROM public.question_contributions WHERE question_session_id = $1", [id]);
    return questions.rows;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch brainstorm data");
  }
}

async function addAnonymousAnswer(questionId, answer) {
  try {
    const newAnswer = await pgpool.query("INSERT INTO public.question_answers (question_id, answer) VALUES($1, $2) RETURNING *", [
      questionId,
      answer,
    ]);
    return newAnswer.rows[0].answer_id;
  } catch (err) {
    return err.message;
  }
}

async function getAnonymousAnswers(questionId) {
  try {
    const questions = await pgpool.query("SELECT * FROM public.question_answers WHERE question_id = $1", [questionId]);
    return questions.rows;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch brainstorm data");
  }
}

module.exports = {
  addQuestionSession,
  addAnonymousQuestion,
  getQuestionSession,
  getAnonymousQuestions,
  addAnonymousAnswer,
  getAnonymousAnswers,
  addQuestionMessageId,
  getQuestionMessageId,
  getQuestionById,
};
