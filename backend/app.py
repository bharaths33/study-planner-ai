from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config, DATABASE_PATH, INSTANCE_DIR
from models import db, User, Plan

INSTANCE_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

with app.app_context():
    db.create_all()


def ensure_sqlite_schema():
    with db.engine.begin() as connection:
        columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(users)").fetchall()
        }

        if "last_login" not in columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN last_login TEXT")

        if "login_count" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0"
            )

        connection.exec_driver_sql(
            """
            CREATE TABLE IF NOT EXISTS login_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email TEXT NOT NULL,
                logged_in_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


with app.app_context():
    ensure_sqlite_schema()


def password_matches(stored_password, entered_password):
    if not stored_password:
        return False

    if stored_password.startswith("pbkdf2:") or stored_password.startswith("scrypt:"):
        return check_password_hash(stored_password, entered_password)

    return stored_password == entered_password


@app.route("/")
def home():
    return f"Study Planner API is running with {DATABASE_PATH.name}."


@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    if len(password) < 4:
        return jsonify({"message": "Password must be at least 4 characters."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "An account with this email already exists."}), 409

    user = User(email=email, password=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Signup successful.",
                "user": {"id": user.id, "email": user.email},
            }
        ),
        201,
    )


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not password_matches(user.password, password):
        return jsonify({"message": "Invalid email or password."}), 401

    if user.password == password:
        user.password = generate_password_hash(password)
        db.session.commit()

    login_count = (getattr(user, "login_count", 0) or 0) + 1
    db.session.execute(
        db.text("UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = :count WHERE id = :id"),
        {"count": login_count, "id": user.id},
    )
    db.session.execute(
        db.text(
            "INSERT INTO login_history (user_id, email, logged_in_at) VALUES (:user_id, :email, CURRENT_TIMESTAMP)"
        ),
        {"user_id": user.id, "email": user.email},
    )
    db.session.commit()

    return jsonify(
        {
            "message": "Login successful.",
            "user": {"id": user.id, "email": user.email},
            "login_count": login_count,
        }
    )


@app.post("/api/auth/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    new_password = data.get("newPassword") or ""

    if not email:
        return jsonify({"message": "Enter your email first."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(
            {"message": "No account matched that email. Check the email spelling or create an account first."}
        )

    if not new_password:
        return jsonify({"message": "Account found. Enter a new password to reset it."})

    if len(new_password) < 4:
        return jsonify({"message": "New password must be at least 4 characters."}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully. Please log in with your new password."})


if __name__ == "__main__":
    app.run(debug=True)
