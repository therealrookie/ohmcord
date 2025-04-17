const { createHashRoute } = require("../bot/utils/utils-functions");
const pgpool = require("./db");

// Returns Poll Data by its Hash Route / 6 digit code
async function getPollByHashRoute(hashRoute) {
  try {
    const quiz = await pgpool.query("SELECT * FROM public.polls WHERE hash_route = $1", [hashRoute]);

    return quiz.rows[0];
  } catch (error) {
    console.log("Error at function getPollByHashRoute(): ", error);
    throw new Error("Failed to fetch poll data");
  }
}

// Returns all the answers of a poll by its ID
async function getPollAnswers(pollId) {
  try {
    const quiz = await pgpool.query("SELECT * FROM public.poll_answers WHERE poll_id = $1", [pollId]);

    return quiz.rows;
  } catch (error) {
    console.log("Error at function getPollAnswers(): ", error);
    throw new Error("Failed to fetch poll data");
  }
}

// Inserts poll and answer data into their tables
async function addPoll(questionObj, answers) {
  const client = await pgpool.connect();

  const hashRoute = createHashRoute(JSON.stringify(questionObj) + Date.now());
  const { question, multipleAnswers, duration } = questionObj;

  try {
    await client.query("BEGIN");

    const newQuestion = await client.query(
      "INSERT INTO public.polls (hash_route, question, multiple_answers, duration) VALUES ($1, $2, $3, $4) RETURNING poll_id",
      [hashRoute, question, multipleAnswers, duration]
    );

    const pollId = newQuestion.rows[0].poll_id;

    const insertValues = answers.map((answer, index) => `(${pollId}, $${index * 2 + 1}, $${index * 2 + 2})`).join(", ");
    const insertParams = answers.flatMap((answer) => [answer.emoji, answer.answer]);

    if (answers.length > 0) {
      await client.query(`INSERT INTO public.poll_answers (poll_id, emoji, answer) VALUES ${insertValues}`, insertParams);
    }

    await client.query("COMMIT");
    return hashRoute;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error at function addPoll():", error);
    throw new Error("Failed to update quiz answers");
  } finally {
    client.release();
  }
}

module.exports = { getPollByHashRoute, getPollAnswers, addPoll };
