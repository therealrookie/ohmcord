const Pool = require("pg").Pool;

// Connection for local connection
const localpool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DATABASE,
});

// Connection for render.com connection
const pgpool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for cloud-hosted databases
  },
});

module.exports = pgpool;
