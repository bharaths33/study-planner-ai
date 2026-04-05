const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "instance", "database.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB Error:", err.message);
  } else {
    console.log(`Connected to SQLite DB at ${dbPath}`);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      hours INTEGER,
      user_id INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT DEFAULT 'pending',
      plan_id INTEGER
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      logged_in_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS study_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER,
      day INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn("users", "last_login", "TEXT");
  await ensureColumn("users", "login_count", "INTEGER DEFAULT 0");
  await ensureColumn("plans", "content", "TEXT");
  await ensureColumn("plans", "exam_date", "TEXT");
  await ensureColumn("plans", "level", "TEXT");
  await ensureColumn("plans", "created_at", "TEXT DEFAULT CURRENT_TIMESTAMP");

  await ensureColumn("tasks", "day", "INTEGER");
  await ensureColumn("tasks", "details", "TEXT");
  await ensureColumn("tasks", "hours", "INTEGER");
}

function mergePlanWithTasks(planRow, tasks) {
  const parsedPlan = JSON.parse(planRow.content);
  const taskByDay = new Map(tasks.map((task) => [task.day, task]));

  parsedPlan.modules = parsedPlan.modules.map((module) => {
    const task = taskByDay.get(module.day);
    if (!task) {
      return module;
    }

    return {
      ...module,
      topic: task.title ?? module.topic,
      description: task.details ?? module.description,
      hours: task.hours ?? module.hours,
      isCompleted: task.status === "completed"
    };
  });

  return parsedPlan;
}

async function replaceStudyPlan(userId, plan) {
  const existingPlans = await all(`SELECT id FROM plans WHERE user_id = ?`, [userId]);

  for (const existingPlan of existingPlans) {
    await run(`DELETE FROM tasks WHERE plan_id = ?`, [existingPlan.id]);
  }
  await run(`DELETE FROM plans WHERE user_id = ?`, [userId]);

  const result = await run(
    `INSERT INTO plans (subject, hours, user_id, content, exam_date, level) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      plan.subject,
      Number.parseInt(plan.totalStudyHours, 10) || 0,
      userId,
      JSON.stringify(plan),
      plan.examDate ?? null,
      plan.level ?? null
    ]
  );

  const planId = result.lastID;
  const modules = Array.isArray(plan.modules) ? plan.modules : [];

  for (const module of modules) {
    await run(
      `INSERT INTO tasks (title, status, plan_id, day, details, hours) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        module.topic,
        module.isCompleted ? "completed" : "pending",
        planId,
        module.day,
        module.description ?? "",
        Number.parseInt(module.hours, 10) || 0
      ]
    );
  }

  return planId;
}

app.get("/", (req, res) => {
  res.send("Server running");
});

