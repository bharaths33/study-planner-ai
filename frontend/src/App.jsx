import { useEffect, useState, useRef, useCallback } from "react";
import Login from "./Login";
import portalLogo from "./assets/hero.png";

const STORAGE_KEY = "study-planner-user";
const LEGACY_STORAGE_KEY = "user";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const COLLEGE_NAME = "Student Study Portal";

function readStoredUser() {
  const storageKeys = [STORAGE_KEY, LEGACY_STORAGE_KEY];

  for (const key of storageKeys) {
    const savedValue = localStorage.getItem(key);

    if (!savedValue || savedValue === "undefined" || savedValue === "null") {
      localStorage.removeItem(key);
      continue;
    }

    try {
      const parsed = JSON.parse(savedValue);
      const normalizedUser = {
        id: parsed?.id ?? parsed?.user_id ?? null,
        email: parsed?.email ?? "",
      };

      if (!normalizedUser.id || !normalizedUser.email) {
        localStorage.removeItem(key);
        continue;
      }

      if (key !== STORAGE_KEY) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
        localStorage.removeItem(key);
      }

      return normalizedUser;
    } catch {
      localStorage.removeItem(key);
    }
  }

  return null;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: "The server returned an unexpected response." };

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

/* ─── Study Stats Widget ─── */
function StudyStatsWidget({ userId, refreshTrigger }) {
  const [stats, setStats] = useState({ totalHours: 0, completedModules: 0, streak: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await requestJson(`/api/stats/${userId}`);
        setStats(data);
      } catch {
        /* silent */
      }
    }
    loadStats();
  }, [userId, refreshTrigger]);

  return (
    <div
      style={{
        marginTop: "22px",
        padding: "20px",
        borderRadius: "24px",
        background: "linear-gradient(135deg, #1e3a8a, #1e40af)",
        color: "#ffffff",
        boxShadow: "0 12px 24px rgba(30, 64, 175, 0.2)",
      }}
    >
      <p style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: 600 }}>Study Mastery</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <div>
          <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>Streak</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>🔥 {stats.streak} Days</p>
        </div>
        <div>
          <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>Study Time</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>⏱ {stats.totalHours}h</p>
        </div>
      </div>
      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          {stats.completedModules} Modules Mastered
        </p>
      </div>
    </div>
  );
}

/* ─── Motivation Widget ─── */
function MotivationWidget() {
  const tips = [
    "Consistency is key. Even 20 minutes a day beats a 5-hour marathon once a week.",
    "The best way to learn is to teach. Try explaining a concept to an imaginary friend.",
    "Break big topics into tiny chunks. You can't eat an elephant in one bite!",
    "Take breaks! Your brain needs time to process and store new information.",
    "Mistakes are proof that you are trying. Analyze them and move forward.",
  ];
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  return (
    <div
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "20px",
        background: "#ffffff",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
      }}
    >
      <p style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
        💡 Study Tip
      </p>
      <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, fontStyle: "italic" }}>
        "{tip}"
      </p>
    </div>
  );
}

