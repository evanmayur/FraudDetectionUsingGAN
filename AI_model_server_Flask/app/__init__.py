from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from app.config import Config

# Initialize SocketIO
socketio = SocketIO(cors_allowed_origins="*")

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}})  # In production, restrict to frontend domain
    
    # Initialize database (no table creation yet)
    from app.database import init_db, create_tables, db
    init_db(app)
    
    # Import models BEFORE creating tables
    from app import models
    
    # Now create tables (models are registered with SQLAlchemy)
    create_tables(app)
    
    # Initialize SocketIO with the app
    socketio.init_app(app)
    
    # Register blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    # Register API routes
    from app.api_routes import api
    app.register_blueprint(api, url_prefix='/api')
    
    # Seed demo data on first run
    with app.app_context():
        seed_demo_data(db)
    
    return app


def seed_demo_data(db):
    """Seed initial demo data if database is empty."""
    from app.models import User, UserRiskProfile, VerificationStatus
    
    # Check if demo user exists
    if User.query.filter_by(upi_id='demo.user@upi').first():
        return  # Data already seeded
    
    print("🌱 Seeding demo data...")
    
    # Create demo users
    demo_users = [
        {
            'upi_id': 'demo.user@upi',
            'display_name': 'Demo User',
            'email': 'demo@example.com',
            'verification_status': VerificationStatus.VERIFIED,
            'account_balance': 50000.00,
            'is_admin': True,
            'risk_profile': {
                'trust_score': 85.0,
                'geo_location_flag': 'normal',
            }
        },
        {
            'upi_id': 'trusted.merchant@upi',
            'display_name': 'Trusted Merchant',
            'email': 'merchant@example.com',
            'verification_status': VerificationStatus.VERIFIED,
            'account_balance': 100000.00,
            'risk_profile': {
                'trust_score': 95.0,
                'geo_location_flag': 'normal',
            }
        },
        {
            'upi_id': 'suspicious.account@upi',
            'display_name': 'Suspicious Account',
            'verification_status': VerificationStatus.PENDING,
            'account_balance': 5000.00,
            'risk_profile': {
                'trust_score': 15.0,
                'fraud_flags': 2,
                'fraud_complaints_received': 3,
                'geo_location_flag': 'high-risk',
            }
        },
        {
            'upi_id': 'new.user@upi',
            'display_name': 'New User',
            'email': 'newuser@example.com',
            'verification_status': VerificationStatus.PENDING,
            'account_balance': 10000.00,
            'risk_profile': {
                'trust_score': 50.0,
                'geo_location_flag': 'normal',
            }
        },
        {
            'upi_id': 'fraud.actor@upi',
            'display_name': 'Fraud Actor',
            'verification_status': VerificationStatus.SUSPENDED,
            'account_balance': 0.00,
            'risk_profile': {
                'trust_score': 5.0,
                'fraud_flags': 5,
                'fraud_complaints_received': 10,
                'blacklist_status': True,
                'geo_location_flag': 'high-risk',
            }
        },
    ]
    
    for user_data in demo_users:
        risk_data = user_data.pop('risk_profile', {})
        
        user = User(**user_data)
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Create risk profile
        risk_profile = UserRiskProfile(user_id=user.id, **risk_data)
        db.session.add(risk_profile)
    
    db.session.commit()
    print(f"✅ Seeded {len(demo_users)} demo users")

