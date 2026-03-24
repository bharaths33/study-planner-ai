from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Plan
import os

app = Flask(__name__)
CORS(app)

# DB Config
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///app.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create DB
with app.app_context():
    db.create_all()

# ---------------- AUTH ---------------- #

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    user = User(username=data["username"], password=data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered"})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(username=data["username"], password=data["password"]).first()
    if user:
        return jsonify({"message": "Login success"})
    return jsonify({"error": "Invalid credentials"}), 401

# ---------------- STUDY PLAN ---------------- #

@app.route("/api/plans", methods=["POST"])
def create_plan():
    data = request.json
    plan = Plan(title=data["title"], content=data["content"])
    db.session.add(plan)
    db.session.commit()
    return jsonify({"message": "Plan created"})

@app.route("/api/plans", methods=["GET"])
def get_plans():
    plans = Plan.query.all()
    result = []
    for p in plans:
        result.append({
            "id": p.id,
            "title": p.title,
            "content": p.content
        })
    return jsonify(result)

# ---------------- RUN ---------------- #

if __name__ == "__main__":
    app.run(debug=True)