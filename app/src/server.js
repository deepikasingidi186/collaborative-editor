require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.APP_PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Create documents table if not exists
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 0
    );
  `);
  console.log("Database initialized");
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ---------------- REST API ----------------

// Create Document
app.post("/api/documents", async (req, res) => {
  try {
    const { title, content } = req.body;
    const id = uuidv4();

    await pool.query(
      "INSERT INTO documents (id, title, content, version) VALUES ($1, $2, $3, $4)",
      [id, title, content, 0]
    );

    res.status(201).json({
      id,
      title,
      content,
      version: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// List Documents
app.get("/api/documents", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, title FROM documents");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Document by ID
app.get("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM documents WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Document
app.delete("/api/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM documents WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});