/* ─── Quick Tasks Widget ─── */
function QuickTasksWidget() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("study-quick-tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    localStorage.setItem("study-quick-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input, done: false }]);
    setInput("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const clearDone = () => setTasks(tasks.filter(t => !t.done));

  return (
    <div
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "20px",
        background: "#f8fafc",
        border: "1px solid rgba(148, 163, 184, 0.2)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>✍️ Quick Tasks</p>
        {tasks.some(t => t.done) && (
          <button onClick={clearDone} style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.75rem", cursor: "pointer" }}>
            Clear done
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="New task..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
        />
        <button onClick={addTask} style={{ padding: "8px 12px", borderRadius: "10px", border: "none", background: "#1d4ed8", color: "white", fontWeight: 700, cursor: "pointer" }}>
          +
        </button>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {tasks.map(t => (
          <div key={t.id} style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.85rem", color: t.done ? "#94a3b8" : "#475569" }}>
            <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
            <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pomodoro Timer ─── */
function PomodoroTimer() {
  const WORK_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;

  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsBreak((wasBreak) => {
            const nextIsBreak = !wasBreak;
            setSecondsLeft(nextIsBreak ? BREAK_SECONDS : WORK_SECONDS);
            return nextIsBreak;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setIsBreak(false);
    setSecondsLeft(WORK_SECONDS);
  };

  return (
    <div
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "20px",
        background: isBreak
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(255, 255, 255, 0.96))"
          : "linear-gradient(135deg, rgba(29, 78, 216, 0.08), rgba(15, 118, 110, 0.08))",
        border: isBreak ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid transparent",
      }}
    >
      <p style={{ color: "#0f172a", fontWeight: 700, marginBottom: "4px" }}>
        ⏱ Pomodoro Timer
      </p>
      <p style={{ color: "#475569", fontSize: "0.88rem", marginBottom: "12px" }}>
        {isBreak ? "Break time — relax!" : "Focus session — stay concentrated!"}
      </p>
      <p
        style={{
          fontSize: "2.4rem",
          fontWeight: 800,
          color: isBreak ? "#0f766e" : "#1d4ed8",
          textAlign: "center",
          fontFamily: "monospace",
          letterSpacing: "0.08em",
        }}
      >
        {minutes}:{seconds}
      </p>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "12px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            border: "none",
            borderRadius: "14px",
            padding: "10px 20px",
            background: isRunning
              ? "#fbbf24"
              : "linear-gradient(135deg, #1d4ed8, #0f766e)",
            color: isRunning ? "#0f172a" : "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: "14px",
            padding: "10px 20px",
            background: "#f8fafc",
            color: "#475569",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ─── Study Note for a Module ─── */
function ModuleNote({ userId, day, existingNotes, onNoteSaved, onNoteDeleted }) {
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const dayNotes = existingNotes.filter((n) => n.day === day);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await requestJson("/api/notes", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, day, content: noteText.trim() }),
      });
      setNoteText("");
      onNoteSaved?.();
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      await requestJson(`/api/notes/${noteId}`, { method: "DELETE" });
      onNoteDeleted?.();
    } catch {
      /* silent */
    }
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {dayNotes.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          {dayNotes.map((note) => (
            <div
              key={note.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "8px",
                padding: "8px 10px",
                marginBottom: "6px",
                borderRadius: "12px",
                background: "#fffbeb",
                border: "1px solid rgba(251, 191, 36, 0.2)",
                fontSize: "0.88rem",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              <span style={{ flex: 1 }}>📝 {note.content}</span>
              <button
                onClick={() => handleDelete(note.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a study note..."
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            fontSize: "0.88rem",
            color: "#0f172a",
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !noteText.trim()}
          style={{
            border: "none",
            borderRadius: "12px",
            padding: "10px 16px",
            background: saving || !noteText.trim() ? "#e2e8f0" : "#1d4ed8",
            color: saving || !noteText.trim() ? "#94a3b8" : "#ffffff",
            fontWeight: 700,
            cursor: saving || !noteText.trim() ? "not-allowed" : "pointer",
            fontSize: "0.85rem",
            flexShrink: 0,
          }}
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
function Dashboard({ user, onLogout }) {
  const [form, setForm] = useState({
    subject: "",
    examDate: "",
    hoursPerDay: "2",
    currentLevel: "beginner",
  });
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [status, setStatus] = useState("");
  const [statusColor, setStatusColor] = useState("#475569");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingDay, setUpdatingDay] = useState(null);
  const [notes, setNotes] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);

  const showStatus = (text, color = "#475569") => {
    setStatus(text);
    setStatusColor(color);
  };

  const loadNotes = useCallback(async () => {
    try {
      const result = await requestJson(`/api/notes/${user.id}`);
      setNotes(result.notes || []);
    } catch {
      setNotes([]);
    }
  }, [user.id]);

  const loadDashboardData = async () => {
    setLoadingPlan(true);

    try {
      const [planResult, progressResult] = await Promise.allSettled([
        requestJson(`/api/study-plan/${user.id}`),
        requestJson(`/api/progress/${user.id}`),
      ]);

      if (planResult.status === "fulfilled") {
        setPlan(planResult.value.plan);
      } else {
        setPlan(null);
      }

      if (progressResult.status === "fulfilled") {
        setProgress(progressResult.value);
      } else {
        setProgress({ total: 0, completed: 0, percentage: 0 });
      }
    } catch (error) {
      showStatus(error.message, "#b91c1c");
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadNotes();
  }, [user.id]);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGeneratePlan = async () => {
    setSaving(true);
    showStatus("");

    try {
      const generated = await requestJson("/api/generate-plan", {
        method: "POST",
        body: JSON.stringify(form),
      });

      await requestJson("/api/study-plan", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          plan: generated.plan,
        }),
      });

      setPlan(generated.plan);
      await loadDashboardData();
      showStatus("Study plan generated and saved successfully.", "#0f766e");
    } catch (error) {
      showStatus(error.message, "#b91c1c");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModule = async (module) => {
    setUpdatingDay(module.day);
    showStatus("");

    try {
      const result = await requestJson(`/api/study-plan/${user.id}/modules/${module.day}`, {
        method: "PATCH",
        body: JSON.stringify({
          isCompleted: !module.isCompleted,
        }),
      });

      setPlan(result.plan);
      const nextCompleted = result.plan.modules.filter((item) => item.isCompleted).length;
      setProgress({
        total: result.plan.modules.length,
        completed: nextCompleted,
        percentage: result.plan.modules.length
          ? Number(((nextCompleted / result.plan.modules.length) * 100).toFixed(2))
          : 0,
      });
      showStatus("Module progress updated.", "#1d4ed8");
    } catch (error) {
      showStatus(error.message, "#b91c1c");
    } finally {
      setUpdatingDay(null);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.12), transparent 24%), linear-gradient(135deg, #eff6ff 0%, #dbeafe 45%, #f8fafc 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1160px",
          margin: "0 auto",
          background: "rgba(255, 255, 255, 0.88)",
          borderRadius: "32px",
          padding: "28px",
          boxShadow: "0 28px 80px rgba(30, 64, 175, 0.14)",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          backdropFilter: "blur(20px)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "18px",
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src={portalLogo}
              alt="Student portal logo"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "22px",
                boxShadow: "0 18px 32px rgba(29, 78, 216, 0.18)",
              }}
            />
            <div>
              <p
                style={{
                  color: "#2563eb",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontSize: "0.85rem",
                }}
              >
                {COLLEGE_NAME}
              </p>
              <h1 style={{ color: "#0f172a", fontSize: "2.1rem", marginTop: "6px" }}>
                Welcome, {user.email}
              </h1>
              <p style={{ color: "#475569", marginTop: "6px" }}>
                You are inside your study planner dashboard now.
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "13px 22px",
              background: "#ea580c",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 340px) 1fr",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* ─── Left Panel: Sticky Sidebar ─── */}
          <aside
            style={{
              position: "sticky",
              top: "24px",
              display: "grid",
              gap: "22px",
            }}
          >
            <article
              style={{
                background: "#ffffff",
                borderRadius: "26px",
                padding: "24px",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
              }}
            >
            <h2 style={{ color: "#0f172a", fontSize: "1.35rem", marginBottom: "6px" }}>
              Build a plan
            </h2>
            <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: "18px" }}>
              Generate a guided study plan and save it to your account.
            </p>

            <div style={{ display: "grid", gap: "14px" }}>
              <input
                value={form.subject}
                placeholder="Subject name"
                onChange={(event) => handleChange("subject", event.target.value)}
                style={inputStyle}
              />
              <input
                type="date"
                value={form.examDate}
                onChange={(event) => handleChange("examDate", event.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                min="1"
                max="12"
                value={form.hoursPerDay}
                placeholder="Hours per day"
                onChange={(event) => handleChange("hoursPerDay", event.target.value)}
                style={inputStyle}
              />
              <select
                value={form.currentLevel}
                onChange={(event) => handleChange("currentLevel", event.target.value)}
                style={inputStyle}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                onClick={handleGeneratePlan}
                disabled={saving}
                style={{
                  marginTop: "6px",
                  border: "none",
                  borderRadius: "18px",
                  padding: "15px 18px",
                  background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.75 : 1,
                }}
              >
                {saving ? "Saving plan..." : "Generate Study Plan"}
              </button>
            </div>

            {/* Progress */}
            <div
              style={{
                marginTop: "22px",
                padding: "18px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(29, 78, 216, 0.08), rgba(15, 118, 110, 0.08))",
              }}
            >
              <p style={{ color: "#0f172a", fontWeight: 700 }}>Progress</p>
              <p style={{ color: "#475569", marginTop: "4px" }}>
                {progress.completed} of {progress.total} modules completed
              </p>
              <div
                style={{
                  marginTop: "12px",
                  height: "10px",
                  background: "#dbeafe",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress.percentage}%`,
                    height: "100%",
                    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <p style={{ color: "#1e3a8a", marginTop: "10px", fontWeight: 700 }}>
                {progress.percentage}% complete
              </p>
            </div>

              {/* Pomodoro Timer */}
              <PomodoroTimer />
            </article>

            <StudyStatsWidget userId={user.id} refreshTrigger={progress.completed} />

            {/* Motivation Tip */}
            <MotivationWidget />

            {/* Quick Tasks */}
            <QuickTasksWidget />
          </aside>

          {/* ─── Right Panel: Roadmap + Extras ─── */}
          <article
            style={{
              background: "#ffffff",
              borderRadius: "26px",
              padding: "24px",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 style={{ color: "#0f172a", fontSize: "1.35rem" }}>Your study roadmap</h2>
                <p style={{ color: "#64748b", marginTop: "6px" }}>
                  {plan?.subject
                    ? `${plan.subject} plan with ${plan.modules?.length ?? 0} learning blocks`
                    : "Create a plan to see your study schedule here."}
                </p>
              </div>
            </div>

            {status ? (
              <p
                style={{
                  marginBottom: "16px",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  background: "rgba(248, 250, 252, 0.95)",
                  color: statusColor,
                  lineHeight: 1.6,
                }}
              >
                {status}
              </p>
            ) : null}

            {loadingPlan ? (
              <p style={{ color: "#64748b" }}>Loading your dashboard...</p>
            ) : plan?.modules?.length ? (
              <>
                {/* ── Module Cards ── */}
                <div style={{ display: "grid", gap: "14px" }}>
                  {plan.modules.map((module) => {
                    const isExpanded = expandedDay === module.day;
                    return (
                      <div
                        key={module.day}
                        style={{
                          borderRadius: "22px",
                          padding: "18px",
                          border: module.isCompleted
                            ? "1px solid rgba(16, 185, 129, 0.35)"
                            : "1px solid rgba(148, 163, 184, 0.18)",
                          background: module.isCompleted
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(255, 255, 255, 0.94))"
                            : "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpandedDay(isExpanded ? null : module.day)}>
                            <p style={{ color: "#2563eb", fontWeight: 700 }}>Day {module.day}</p>
                            <h3 style={{ color: "#0f172a", marginTop: "6px", fontSize: "1.05rem" }}>
                              {module.topic}
                            </h3>
                            <p style={{ color: "#475569", marginTop: "8px", lineHeight: 1.6 }}>
                              {module.description}
                            </p>
                          </div>

                          <button
                            onClick={() => handleToggleModule(module)}
                            disabled={updatingDay === module.day}
                            style={{
                              border: "none",
                              borderRadius: "999px",
                              padding: "11px 16px",
                              background: module.isCompleted ? "#dcfce7" : "#dbeafe",
                              color: module.isCompleted ? "#166534" : "#1d4ed8",
                              fontWeight: 700,
                              cursor: updatingDay === module.day ? "not-allowed" : "pointer",
                            }}
                          >
                            {updatingDay === module.day
                              ? "Updating..."
                              : module.isCompleted
                                ? "Completed ✓"
                                : "Mark complete"}
                          </button>
                        </div>

                        {/* Badges */}
                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={badgeStyle}>{module.type ?? "Module"}</span>
                          <span style={badgeStyle}>{module.hours ?? 0} hours</span>
                          {module.video?.url && (
                            <a
                              href={module.video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...badgeStyle,
                                background: "#fee2e2",
                                color: "#b91c1c",
                                textDecoration: "none",
                                cursor: "pointer",
                              }}
                            >
                              ▶ Watch Video
                            </a>
                          )}
                          <button
                            onClick={() => setExpandedDay(isExpanded ? null : module.day)}
                            style={{
                              ...badgeStyle,
                              background: isExpanded ? "#dbeafe" : "#f1f5f9",
                              color: isExpanded ? "#1d4ed8" : "#64748b",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "▲ Less" : "▼ More"}
                          </button>
                        </div>

                        {/* Expanded: Subtopics + Notes */}
                        {isExpanded && (
                          <div style={{ marginTop: "14px" }}>
                            {/* Subtopics */}
                            {module.subtopics?.length > 0 && (
                              <div
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: "14px",
                                  background: "rgba(29, 78, 216, 0.04)",
                                  border: "1px solid rgba(29, 78, 216, 0.08)",
                                  marginBottom: "10px",
                                }}
                              >
                                <p style={{ color: "#1e3a8a", fontWeight: 700, fontSize: "0.9rem", marginBottom: "8px" }}>
                                  📋 Subtopics to Cover
                                </p>
                                <ol style={{ margin: 0, paddingLeft: "20px", color: "#334155", lineHeight: 1.8, fontSize: "0.9rem" }}>
                                  {module.subtopics.map((st, i) => (
                                    <li key={i}>{st}</li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Notes */}
                            <ModuleNote
                              userId={user.id}
                              day={module.day}
                              existingNotes={notes}
                              onNoteSaved={loadNotes}
                              onNoteDeleted={loadNotes}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Study Tips ── */}
                {plan.tips?.length > 0 && (
                  <div
                    style={{
                      marginTop: "22px",
                      padding: "20px",
                      borderRadius: "22px",
                      background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(255, 255, 255, 0.96))",
                      border: "1px solid rgba(251, 191, 36, 0.18)",
                    }}
                  >
                    <h3 style={{ color: "#92400e", fontSize: "1.1rem", marginBottom: "12px" }}>
                      💡 Study Tips for {plan.level?.charAt(0).toUpperCase() + plan.level?.slice(1)} Level
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 2, fontSize: "0.92rem" }}>
                      {plan.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Mock Tests ── */}
                {plan.mockTests?.length > 0 && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "20px",
                      borderRadius: "22px",
                      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(255, 255, 255, 0.96))",
                      border: "1px solid rgba(139, 92, 246, 0.15)",
                    }}
                  >
                    <h3 style={{ color: "#5b21b6", fontSize: "1.1rem", marginBottom: "12px" }}>
                      📝 Recommended Mock Tests
                    </h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {plan.mockTests.map((test, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "14px",
                            background: "#faf5ff",
                            border: "1px solid rgba(139, 92, 246, 0.1)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.95rem" }}>{test.title}</p>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <span style={{ ...badgeStyle, background: "#ede9fe", color: "#6d28d9" }}>
                                Day {test.recommendedDay}
                              </span>
                              <span style={{ ...badgeStyle, background: "#ede9fe", color: "#6d28d9" }}>
                                {test.duration}
                              </span>
                            </div>
                          </div>
                          <p style={{ color: "#64748b", marginTop: "6px", fontSize: "0.88rem", lineHeight: 1.5 }}>
                            {test.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Advanced Resources ── */}
                {plan.advancedResources?.length > 0 && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "20px",
                      borderRadius: "22px",
                      background: "linear-gradient(135deg, rgba(14, 165, 233, 0.06), rgba(255, 255, 255, 0.96))",
                      border: "1px solid rgba(14, 165, 233, 0.15)",
                    }}
                  >
                    <h3 style={{ color: "#0369a1", fontSize: "1.1rem", marginBottom: "12px" }}>
                      📚 Study Resources
                    </h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {plan.advancedResources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                            padding: "12px 14px",
                            borderRadius: "14px",
                            background: "#f0f9ff",
                            border: "1px solid rgba(14, 165, 233, 0.1)",
                            textDecoration: "none",
                            color: "#0f172a",
                            transition: "background 0.2s",
                          }}
                        >
                          <p style={{ fontWeight: 600, fontSize: "0.92rem" }}>{resource.title}</p>
                          <span style={{ ...badgeStyle, background: "#e0f2fe", color: "#0369a1" }}>
                            {resource.type}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  borderRadius: "22px",
                  padding: "24px",
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <p style={{ color: "#0f172a", fontWeight: 700 }}>No study plan yet</p>
                <p style={{ color: "#64748b", marginTop: "8px", lineHeight: 1.7 }}>
                  Fill in the subject details on the left, then generate your first study plan.
                </p>
              </div>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(() => readStoredUser());

  const handleAuthSuccess = (nextUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <Login onAuthSuccess={handleAuthSuccess} />;
}

const inputStyle = {
  padding: "15px 18px",
  borderRadius: "16px",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  fontSize: "1rem",
  color: "#0f172a",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "7px 12px",
  background: "#e2e8f0",
  color: "#334155",
  fontSize: "0.88rem",
  fontWeight: 600,
};

export default App;
