const pgpool = require("./db");

// Adds title, visibility and hashRoute to quiz-table
async function addQuiz(title, visibility, hashRoute) {
  try {
    const newQuiz = await pgpool.query("INSERT INTO public.quiz (quiz_title, visibility, url) VALUES($1, $2, $3) RETURNING *", [
      title,
      visibility,
      hashRoute,
    ]);
    return newQuiz.rows[0];
  } catch (err) {
    return err.message;
  }
}

// Gets quiz-data by its hashRoute
async function getQuizByHashUrl(hashRoute) {
  try {
    const quiz = await pgpool.query("SELECT * FROM public.quiz WHERE url = $1", [hashRoute]);
    return quiz.rows[0];
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch brainstorm data");
  }
}

// Adds a question to quiz_questions
async function createQuizQuestion(quizId, question) {
  try {
    const newQuiz = await pgpool.query(
      "INSERT INTO public.quiz_questions (quiz_id, quiz_question, attempts, correct) VALUES($1, $2, $3, $4) RETURNING *",
      [quizId, question, 0, 0]
    );
    return newQuiz.rows[0].quiz_question_id;
  } catch (err) {
    return err.message;
  }
}

// Adds an answer to quiz_answers
async function createAnswer(quizQuestionId) {
  try {
    const response = await pgpool.query("INSERT INTO public.quiz_answers (quiz_question_id) VALUES($1) RETURNING quiz_answer_id", [quizQuestionId]);
    return response.rows[0].quiz_answer_id;
  } catch (error) {
    return error.message;
  }
}

// Changes the is_correct value of an answer by its ID
async function updateCorrectAnswer(answerId, isChecked) {
  try {
    const response = await pgpool.query("UPDATE public.quiz_answers SET is_correct = $1 WHERE quiz_answer_id = $2", [isChecked, answerId]);
    return response;
  } catch (error) {
    return error.message;
  }
}

// Updates the text of an answer
async function updateAnswerText(answerId, text) {
  try {
    const response = await pgpool.query("UPDATE public.quiz_answers SET quiz_answer = $1 WHERE quiz_answer_id = $2", [text, answerId]);
    return response;
  } catch (error) {
    return error.message;
  }
}

// Deltetes an answer
async function deleteAnswer(answerId) {
  try {
    const response = await pgpool.query("DELETE FROM public.quiz_answers WHERE quiz_answer_id = $1", [answerId]);
    return response;
  } catch (error) {
    return error.message;
  }
}

// Deletes a question and its answers
async function deleteQuestion(questionId) {
  const client = await pgpool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM public.quiz_questions WHERE quiz_question_id = $1", [questionId]);

    await client.query("DELETE FROM public.quiz_answers WHERE quiz_question_id = $1", [questionId]);

    await client.query("COMMIT");
    return "Answers updated successfully.";
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating quiz answers:", error);
    throw new Error("Failed to update quiz answers");
  } finally {
    client.release();
  }
}

// Adds multiple Answers
async function addQuizAnswers(quizQuestionId, answers) {
  try {
    answers.forEach(async (answer) => {
      const { answerString, isCorrect } = answer;

      await pgpool.query("INSERT INTO public.quiz_answers (quiz_question_id, quiz_answer, is_correct) VALUES($1, $2, $3)", [
        quizQuestionId,
        answerString,
        isCorrect,
      ]);
    });
    return "Answers added successfully!";
  } catch (err) {
    return err.message;
  }
}

// Returns all questions of a quiz by its ID
async function getAllQuizQuestions(quizId) {
  try {
    const result = await pgpool.query(
      `
        SELECT 
          q.quiz_question_id, 
          q.quiz_question, 
          a.quiz_answer_id,
          a.quiz_answer, 
          a.is_correct 
        FROM public.quiz_questions q
        LEFT JOIN public.quiz_answers a ON q.quiz_question_id = a.quiz_question_id
        WHERE q.quiz_id = $1
        ORDER BY q.quiz_question_id, a.quiz_answer_id
        `,
      [quizId]
    );

    const questionMap = {};

    result.rows.forEach((row) => {
      if (!questionMap[row.quiz_question_id]) {
        questionMap[row.quiz_question_id] = {
          questionId: row.quiz_question_id,
          questionString: row.quiz_question,
          answers: [],
        };
      }
      // Pushes the answer if it exists (handles cases where there may not be an answer)
      questionMap[row.quiz_question_id].answers.push({
        answerId: row.quiz_answer_id,
        quizAnswer: row.quiz_answer,
        isCorrect: row.is_correct,
      });
    });

    // Converts the questionMap object into an array
    const questionArray = Object.values(questionMap);

    return questionArray;
  } catch (error) {
    console.error("Error fetching quiz questions and answers:", error.message);
    throw new Error("Failed to fetch quiz questions and answers.");
  }
}

//
async function updateQuizQuestion(questionId, question) {
  try {
    const questionData = await pgpool.query("UPDATE public.quiz_questions SET quiz_question = $1 WHERE quiz_question_id = $2 RETURNING *", [
      question,
      questionId,
    ]);
    return questionData.rows[0];
  } catch (error) {
    console.error("Error updating quiz question:", error);
    throw new Error("Failed to update quiz question");
  }
}

