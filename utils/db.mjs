// Create PostgreSQL Connection Pool here !
import * as pg from "pg";
const { Pool } = pg.default;

const connectionPool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "123456",
  database: "backtend",
  ssl: false,
});

connectionPool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
});

export async function initializeSchema() {
  await connectionPool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await connectionPool.query(`
    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      content TEXT NOT NULL CHECK (char_length(content) <= 300),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Voting tables
  await connectionPool.query(`
    CREATE TABLE IF NOT EXISTS question_votes (
      id SERIAL PRIMARY KEY,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      vote INTEGER CHECK (vote = 1 OR vote = -1)
    )
  `);

  await connectionPool.query(`
    CREATE TABLE IF NOT EXISTS answer_votes (
      id SERIAL PRIMARY KEY,
      answer_id INTEGER REFERENCES answers(id) ON DELETE CASCADE,
      vote INTEGER CHECK (vote = 1 OR vote = -1)
    )
  `);
}

export async function closePool() {
  await connectionPool.end();
}

export default connectionPool;
