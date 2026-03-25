from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)


class Plan(db.Model):
    __tablename__ = "plans"

    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(200))
    hours = db.Column(db.Integer)
    user_id = db.Column(db.Integer, nullable=True)
    content = db.Column(db.Text)
    exam_date = db.Column(db.String(100))
    level = db.Column(db.String(100))
    created_at = db.Column(db.String(100))