async function updateQuizAnswers(questionId, answers, checkboxes) {
  const client = await pgpool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM public.quiz_answers WHERE quiz_question_id = $1", [questionId]);

    const insertValues = answers.map((answer, index) => `(${questionId}, $${index * 2 + 1}, $${index * 2 + 2})`).join(", ");
    const insertParams = answers.flatMap((answer, index) => [answer, checkboxes[index]]);

    if (answers.length > 0) {
      await client.query(`INSERT INTO public.quiz_answers (quiz_question_id, quiz_answer, is_correct) VALUES ${insertValues}`, insertParams);
    }

    await client.query("COMMIT");
    return "Answers updated successfully.";
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating quiz answers:", error);
    throw new Error("Failed to update quiz answers");
  } finally {
    client.release();
  }
}

async function addQuizParticipant(data) {
  try {
    const { quizId, userId, startTimeMs, questionStatus } = data;

    const response = await pgpool.query(
      "INSERT INTO public.quiz_participants (quiz_id, participant_discord_id, start_time_ms, correct_answers, question_status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [quizId, userId, startTimeMs, 0, questionStatus]
    );

    return response.rows[0].participants_id;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getUserQuestionStatus(quizId, userId) {
  try {
    const response = await pgpool.query(`SELECT question_status FROM public.quiz_participants WHERE quiz_id = $1 AND participant_discord_id = $2`, [
      quizId,
      userId,
    ]);
    return response.rows[0]?.question_status;
  } catch (error) {
    console.log(error);
    return -1;
  }
}

async function setUserQuestionStatus(quizId, userId, status) {
  try {
    const response = await pgpool.query(
      "UPDATE public.quiz_participants SET question_status = $1 WHERE quiz_id = $2 AND participant_discord_id = $3",
      [status, quizId, userId]
    );
    return response.rows[0];
  } catch (error) {
    console.log(error);
    return -1;
  }
}
// ...
async function updateCorrectAnswers(quizId, userId) {
  try {
    await pgpool.query(
      "UPDATE public.quiz_participants SET correct_answers = correct_answers + 1 WHERE quiz_id = $1 AND participant_discord_id = $2",
      [quizId, userId]
    );
  } catch (error) {
    console.log(error);
  }
}

async function addQuizEndtime(quizId, userId, endTimeMs) {
  try {
    await pgpool.query("UPDATE public.quiz_participants SET end_time_ms = $1 WHERE quiz_id = $2 AND participant_discord_id = $3", [
      endTimeMs,
      quizId,
      userId,
    ]);
  } catch (error) {
    console.log(error);
  }
}

async function getQuizParticipantData(quizId, userId) {
  try {
    const response = await pgpool.query("SELECT * FROM public.quiz_participants WHERE quiz_id = $1 AND participant_discord_id = $2", [
      quizId,
      userId,
    ]);
    return response.rows[0];
  } catch (error) {
    console.log(error);
  }
}

async function getQuizParticipantsRanking(quizId) {
  try {
    const response = await pgpool.query(
      `SELECT * 
         FROM public.quiz_participants
         WHERE quiz_id = $1
         ORDER BY correct_answers DESC, (end_time_ms - start_time_ms) ASC`,
      [quizId]
    );
    return response.rows;
  } catch (error) {
    console.log(error);
  }
}

async function getQuestionAttemptsById(questionId) {
  try {
    const response = await pgpool.query("SELECT attempts, correct FROM public.quiz_questions WHERE quiz_question_id = $1", [questionId]);
    return { attempts: response.rows[0].attempts, correct: response.rows[0].correct };
  } catch (error) {
    console.log(error);
  }
}

async function setQuestionAttemptsById(questionId, isCorrect) {
  console.log("NEW ATTEMPT", questionId, isCorrect);
  try {
    const response = await pgpool.query(
      `UPDATE public.quiz_questions
         SET attempts = attempts + 1,
             correct = correct + CASE WHEN $2 THEN 1 ELSE 0 END
         WHERE quiz_question_id = $1
         RETURNING attempts, correct`,
      [questionId, isCorrect]
    );
  } catch (error) {
    console.log(error);
  }
}

async function clearQuizData(quizId) {
  const client = await pgpool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM public.quiz_participants WHERE quiz_id = $1", [quizId]);

    await client.query("UPDATE public.quiz_questions SET attempts = 0, correct = 0 WHERE quiz_id = $1", [quizId]);

    await client.query("COMMIT");

    return "Quiz data cleared successfully.";
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating quiz answers:", error);
    throw new Error("Failed to update quiz answers");
  } finally {
    client.release();
  }
}

async function updateQuizSettings(body) {
  try {
    const { quizId, column, value } = body;
    const response = await pgpool.query(`UPDATE public.quiz SET ${column} = $1 WHERE quiz_id = $2 RETURNING *`, [value, quizId]);
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  addQuiz,
  getQuizByHashUrl,
  createQuizQuestion,
  addQuizAnswers,
  getAllQuizQuestions,
  updateQuizQuestion,
  updateQuizAnswers,
  addQuizParticipant,
  getUserQuestionStatus,
  setUserQuestionStatus,
  updateCorrectAnswers,
  addQuizEndtime,
  getQuizParticipantData,
  getQuestionAttemptsById,
  setQuestionAttemptsById,
  getQuizParticipantsRanking,
  clearQuizData,
  updateQuizSettings,
  createAnswer,
  updateCorrectAnswer,
  updateAnswerText,
  deleteAnswer,
  deleteQuestion,
};
