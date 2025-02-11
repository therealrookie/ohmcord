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

module.exports = {
  addBrainstorm,
  addBrainstormContribution,
  getBrainstorm,
  getBrainstormContributions,
};
