"""
Database Configuration and Initialization
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()


def init_db(app: Flask):
    """Initialize database with the Flask app."""
    # Database configuration
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    db_path = os.path.join(basedir, 'safepay.db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = False  # Set to True for SQL debugging
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    
    print(f"📦 Database configured at {db_path}")
    
    return db


def create_tables(app: Flask):
    """Create all tables. Call this AFTER importing models."""
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")

