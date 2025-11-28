import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'best_rf_model (1).pkl')
    DEBUG = True
