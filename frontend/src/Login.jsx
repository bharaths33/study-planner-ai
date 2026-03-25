import { useState } from "react";
import portalLogo from "./assets/hero.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const COLLEGE_NAME = "Student Study Portal";

function getErrorMessage(path, responseText) {
  const plainText = responseText.trim();

  if (!plainText) {
    return "Request failed.";
  }

  if (plainText.startsWith("<!DOCTYPE html") || plainText.startsWith("<html")) {
    if (path === "/api/auth/forgot-password") {
      return "Forgot password is not available on the current backend yet.";
    }

    return "The server returned an unexpected error page.";
  }

  return plainText;
}

async function postJson(path, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { message: getErrorMessage(path, await response.text()) };

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Backend server is not running on http://localhost:5000.");
    }

    throw error;
  }
}

function fieldStyle() {
  return {
    width: "100%",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #d6deeb",
    background: "#f8fbff",
    color: "#0f172a",
    fontSize: "0.98rem",
    outline: "none",
  };
}

function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("#334155");

  const showMessage = (text, color = "#334155") => {
    setMessage(text);
    setMessageColor(color);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (message) {
      showMessage("");
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (message) {
      showMessage("");
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    showMessage("");

    try {
      const data = await postJson("/api/auth/login", { email, password });
      const nextUser = data.user ?? {
        id: data.user_id,
        email: data.email ?? email,
      };

      if (!nextUser?.id || !nextUser?.email) {
        throw new Error("Login worked, but the user details were missing from the server response.");
      }

      showMessage(data.message, "#0f766e");
      onAuthSuccess?.(nextUser);
      setEmail("");
      setPassword("");
    } catch (error) {
      showMessage(error.message, "#b91c1c");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    showMessage("");

    if (!email.trim() || !password.trim()) {
      showMessage("Enter your email and password to create an account.", "#b91c1c");
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      showMessage("Password must be at least 4 characters.", "#b91c1c");
      setLoading(false);
      return;
    }

    try {
      const data = await postJson("/api/auth/signup", { email, password });
      showMessage(data.message || "Account created successfully. You can log in now.", "#0f766e");
      setSignupMode(false);
    } catch (error) {
      showMessage(error.message, "#b91c1c");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      showMessage("Enter your email first.", "#b91c1c");
      return;
    }

    if (!resetMode) {
      setResetMode(true);
      setNewPassword("");
      setConfirmPassword("");
      showMessage("Reset mode is ready. Enter a new password below.", "#1d4ed8");
      return;
    }

    if (!newPassword) {
      showMessage("Enter a new password.", "#b91c1c");
      return;
    }

    if (newPassword.length < 4) {
      showMessage("New password must be at least 4 characters.", "#b91c1c");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("New password and confirm password must match.", "#b91c1c");
      return;
    }

    setForgotLoading(true);
    showMessage("");

    try {
      const data = await postJson("/api/auth/forgot-password", { email, newPassword });
      showMessage(data.message, "#0f766e");
      setResetMode(false);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.message === "No student account was found with that email.") {
        showMessage("No account matched that email. Check the email spelling or create an account first.", "#1d4ed8");
        return;
      }

      showMessage(error.message, "#b91c1c");
    } finally {
      setForgotLoading(false);
    }
  };

  const cancelReset = () => {
    setResetMode(false);
    setNewPassword("");
    setConfirmPassword("");
    showMessage("");
  };

  const switchToSignup = () => {
    setSignupMode(true);
    setResetMode(false);
    setNewPassword("");
    setConfirmPassword("");
    showMessage("");
  };

  const switchToLogin = () => {
    setSignupMode(false);
    setResetMode(false);
    setNewPassword("");
    setConfirmPassword("");
    showMessage("");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(29, 78, 216, 0.14), transparent 28%), linear-gradient(135deg, #edf6ff 0%, #dbeafe 44%, #f8fafc 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1080px",
          borderRadius: "34px",
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.92)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          boxShadow: "0 30px 90px rgba(30, 64, 175, 0.16)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        <aside
          style={{
            padding: "42px 38px",
            background:
              "linear-gradient(180deg, rgba(14, 116, 144, 0.96) 0%, rgba(30, 64, 175, 0.94) 100%)",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "28px",
          }}
        >
          <div>
            <div
              style={{
                width: "84px",
                height: "84px",
                borderRadius: "24px",
                background: "rgba(255, 255, 255, 0.16)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
              }}
            >
              <img
                src={portalLogo}
                alt="Student portal logo"
                style={{
                  width: "66px",
                  height: "66px",
                  objectFit: "cover",
                  borderRadius: "18px",
                }}
              />
            </div>

            <p
              style={{
                marginTop: "24px",
                fontSize: "0.84rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.76)",
                fontWeight: 700,
              }}
            >
              {COLLEGE_NAME}
            </p>

            <h1
              style={{
                marginTop: "16px",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                lineHeight: 1.05,
                color: "#ffffff",
              }}
            >
              Focus better.
              <br />
              Study smarter.
            </h1>

            <p
              style={{
                marginTop: "18px",
                maxWidth: "430px",
                color: "rgba(255, 255, 255, 0.78)",
                fontSize: "1rem",
                lineHeight: 1.8,
              }}
            >
              Sign in to manage your study plan, track progress, and keep your exam preparation organized in one place.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {[
              "Personal study plans saved to your account",
              "Progress tracking for each learning module",
              "Fast password reset directly from the login screen",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "999px",
                    background: "#7dd3fc",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#eff6ff", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <div
          style={{
            padding: "44px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.98) 100%)",
          }}
        >
          <div style={{ width: "100%", maxWidth: "430px" }}>
            <div style={{ marginBottom: "26px" }}>
              <p
                style={{
                  color: resetMode ? "#1d4ed8" : "#0f766e",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {resetMode ? "Password Reset" : signupMode ? "Create Account" : "Secure Login"}
              </p>
              <h2
                style={{
                  marginTop: "10px",
                  color: "#0f172a",
                  fontSize: "2.2rem",
                  lineHeight: 1.1,
                }}
              >
                {resetMode ? "Reset your password" : signupMode ? "Create your account" : "Welcome back"}
              </h2>
              <p
                style={{
                  marginTop: "12px",
                  color: "#64748b",
                  lineHeight: 1.7,
                }}
              >
                {resetMode
                  ? "Enter your registered email and create a new password for your account."
                  : signupMode
                    ? "New students can create an account here and start using the study planner right away."
                    : "Use your student account credentials to open your study planner dashboard."}
              </p>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={labelStyle}>Student email</span>
                <input
                  type="email"
                  value={email}
                  placeholder="name@example.com"
                  onChange={(event) => handleEmailChange(event.target.value)}
                  style={fieldStyle()}
                />
              </label>

              {!resetMode ? (
                <label style={{ display: "grid", gap: "8px" }}>
                  <span style={labelStyle}>Password</span>
                  <input
                    type="password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleLogin();
                      }
                    }}
                    style={fieldStyle()}
                  />
                </label>
              ) : (
                <>
                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>New password</span>
                    <input
                      type="password"
                      value={newPassword}
                      placeholder="Create a new password"
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        if (message) {
                          showMessage("");
                        }
                      }}
                      style={fieldStyle()}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "8px" }}>
                    <span style={labelStyle}>Confirm password</span>
                    <input
                      type="password"
                      value={confirmPassword}
                      placeholder="Confirm your new password"
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (message) {
                          showMessage("");
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleForgotPassword(event);
                        }
                      }}
                      style={fieldStyle()}
                    />
                  </label>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                {signupMode ? (
                  <button
                    type="button"
                    onClick={switchToLogin}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#64748b",
                      fontSize: "0.96rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Back to login
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetMode ? cancelReset : handleForgotPassword}
                    disabled={forgotLoading}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: resetMode ? "#64748b" : "#2563eb",
                      fontSize: "0.96rem",
                      fontWeight: 700,
                      cursor: forgotLoading ? "not-allowed" : "pointer",
                      padding: 0,
                    }}
                  >
                    {resetMode ? "Back to login" : "Forgot password?"}
                  </button>
                )}

                {resetMode ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#1d4ed8",
                      fontSize: "0.96rem",
                      fontWeight: 700,
                      cursor: forgotLoading ? "not-allowed" : "pointer",
                      padding: 0,
                    }}
                  >
                    {forgotLoading ? "Resetting..." : "Save new password"}
                  </button>
                ) : null}
              </div>

              <button
                onClick={signupMode ? handleSignup : handleLogin}
                disabled={loading || resetMode}
                style={{
                  marginTop: "10px",
                  border: "none",
                  borderRadius: "18px",
                  padding: "16px 18px",
                  background: resetMode
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #1d4ed8, #0f766e)",
                  color: "#ffffff",
                  cursor: loading || resetMode ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "1rem",
                  boxShadow: resetMode ? "none" : "0 18px 32px rgba(29, 78, 216, 0.18)",
                  opacity: loading || resetMode ? 0.78 : 1,
                }}
              >
                {loading
                  ? signupMode
                    ? "Creating account..."
                    : "Logging in..."
                  : resetMode
                    ? "Login disabled during reset"
                    : signupMode
                      ? "Create account"
                      : "Login"}
              </button>

              {!resetMode ? (
                <div
                  style={{
                    marginTop: "4px",
                    color: "#64748b",
                    fontSize: "0.95rem",
                    textAlign: "center",
                  }}
                >
                  {signupMode ? "Already have an account?" : "New student here?"}{" "}
                  <button
                    type="button"
                    onClick={signupMode ? switchToLogin : switchToSignup}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#1d4ed8",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {signupMode ? "Login" : "Create account"}
                  </button>
                </div>
              ) : null}
            </div>

            {message ? (
              <div
                style={{
                  marginTop: "18px",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  background:
                    messageColor === "#b91c1c"
                      ? "rgba(254, 226, 226, 0.9)"
                      : "rgba(239, 246, 255, 0.95)",
                  border:
                    messageColor === "#b91c1c"
                      ? "1px solid rgba(248, 113, 113, 0.25)"
                      : "1px solid rgba(96, 165, 250, 0.18)",
                  color: messageColor,
                  lineHeight: 1.6,
                }}
              >
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

const labelStyle = {
  color: "#334155",
  fontSize: "0.92rem",
  fontWeight: 700,
};

export default Login;
