import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("passages.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS passages (
    id TEXT PRIMARY KEY,
    studentName TEXT,
    mode TEXT,
    title TEXT,
    page TEXT,
    date TEXT,
    targetTime TEXT,
    actualTime TEXT,
    flowSummary TEXT,
    paragraphs TEXT,
    questions TEXT,
    concepts TEXT,
    words TEXT,
    feedback TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Default settings (only insert if not exists)
const defaultSettings = JSON.stringify({
  weekStart: new Date().toISOString().split('T')[0],
  targetAmount: 10,
  teacherMessage: "이번 주도 깨달음에서 감동까지!",
  teacherPin: "0000"
});
db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('goals', ?)").run(defaultSettings);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ─── Passages ────────────────────────────────────────────

  app.post("/api/passages", (req, res) => {
    const {
      id, studentName, mode, title, page, date, targetTime,
      actualTime, flowSummary, paragraphs, questions, concepts,
      words, feedback
    } = req.body;

    try {
      db.prepare(`
        INSERT OR REPLACE INTO passages (
          id, studentName, mode, title, page, date, targetTime,
          actualTime, flowSummary, paragraphs, questions, concepts,
          words, feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, studentName, mode, title, page, date, targetTime,
        actualTime, flowSummary, JSON.stringify(paragraphs),
        JSON.stringify(questions), JSON.stringify(concepts),
        JSON.stringify(words), feedback
      );
      res.json({ success: true, id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save passage" });
    }
  });

  app.get("/api/passages", (req, res) => {
    try {
      const { student } = req.query;
      let query = "SELECT * FROM passages";
      const params: any[] = [];
      if (student) {
        query += " WHERE studentName LIKE ?";
        params.push(`%${student}%`);
      }
      query += " ORDER BY date DESC, createdAt DESC";
      const passages = db.prepare(query).all(...params);
      res.json(passages.map((p: any) => ({
        ...p,
        paragraphs: JSON.parse(p.paragraphs),
        questions: JSON.parse(p.questions),
        concepts: JSON.parse(p.concepts),
        words: JSON.parse(p.words)
      })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch passages" });
    }
  });

  app.get("/api/passages/:id", (req, res) => {
    try {
      const passage = db.prepare("SELECT * FROM passages WHERE id = ?").get(req.params.id);
      if (!passage) return res.status(404).json({ error: "Passage not found" });
      res.json({
        ...(passage as any),
        paragraphs: JSON.parse((passage as any).paragraphs),
        questions: JSON.parse((passage as any).questions),
        concepts: JSON.parse((passage as any).concepts),
        words: JSON.parse((passage as any).words)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch passage" });
    }
  });

  app.delete("/api/passages/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM passages WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete passage" });
    }
  });

  // ─── Settings ────────────────────────────────────────────

  app.get("/api/settings", (req, res) => {
    try {
      const row = db.prepare("SELECT value FROM app_settings WHERE key = 'goals'").get() as any;
      res.json(row ? JSON.parse(row.value) : {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('goals', ?)").run(JSON.stringify(req.body));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // ─── Vite / Static ───────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