app.post("/api/auth/signup", async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  try {
    const existingUser = await get(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existingUser) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const result = await run(
      `INSERT INTO users (email, password) VALUES (?, ?)`,
      [email, password]
    );

    res.status(201).json({
      message: "User created successfully.",
      user_id: result.lastID,
      email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to create user." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  try {
    const row = await get(
      `SELECT id, email, COALESCE(login_count, 0) AS login_count FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (!row) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    const loggedInAt = new Date().toISOString();

    await run(
      `UPDATE users SET last_login = ?, login_count = ? WHERE id = ?`,
      [loggedInAt, row.login_count + 1, row.id]
    );

    await run(
      `INSERT INTO login_history (user_id, email, logged_in_at) VALUES (?, ?, ?)`,
      [row.id, row.email, loggedInAt]
    );

    res.json({
      message: "Login success",
      user_id: row.id,
      email: row.email,
      last_login: loggedInAt,
      login_count: row.login_count + 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to log in." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const newPassword = req.body?.newPassword ?? "";

  if (!email) {
    res.status(400).json({ message: "Enter your email first." });
    return;
  }

  try {
    const user = await get(`SELECT id FROM users WHERE email = ?`, [email]);

    if (!user) {
      res.json({
        message: "No account matched that email. Check the email spelling or create an account first."
      });
      return;
    }

    if (!newPassword) {
      res.json({
        message: "Account found. Enter a new password to reset it."
      });
      return;
    }

    if (newPassword.length < 4) {
      res.status(400).json({ message: "New password must be at least 4 characters." });
      return;
    }

    await run(`UPDATE users SET password = ? WHERE email = ?`, [newPassword, email]);

    res.json({
      message: "Password updated successfully. Please log in with your new password."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to process forgot password right now." });
  }
});

app.post("/api/generate-plan", (req, res) => {
  const { subject, examDate, hoursPerDay, currentLevel } = req.body;
  const hours = Number.parseInt(hoursPerDay, 10) || 2;
  const level = (currentLevel || "beginner").toLowerCase();
  const subjectName = subject || "General Studies";

  function ytSearch(query) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  const beginnerModules = [
    {
      day: 1, type: "Foundation", topic: `Introduction to ${subjectName}`,
      description: "Build a strong foundation by understanding core concepts, key terminology, and the scope of the subject.",
      hours, isCompleted: false,
      subtopics: ["History & Background", "Key Terminology & Definitions", "Scope & Importance", "Basic Principles"],
      video: { title: `${subjectName} - Complete Beginner Guide`, url: ytSearch(`${subjectName} introduction beginner tutorial`) }
    },
    {
      day: 2, type: "Core Concepts", topic: `Core Concepts of ${subjectName}`,
      description: "Dive into the fundamental theories and rules that form the backbone of this subject.",
      hours, isCompleted: false,
      subtopics: ["Fundamental Theories", "Core Formulas & Rules", "Common Patterns", "Real-World Examples"],
      video: { title: `${subjectName} Core Concepts Explained`, url: ytSearch(`${subjectName} core concepts explained`) }
    },
    {
      day: 3, type: "Deep Dive", topic: "Detailed Analysis & Case Studies",
      description: "Study detailed examples and case studies to deepen your understanding of complex topics.",
      hours, isCompleted: false,
      subtopics: ["Detailed Walkthroughs", "Case Study Analysis", "Connecting Concepts", "Common Mistakes to Avoid"],
      video: { title: `${subjectName} - Detailed Analysis`, url: ytSearch(`${subjectName} case studies analysis`) }
    },
    {
      day: 4, type: "Practice", topic: "Practice Problems & Self-Assessment",
      description: "Solve practice problems to test your understanding and identify weak areas.",
      hours, isCompleted: false,
      subtopics: ["Easy Problems", "Medium Problems", "Timed Practice Set", "Error Analysis & Correction"],
      video: { title: `${subjectName} Practice Questions`, url: ytSearch(`${subjectName} practice questions with solutions`) }
    },
    {
      day: 5, type: "Review", topic: "Revision & Mock Test Preparation",
      description: "Review all topics, create summary notes, and take a self-assessment mock test.",
      hours, isCompleted: false,
      subtopics: ["Quick Revision Notes", "Formula Sheet / Cheat Sheet", "Mock Test Attempt", "Self-Evaluation & Next Steps"],
      video: { title: `${subjectName} Quick Revision`, url: ytSearch(`${subjectName} quick revision exam preparation`) }
    }
  ];

  const intermediateModules = [
    {
      day: 1, type: "Quick Review", topic: `${subjectName} — Refresher`,
      description: "Quickly review fundamentals and identify areas that need reinforcement.",
      hours, isCompleted: false,
      subtopics: ["Fundamentals Recap", "Key Formula Review", "Identify Knowledge Gaps", "Set Learning Goals"],
      video: { title: `${subjectName} Quick Refresher`, url: ytSearch(`${subjectName} intermediate refresher`) }
    },
    {
      day: 2, type: "Deep Dive", topic: "Advanced Theories & Mechanisms",
      description: "Explore advanced theoretical frameworks and complex mechanisms in depth.",
      hours, isCompleted: false,
      subtopics: ["Advanced Theories", "Complex Mechanisms", "Mathematical Proofs / Derivations", "Edge Cases"],
      video: { title: `${subjectName} Advanced Theory`, url: ytSearch(`${subjectName} advanced theory explained`) }
    },
    {
      day: 3, type: "Deep Dive", topic: "Applications & Problem Solving",
      description: "Apply concepts to real-world scenarios and solve multi-step problems.",
      hours, isCompleted: false,
      subtopics: ["Real-World Applications", "Multi-Step Problems", "Cross-Topic Connections", "Industry Use Cases"],
      video: { title: `${subjectName} Applications`, url: ytSearch(`${subjectName} real world applications problems`) }
    },
    {
      day: 4, type: "Deep Dive", topic: "Comparative Analysis & Critical Thinking",
      description: "Compare different approaches, evaluate trade-offs, and develop critical analysis skills.",
      hours, isCompleted: false,
      subtopics: ["Comparative Frameworks", "Trade-off Analysis", "Critical Evaluation Methods", "Decision Making"],
      video: { title: `${subjectName} Critical Analysis`, url: ytSearch(`${subjectName} critical thinking analysis`) }
    },
    {
      day: 5, type: "Practice", topic: "Intensive Problem Solving Session",
      description: "Tackle challenging problems under timed conditions to build exam confidence.",
      hours, isCompleted: false,
      subtopics: ["Medium Difficulty Problems", "Hard Problems", "Time-Based Challenges", "Strategy for Tricky Questions"],
      video: { title: `${subjectName} Hard Problems`, url: ytSearch(`${subjectName} difficult problems solved`) }
    },
    {
      day: 6, type: "Practice", topic: "Past Papers & Pattern Recognition",
      description: "Analyze previous exam papers to understand question patterns and marking schemes.",
      hours, isCompleted: false,
      subtopics: ["Past Paper Analysis", "Question Pattern Recognition", "Marking Scheme Understanding", "High-Scoring Answer Techniques"],
      video: { title: `${subjectName} Past Papers`, url: ytSearch(`${subjectName} past papers solved exam`) }
    },
    {
      day: 7, type: "Review", topic: "Full Mock Test & Final Revision",
      description: "Complete a full-length mock test and do a final targeted revision of weak areas.",
      hours, isCompleted: false,
      subtopics: ["Full Mock Test (Timed)", "Performance Analysis", "Weak Areas Revision", "Exam Day Strategy"],
      video: { title: `${subjectName} Mock Test Tips`, url: ytSearch(`${subjectName} mock test exam tips`) }
    }
  ];

  const advancedModules = [
    {
      day: 1, type: "Assessment", topic: `${subjectName} — Diagnostic Assessment`,
      description: "Take a diagnostic test to pinpoint exact areas needing mastery-level improvement.",
      hours, isCompleted: false,
      subtopics: ["Diagnostic Pre-Test", "Skill Gap Analysis", "Priority Matrix", "Custom Study Roadmap"],
      video: { title: `${subjectName} Mastery Plan`, url: ytSearch(`${subjectName} advanced mastery study plan`) }
    },
    {
      day: 2, type: "Deep Dive", topic: "Expert-Level Theory & Proofs",
      description: "Master the most complex theoretical aspects including proofs, derivations, and edge cases.",
      hours, isCompleted: false,
      subtopics: ["Complex Proofs / Derivations", "Edge Cases & Exceptions", "Historical Context & Evolution", "Research-Level Insights"],
      video: { title: `${subjectName} Expert Theory`, url: ytSearch(`${subjectName} expert level advanced theory`) }
    },
    {
      day: 3, type: "Deep Dive", topic: "Cross-Disciplinary Connections",
      description: "Explore how this subject connects with related disciplines for holistic understanding.",
      hours, isCompleted: false,
      subtopics: ["Interdisciplinary Links", "Unified Frameworks", "Transfer of Concepts", "Modern Research Trends"],
      video: { title: `${subjectName} Interdisciplinary`, url: ytSearch(`${subjectName} interdisciplinary connections`) }
    },
    {
      day: 4, type: "Application", topic: "Advanced Problem-Solving Strategies",
      description: "Learn and apply advanced methodologies for solving the hardest problems in this domain.",
      hours, isCompleted: false,
      subtopics: ["Advanced Strategies", "Olympiad / Competition-Level Problems", "Optimization Techniques", "Creative Problem Approaches"],
      video: { title: `${subjectName} Advanced Solving`, url: ytSearch(`${subjectName} advanced problem solving strategies`) }
    },
    {
      day: 5, type: "Practice", topic: "Timed Challenge — Set A",
      description: "Complete a challenging timed problem set focused on speed and accuracy.",
      hours, isCompleted: false,
      subtopics: ["Speed Drills", "Accuracy Challenges", "Time Management Tactics", "Quick Estimation Methods"],
      video: { title: `${subjectName} Speed Practice`, url: ytSearch(`${subjectName} timed practice speed accuracy`) }
    },
    {
      day: 6, type: "Deep Dive", topic: "Nuances, Exceptions & Special Topics",
      description: "Study the nuances, exceptions, and special topics that separate good from excellent.",
      hours, isCompleted: false,
      subtopics: ["Rare Exceptions", "Counterintuitive Results", "Special Cases", "Expert-Level Nuances"],
      video: { title: `${subjectName} Special Topics`, url: ytSearch(`${subjectName} special topics exceptions nuances`) }
    },
    {
      day: 7, type: "Practice", topic: "Timed Challenge — Set B",
      description: "Another challenging timed set with emphasis on the hardest question types.",
      hours, isCompleted: false,
      subtopics: ["Hardest Question Types", "Multi-Concept Problems", "Trap Question Identification", "Answer Verification Methods"],
      video: { title: `${subjectName} Hard Questions`, url: ytSearch(`${subjectName} hardest questions solved`) }
    },
    {
      day: 8, type: "Application", topic: "Research & Case Study Deep-Dive",
      description: "Analyze published papers, research findings, or advanced case studies in Depth.",
      hours, isCompleted: false,
      subtopics: ["Published Research Summary", "Case Study Deep Dive", "Data Interpretation", "Writing Research Responses"],
      video: { title: `${subjectName} Research`, url: ytSearch(`${subjectName} research papers case studies`) }
    },
    {
      day: 9, type: "Practice", topic: "Full Mock Exam Under Exam Conditions",
      description: "Simulate actual exam conditions — full duration, no breaks, strict timing.",
      hours, isCompleted: false,
      subtopics: ["Full-Length Exam Simulation", "Strict Timing", "Answer Sheet Practice", "Post-Exam Self-Grading"],
      video: { title: `${subjectName} Full Mock`, url: ytSearch(`${subjectName} full mock exam simulation`) }
    },
    {
      day: 10, type: "Review", topic: "Final Mastery Review & Exam Strategy",
      description: "Final strategic revision focusing only on weak areas, plus exam-day preparation tips.",
      hours, isCompleted: false,
      subtopics: ["Weak Area Laser Focus", "Final Formula Sheet", "Exam-Day Strategy & Mindset", "Confidence Building"],
      video: { title: `${subjectName} Final Review`, url: ytSearch(`${subjectName} final revision exam strategy`) }
    }
  ];

  const levelModules = { beginner: beginnerModules, intermediate: intermediateModules, advanced: advancedModules };
  const modules = levelModules[level] || beginnerModules;

  const levelTips = {
    beginner: [
      "Use the Pomodoro technique — study 25 minutes, then take a 5-minute break.",
      "Write down key terms and definitions in your own words after each session.",
      "Don't skip the basics — a strong foundation makes advanced topics much easier.",
      "Review your notes within 24 hours to move information into long-term memory.",
      "Stay hydrated and take regular breaks to maintain concentration.",
      "Teach what you've learned to someone else — it's the best way to solidify understanding."
    ],
    intermediate: [
      "Focus on understanding 'why' rather than memorizing 'what' — this deepens mastery.",
      "Create mind maps connecting different topics to see the bigger picture.",
      "Practice solving problems without looking at solutions first, then compare approaches.",
      "Time yourself during practice sessions to build exam-day speed.",
      "Identify your top 3 weak areas each week and give them extra focus.",
      "Join study groups or forums to discuss complex topics and learn from peers."
    ],
    advanced: [
      "Focus on edge cases and exceptions — that's where exam-makers find tricky questions.",
      "Practice explaining complex topics simply — this reveals gaps in understanding.",
      "Do timed full-length mock tests weekly to build endurance and pacing skills.",
      "Analyze your mistakes from practice tests — categorize and systematically eliminate them.",
      "Read beyond the syllabus to gain perspectives that give you an edge in answers.",
      "Sleep well before exams — sleep is crucial for memory consolidation and clear thinking."
    ]
  };

  const dayCount = modules.length;

  const mockTests = [
    {
      title: "Mid-Study Assessment",
      recommendedDay: Math.ceil(dayCount / 2),
      description: `A focused test covering the first ${Math.ceil(dayCount / 2)} days of ${subjectName} study material.`,
      duration: `${Math.max(1, Math.floor(hours * 0.75))} Hours`
    },
    {
      title: "Final Mock Exam",
      recommendedDay: dayCount,
      description: `A comprehensive test covering all ${subjectName} topics studied across the entire plan.`,
      duration: `${Math.max(1, hours)} Hours`
    }
  ];

  if (level === "advanced") {
    mockTests.push({
      title: "Timed Challenge Exam",
      recommendedDay: Math.ceil(dayCount * 0.7),
      description: "A time-pressured exam to test speed and accuracy under real conditions.",
      duration: `${Math.max(1, Math.ceil(hours * 0.5))} Hours`
    });
  }

  const advancedResources = [
    {
      title: `${subjectName} — Wikipedia Overview`,
      type: "Reading",
      link: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(subjectName)}`
    },
    {
      title: `${subjectName} on Khan Academy`,
      type: "Video Course",
      link: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(subjectName)}`
    },
    {
      title: `${subjectName} Study Community`,
      type: "Community",
      link: `https://www.reddit.com/search/?q=${encodeURIComponent(subjectName + " study")}`
    },
    {
      title: `${subjectName} Practice on Quizlet`,
      type: "Flashcards",
      link: `https://quizlet.com/search?query=${encodeURIComponent(subjectName)}&type=sets`
    }
  ];

  const plan = {
    subject: subjectName,
    examDate: examDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    level,
    totalStudyHours: hours * dayCount,
    modules,
    tips: levelTips[level] || levelTips.beginner,
    mockTests,
    advancedResources
  };

  res.json({ plan });
});

