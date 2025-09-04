import express from "express";
import db, { initializeSchema } from "./utils/db.mjs";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

// Helpers
function parseId(param) {
  const parsed = Number.parseInt(param, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Questions
app.post("/questions", async (req, res) => {
  try {
    const { title, description, category } = req.body || {};
    if (!isNonEmptyString(title) || !isNonEmptyString(description) || !isNonEmptyString(category)) {
      return res.status(400).json({ message: "Invalid request data." });
    }

    await db.query(
      "INSERT INTO questions (title, description, category) VALUES ($1, $2, $3)",
      [title.trim(), description.trim(), category.trim()]
    );
    return res.status(201).json({ message: "Question created successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create question." });
  }
});

// Search must be above dynamic :questionId route
app.get("/questions/search", async (req, res) => {
  try {
    const { title, category } = req.query;
    const hasTitle = isNonEmptyString(title);
    const hasCategory = isNonEmptyString(category);
    if (!hasTitle && !hasCategory) {
      return res.status(400).json({ message: "Invalid search parameters." });
    }

    let sql = "SELECT id, title, description, category FROM questions WHERE 1=1";
    const params = [];
    if (hasTitle) {
      params.push(`%${title.trim()}%`);
      sql += ` AND title ILIKE $${params.length}`;
    }
    if (hasCategory) {
      params.push(`%${category.trim()}%`);
      sql += ` AND category ILIKE $${params.length}`;
    }
    sql += " ORDER BY id ASC";

    const { rows } = await db.query(sql, params);
    return res.json({ data: rows });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch a question." });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, title, description, category FROM questions ORDER BY id ASC"
    );
    return res.json({ data: rows });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

app.get("/questions/:questionId", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }
    const { rows } = await db.query(
      "SELECT id, title, description, category FROM questions WHERE id = $1",
      [questionId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.json({ data: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

app.put("/questions/:questionId", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }

    const { title, description, category } = req.body || {};
    const updates = [];
    const params = [];
    if (isNonEmptyString(title)) {
      params.push(title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (isNonEmptyString(description)) {
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (isNonEmptyString(category)) {
      params.push(category.trim());
      updates.push(`category = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Invalid request data." });
    }
    params.push(questionId);
    const sql = `UPDATE questions SET ${updates.join(", ")} WHERE id = $${params.length}`;
    const result = await db.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.json({ message: "Question updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

app.delete("/questions/:questionId", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }
    const result = await db.query("DELETE FROM questions WHERE id = $1", [questionId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.json({ message: "Question post has been deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete question." });
  }
});

// Answers
app.post("/questions/:questionId/answers", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }
    const { content } = req.body || {};
    if (!isNonEmptyString(content) || content.trim().length > 300) {
      return res.status(400).json({ message: "Invalid request data." });
    }

    const { rows: questionRows } = await db.query("SELECT id FROM questions WHERE id = $1", [questionId]);
    if (questionRows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }

    await db.query(
      "INSERT INTO answers (question_id, content) VALUES ($1, $2)",
      [questionId, content.trim()]
    );
    return res.status(201).json({ message: "Answer created successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create answers." });
  }
});

app.get("/questions/:questionId/answers", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }

    const { rows: questionRows } = await db.query("SELECT id FROM questions WHERE id = $1", [questionId]);
    if (questionRows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }

    const { rows } = await db.query(
      "SELECT id, content FROM answers WHERE question_id = $1 ORDER BY id ASC",
      [questionId]
    );
    return res.json({ data: rows });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch answers." });
  }
});

app.delete("/questions/:questionId/answers", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }
    const { rows: questionRows } = await db.query("SELECT id FROM questions WHERE id = $1", [questionId]);
    if (questionRows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    await db.query("DELETE FROM answers WHERE question_id = $1", [questionId]);
    return res.json({ message: "All answers for the question have been deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete answers." });
  }
});

// Voting
app.post("/questions/:questionId/vote", async (req, res) => {
  try {
    const questionId = parseId(req.params.questionId);
    if (!questionId) {
      return res.status(404).json({ message: "Question not found." });
    }
    const { vote } = req.body || {};
    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ message: "Invalid vote value."});
    }
    const { rows: questionRows } = await db.query("SELECT id FROM questions WHERE id = $1", [questionId]);
    if (questionRows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }
    await db.query(
      "INSERT INTO question_votes (question_id, vote) VALUES ($1, $2)",
      [questionId, vote]
    );
    return res.json({ message: "Vote on the question has been recorded successfully." });
  } catch (error) {
    console.log("error=", error);
    return res.status(500).json({ message: "Unable to vote question." });
  }
});

app.post("/answers/:answerId/vote", async (req, res) => {
  try {
    const answerId = parseId(req.params.answerId);
    if (!answerId) {
      return res.status(404).json({ message: "Answer not found." });
    }
    const { vote } = req.body || {};
    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ message: "Invalid vote value." });
    }
    const { rows: answerRows } = await db.query("SELECT id FROM answers WHERE id = $1", [answerId]);
    if (answerRows.length === 0) {
      return res.status(404).json({ message: "Answer not found." });
    }
    await db.query(
      "INSERT INTO answer_votes (answer_id, vote) VALUES ($1, $2)",
      [answerId, vote]
    );
    return res.json({ message: "Vote on the answer has been recorded successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to vote answer." });
  }
});

async function start() {
  try {
    await initializeSchema();
    app.listen(port, () => {
      console.log(`Server is running at ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database schema", error);
    process.exit(1);
  }
}

start();
