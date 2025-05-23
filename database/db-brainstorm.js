const pgpool = require("./db");

// Adds a new Brainstorm-Session to the database
async function addBrainstorm(theme, hash, endBrainstormAt) {
  try {
    const brainstorm = await pgpool.query("INSERT INTO public.brainstorm (theme, url, end_time_ms) VALUES($1, $2, $3) RETURNING *", [
      theme,
      hash,
      endBrainstormAt,
    ]);
    return brainstorm.rows[0].brainstorm_id;
  } catch (err) {
    return err.message;
  }
}

// Adds the ID of the Discord message, that contains all the contributions/buttons
async function addBrainstormMessage(brainstormId, messageId) {
  try {
    const response = await pgpool.query("INSERT INTO public.brainstorm_messages (brainstorm_id, message_id) VALUES($1, $2)", [
      brainstormId,
      messageId,
    ]);
    return response.ok;
  } catch (err) {
    return err.message;
  }
}

// Returns all the data of each Discord message, that contain the contributions/buttons
async function getBrainstormMessages(brainstormId) {
  try {
    const response = await pgpool.query("SELECT * FROM public.brainstorm_messages WHERE brainstorm_id = $1 ORDER BY brainstorm_message_id", [
      brainstormId,
    ]);
    return response.rows;
  } catch (err) {
    return err.message;
  }
}

// Adds a contribution with the score 0
async function addBrainstormContribution(brainstormId, contribution) {
  try {
    const newContribution = await pgpool.query(
      "INSERT INTO public.brainstorm_contributions (brainstorm_id, contribution, score) VALUES($1, $2, $3) RETURNING *",
      [brainstormId, contribution, 0]
    );
    return newContribution.rows[0].contribution_id;
  } catch (err) {
    return err.message;
  }
}

// Returns the brainstorm-session-data by its 6 digit Hash Route
async function getBrainstorm(hash) {
  try {
    const brainstorm = await pgpool.query("SELECT * FROM public.brainstorm WHERE url = $1", [hash]);
    return brainstorm.rows[0];
  } catch (err) {
    throw new Error("Failed to fetch brainstorm data");
  }
}

// Returns Brainstorm-contribution-data by its ID [{id, content, score, xpos, ypos}, {...}]
async function getBrainstormContributions(id) {
  try {
    const query = `
      SELECT 
        cont.contribution_id AS id, 
        cont.contribution AS content, 
        cont.score, 
        pos.x_pos AS xpos, 
        pos.y_pos AS ypos
      FROM public.brainstorm_contributions cont
      LEFT JOIN public.brainstorm_contribution_positions pos 
      ON cont.contribution_id = pos.contribution_id
      WHERE cont.brainstorm_id = $1
    `;

    const result = await pgpool.query(query, [id]);
    return result.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch brainstorm contributions");
  }
}

// Returns all contribution-positions of an array of contribution-ids
async function getContributionPositions(contIds) {
  try {
    const positions = await pgpool.query("SELECT * FROM public.brainstorm_contribution_positions WHERE contribution_id = any($1)", [contIds]);
    return positions.rows;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch position data");
  }
}

// Inserts or updates the position on the canvas of a contribution
async function setPosition(contId, xPos, yPos) {
  try {
    const query = `
      INSERT INTO public.brainstorm_contribution_positions (contribution_id, x_pos, y_pos) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (contribution_id) 
      DO UPDATE SET x_pos = $2, y_pos = $3
      RETURNING *;
    `;

    const result = await pgpool.query(query, [contId, xPos, yPos]);
    return result.rows[0]; // Return the updated or inserted row
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update position data");
  }
}

// Updates the number of clicks on a contribution. Return the in-/decrease amount of the score
async function updateBrainstormContributionScoring(contributionId, userId) {
  try {
    const result = await pgpool.query(
      `INSERT INTO public.brainstorm_contribution_scoring (contribution_id, discord_user_id, clicks)
       VALUES ($1, $2, 1)
       ON CONFLICT (contribution_id, discord_user_id) 
       DO UPDATE SET clicks = (
        CASE 
          WHEN brainstorm_contribution_scoring.clicks = 4 THEN 1
          ELSE brainstorm_contribution_scoring.clicks + 1
        END
       )
       RETURNING clicks;`,
      [contributionId, userId]
    );

    const clicks = result.rows[0]?.clicks;
    if (clicks === 1) return 1;
    else if (clicks === 2) return -1;
    else if (clicks === 3) return -1;
    else if (clicks === 4) return 1;
    else return 0;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update contribution score");
  }
}

// Updates the actual score of the contribution
async function updateContributionScore(contributionId, score) {
  try {
    await pgpool.query("UPDATE public.brainstorm_contributions SET score = $2 WHERE contribution_id = $1", [contributionId, score]);
  } catch (err) {
    return err.message;
  }
}

module.exports = {
  addBrainstorm,
  addBrainstormContribution,
  getBrainstorm,
  getBrainstormContributions,
  addBrainstormMessage,
  getBrainstormMessages,
  updateBrainstormContributionScoring,
  updateContributionScore,
  getContributionPositions,
  setPosition,
};