app.post("/api/study-plan", async (req, res) => {
  const { user_id: userId, plan } = req.body;

  if (!userId || !plan) {
    res.status(400).json({ message: "user_id and plan are required." });
    return;
  }

  try {
    const planId = await replaceStudyPlan(userId, plan);
    res.status(201).json({ message: "Study plan saved.", planId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to save study plan." });
  }
});

app.get("/api/study-plan/:userId", async (req, res) => {
  try {
    const planRow = await get(
      `SELECT * FROM plans WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.params.userId]
    );

    if (!planRow || !planRow.content) {
      res.status(404).json({ message: "No study plan found." });
      return;
    }

    const tasks = await all(
      `SELECT id, title, status, day, details, hours FROM tasks WHERE plan_id = ? ORDER BY day ASC, id ASC`,
      [planRow.id]
    );

    res.json({
      planId: planRow.id,
      plan: mergePlanWithTasks(planRow, tasks)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load study plan." });
  }
});

app.patch("/api/study-plan/:userId/modules/:day", async (req, res) => {
  const day = Number.parseInt(req.params.day, 10);

  try {
    const planRow = await get(
      `SELECT * FROM plans WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.params.userId]
    );

    if (!planRow || !planRow.content) {
      res.status(404).json({ message: "No study plan found." });
      return;
    }

    const plan = JSON.parse(planRow.content);
    const moduleIndex = plan.modules.findIndex((module) => Number(module.day) === day);

    if (moduleIndex === -1) {
      res.status(404).json({ message: "Module not found." });
      return;
    }

    const currentModule = plan.modules[moduleIndex];
    const nextModule = {
      ...currentModule,
      ...req.body,
      isCompleted:
        typeof req.body.isCompleted === "boolean"
          ? req.body.isCompleted
          : currentModule.isCompleted
    };

    plan.modules[moduleIndex] = nextModule;

    await run(`UPDATE plans SET content = ?, subject = ?, exam_date = ?, level = ? WHERE id = ?`, [
      JSON.stringify(plan),
      plan.subject,
      plan.examDate ?? null,
      plan.level ?? null,
      planRow.id
    ]);

    await run(
      `UPDATE tasks SET title = ?, details = ?, hours = ?, status = ? WHERE plan_id = ? AND day = ?`,
      [
        nextModule.topic,
        nextModule.description ?? "",
        Number.parseInt(nextModule.hours, 10) || 0,
        nextModule.isCompleted ? "completed" : "pending",
        planRow.id,
        day
      ]
    );

    res.json({ message: "Module updated.", plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to update module." });
  }
});

app.delete("/api/study-plan/:userId", async (req, res) => {
  try {
    const plans = await all(`SELECT id FROM plans WHERE user_id = ?`, [req.params.userId]);
    for (const plan of plans) {
      await run(`DELETE FROM tasks WHERE plan_id = ?`, [plan.id]);
    }
    await run(`DELETE FROM plans WHERE user_id = ?`, [req.params.userId]);

    res.json({ message: "Study plan deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete study plan." });
  }
});

app.get("/api/progress/:userId", async (req, res) => {
  try {
    const planRow = await get(
      `SELECT id FROM plans WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.params.userId]
    );

    if (!planRow) {
      res.json({ total: 0, completed: 0, percentage: 0 });
      return;
    }

    const rows = await all(`SELECT status FROM tasks WHERE plan_id = ?`, [planRow.id]);
    const total = rows.length;
    const completed = rows.filter((task) => task.status === "completed").length;

    res.json({
      total,
      completed,
      percentage: total ? Number(((completed / total) * 100).toFixed(2)) : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load progress." });
  }
});

app.get("/api/stats/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const planRow = await get(
      `SELECT id FROM plans WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    if (!planRow) {
      res.json({ totalHours: 0, completedModules: 0, streak: 0 });
      return;
    }

    // Total hours from completed tasks
    const completedTasks = await all(
      `SELECT hours FROM tasks WHERE plan_id = ? AND status = 'completed'`,
      [planRow.id]
    );
    const totalHours = completedTasks.reduce((sum, task) => sum + (task.hours || 0), 0);
    const completedModules = completedTasks.length;

    // Calculate Streak based on login_history days
    const loginHistory = await all(
      `SELECT DISTINCT date(logged_in_at) as login_date 
       FROM login_history 
       WHERE user_id = ? 
       ORDER BY login_date DESC`,
      [userId]
    );

    let streak = 0;
    if (loginHistory.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      
      let lastDate = loginHistory[0].login_date;
      
      // If the last login wasn't today or yesterday, streak is broken (0)
      if (lastDate === today || lastDate === yesterday) {
        streak = 1;
        for (let i = 1; i < loginHistory.length; i++) {
          const currentDate = new Date(loginHistory[i-1].login_date);
          const prevDate = new Date(loginHistory[i].login_date);
          const diffTime = Math.abs(currentDate - prevDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      totalHours,
      completedModules,
      streak
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load statistics." });
  }
});

// ─── Notes CRUD ───

app.post("/api/notes", async (req, res) => {
  const { user_id: userId, day, content } = req.body;

  if (!userId || !day || !content) {
    res.status(400).json({ message: "user_id, day, and content are required." });
    return;
  }

  try {
    const planRow = await get(`SELECT id FROM plans WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);
    const planId = planRow ? planRow.id : null;

    const result = await run(
      `INSERT INTO study_notes (user_id, plan_id, day, content) VALUES (?, ?, ?, ?)`,
      [userId, planId, day, content]
    );

    res.status(201).json({ message: "Note saved.", noteId: result.lastID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to save note." });
  }
});

app.get("/api/notes/:userId", async (req, res) => {
  try {
    const notes = await all(
      `SELECT id, day, content, created_at FROM study_notes WHERE user_id = ? ORDER BY day ASC, created_at DESC`,
      [req.params.userId]
    );
    res.json({ notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load notes." });
  }
});

app.delete("/api/notes/:noteId", async (req, res) => {
  try {
    await run(`DELETE FROM study_notes WHERE id = ?`, [req.params.noteId]);
    res.json({ message: "Note deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete note." });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
