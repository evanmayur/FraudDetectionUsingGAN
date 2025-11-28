from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}}) # In production, restrict to frontend domain

    from app.routes import main
    app.register_blueprint(main)

    return app
