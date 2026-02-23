require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.APP_PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// In-memory document sessions
const sessions = {}; 
// structure:
// {
//   documentId: {
//     content: "",
//     version: 0,
//     clients: Map<ws, { userId, username }>
//   }
// }

// Initialize DB
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

// Health check
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

    res.status(201).json({ id, title, content, version: 0 });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get Document
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- WebSocket Logic ----------------

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      // JOIN
      if (data.type === "JOIN") {
        const { documentId, userId, username } = data;

        // Load document if not in memory
        if (!sessions[documentId]) {
          const result = await pool.query(
            "SELECT * FROM documents WHERE id = $1",
            [documentId]
          );

          if (result.rows.length === 0) {
            ws.send(JSON.stringify({ error: "Document not found" }));
            return;
          }

          sessions[documentId] = {
            content: result.rows[0].content,
            version: result.rows[0].version,
            clients: new Map(),
          };
        }

        // Add client
        sessions[documentId].clients.set(ws, { userId, username });
        ws.documentId = documentId;

        // Send INIT to joining client
        ws.send(
          JSON.stringify({
            type: "INIT",
            content: sessions[documentId].content,
            version: sessions[documentId].version,
            users: Array.from(
              sessions[documentId].clients.values()
            ),
          })
        );

        // Broadcast USER_JOINED to others
        sessions[documentId].clients.forEach((client, clientWs) => {
          if (clientWs !== ws) {
            clientWs.send(
              JSON.stringify({
                type: "USER_JOINED",
                userId,
                username,
              })
            );
          }
        });
      }
    } catch (err) {
      console.error("WebSocket error:", err);
    }
  });

  ws.on("close", () => {
    const documentId = ws.documentId;
    if (!documentId || !sessions[documentId]) return;

    const user = sessions[documentId].clients.get(ws);
    sessions[documentId].clients.delete(ws);

    if (user) {
      sessions[documentId].clients.forEach((_, clientWs) => {
        clientWs.send(
          JSON.stringify({
            type: "USER_LEFT",
            userId: user.userId,
            username: user.username,
          })
        );
      });
    }
  });
});

// Start server
initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});