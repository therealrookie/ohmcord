const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "Frame2%Go",
  host: "localhost",
  port: 5432,
  database: "discord_bot",
});

module.exports = pool;
