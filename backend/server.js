const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());


// ================= DB CONNECTION =================
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("DB Error:", err.message);
  } else {
    console.log("Connected to SQLite DB ✅");
  }
});


// ================= CREATE TABLES =================
db.serialize(() => {

  // USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      password TEXT
    )
  `);

  // STUDY PLANS
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      hours INTEGER,
      user_id INTEGER
    )
  `);

  // TASKS
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT DEFAULT 'pending',
      plan_id INTEGER
    )
  `);
});


// ================= ROUTES =================

// TEST
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});


// ===== AUTH =====

// SIGNUP
app.post("/api/auth/signup", (req, res) => {
  const { email, password } = req.body;

  db.run(
    `INSERT INTO users (email, password) VALUES (?, ?)`,
    [email, password],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ message: "User created ✅" });
    }
  );
});


// LOGIN
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, row) => {
      if (row) {
        res.json({ message: "Login success", user_id: row.id });
      } else {
        res.status(401).json({ message: "Invalid credentials ❌" });
      }
    }
  );
});


// ===== PLANS =====

// GENERATE MOCK AI PLAN
app.post("/api/generate-plan", (req, res) => {
  const { subject, examDate, hoursPerDay, currentLevel } = req.body;

  const plan = {
    subject: subject || "Advanced Subject",
    examDate: examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    level: currentLevel || "beginner",
    totalStudyHours: parseInt(hoursPerDay || 2) * 14,
    modules: [
      {
        day: 1,
        type: "Foundation",
        topic: `Introduction to ${subject || "the topic"}`,
        description: "Understand the core concepts and fundamental rules.",
        hours: parseInt(hoursPerDay || 2),
        isCompleted: false,
        subtopics: ["History and Overview", "Key Terminology", "Basic Principles"],
        video: { title: "Crash Course on Basics", url: "https://www.youtube.com" }
      },
      {
        day: 2,
        type: "Deep Dive",
        topic: "Advanced Mechanisms",
        description: "Explore complex interactions and applying theories.",
        hours: parseInt(hoursPerDay || 2),
        isCompleted: false,
        subtopics: ["Formulas and Rules", "Case Studies"],
        video: { title: "Advanced Masterclass", url: "https://www.youtube.com" }
      },
      {
        day: 3,
        type: "Review",
        topic: "Practice and Application",
        description: "Solving practice questions and past papers.",
        hours: parseInt(hoursPerDay || 2),
        isCompleted: false,
        subtopics: ["Mock Questions", "Self-Assessment"],
        video: { title: "Exam Solving Techniques", url: "https://www.youtube.com" }
      }
    ],
    tips: [
      "Use the Pomodoro technique to stay focused.",
      "Review your notes before starting a new module.",
      "Stay hydrated and take regular breaks!"
    ],
    mockTests: [
      {
        title: "Mid-Term Mock Exam",
        recommendedDay: 7,
        description: "A complete test of the first half of the syllabus.",
        duration: "2 Hours"
      }
    ],
    advancedResources: [
      {
        title: "Official Documentation / Textbook",
        type: "Reading",
        link: "#"
      },
      {
        title: "Interactive Study Community",
        type: "Community",
        link: "#"
      }
    ]
  };

  res.json({ plan });
});


// CREATE PLAN
app.post("/api/plans", (req, res) => {
  const { subject, hours, user_id } = req.body;

  db.run(
    `INSERT INTO plans (subject, hours, user_id) VALUES (?, ?, ?)`,
    [subject, hours, user_id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ message: "Plan created ✅" });
    }
  );
});


// GET PLANS
app.get("/api/plans", (req, res) => {
  db.all(`SELECT * FROM plans`, [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});


// ===== TASKS =====

// CREATE TASK
app.post("/api/tasks", (req, res) => {
  const { title, plan_id } = req.body;

  db.run(
    `INSERT INTO tasks (title, plan_id) VALUES (?, ?)`,
    [title, plan_id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ message: "Task created ✅" });
    }
  );
});


// GET TASKS
app.get("/api/tasks", (req, res) => {
  db.all(`SELECT * FROM tasks`, [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});


// UPDATE TASK (COMPLETE)
app.put("/api/tasks/:id", (req, res) => {
  const { status } = req.body;

  db.run(
    `UPDATE tasks SET status = ? WHERE id = ?`,
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ message: "Task updated ✅" });
    }
  );
});


// ===== PROGRESS =====

// GET PROGRESS
app.get("/api/progress", (req, res) => {
  db.all(`SELECT status FROM tasks`, [], (err, rows) => {
    if (err) return res.status(500).json(err);

    const total = rows.length;
    const completed = rows.filter(t => t.status === "completed").length;

    res.json({
      total,
      completed,
      percentage: total ? ((completed / total) * 100).toFixed(2) : 0
    });
  });
});


// ================= SERVER =================
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000 🚀");
});