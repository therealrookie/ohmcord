const pgpool = require("./db");

async function addBrainstorm(theme, hash, endBrainstormAt) {
  try {
    const brainstorm = await pgpool.query("INSERT INTO brainstorm (theme, url, end_time_ms) VALUES($1, $2, $3) RETURNING *", [
      theme,
      hash,
      endBrainstormAt,
    ]);
    return brainstorm.rows[0].brainstorm_id;
  } catch (err) {
    return err.message;
  }
}

async function addBrainstormMessage(brainstormId, messageId) {
  try {
    const response = await pgpool.query("INSERT INTO brainstorm_messages (brainstorm_id, message_id) VALUES($1, $2)", [brainstormId, messageId]);
    return response.ok;
  } catch (err) {
    return err.message;
  }
}

async function getBrainstormMessages(brainstormId) {
  try {
    const response = await pgpool.query("SELECT * FROM brainstorm_messages WHERE brainstorm_id = $1 ORDER BY brainstorm_message_id", [brainstormId]);
    return response.rows;
  } catch (err) {
    return err.message;
  }
}

async function addBrainstormContribution(brainstormId, contribution) {
  try {
    const newContribution = await pgpool.query(
      "INSERT INTO brainstorm_contributions (brainstorm_id, contribution, score) VALUES($1, $2, $3) RETURNING *",
      [brainstormId, contribution, 0]
    );
    return newContribution.rows[0].contribution_id;
  } catch (err) {
    return err.message;
  }
}

async function getBrainstorm(hash) {
  try {
    const brainstorm = await pgpool.query("SELECT * FROM brainstorm WHERE url = $1", [hash]);
    return brainstorm.rows[0];
  } catch (err) {
    throw new Error("Failed to fetch brainstorm data");
  }
}

async function getBrainstormContributions(id) {
  try {
    const contributions = await pgpool.query("SELECT contribution FROM brainstorm_contributions WHERE brainstorm_id = $1", [id]);
    return contributions.rows;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch brainstorm data");
  }
}

async function updateBrainstormContributionScoring(contributionId, userId) {
  try {
    const result = await pgpool.query(
      `INSERT INTO brainstorm_contribution_scoring (contribution_id, discord_user_id, clicks)
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

async function updateContributionScore(contributionId, score) {
  try {
    await pgpool.query("UPDATE brainstorm_contributions SET score = $2 WHERE contribution_id = $1", [contributionId, score]);
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
};
