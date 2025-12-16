"""
Authentication Middleware
Handles Firebase token verification and user session management.
"""

from functools import wraps
from flask import request, g, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
import os

# Initialize Firebase Admin SDK
firebase_initialized = False

def init_firebase():
    """Initialize Firebase Admin SDK if not already done."""
    global firebase_initialized
    
    if firebase_initialized:
        return True
    
    try:
        # Check if already initialized
        firebase_admin.get_app()
        firebase_initialized = True
        return True
    except ValueError:
        pass
    
    # Try to initialize with service account
    cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
    
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("✅ Firebase Admin initialized with service account")
        return True
    
    # Try to initialize without credentials (useful for emulator)
    try:
        firebase_admin.initialize_app()
        firebase_initialized = True
        print("✅ Firebase Admin initialized (default)")
        return True
    except Exception as e:
        print(f"⚠️ Firebase Admin initialization failed: {e}")
        print("   Authentication will work in demo mode only")
        return False


def verify_firebase_token(id_token):
    """
    Verify a Firebase ID token and return the user info.
    Returns None if verification fails.
    """
    if not init_firebase():
        return None
    
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None


def get_current_user():
    """Get the current authenticated user from Flask g object."""
    return getattr(g, 'current_user', None)


def auth_required(f):
    """
    Decorator to require authentication for an endpoint.
    Sets g.current_user and g.firebase_uid if authenticated.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.models import User
        
        # Check for Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'status': 'error',
                'message': 'Authorization header required'
            }), 401
        
        # Extract token from "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({
                'status': 'error',
                'message': 'Invalid authorization header format'
            }), 401
        
        id_token = parts[1]
        
        # For demo mode: accept "demo-token" and use a demo user
        if id_token == 'demo-token':
            demo_user = User.query.filter_by(upi_id='demo.user@upi').first()
            if demo_user:
                g.current_user = demo_user
                g.firebase_uid = 'demo-uid'
                return f(*args, **kwargs)
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Demo user not found'
                }), 401
        
        # Verify Firebase token
        decoded_token = verify_firebase_token(id_token)
        
        if not decoded_token:
            return jsonify({
                'status': 'error',
                'message': 'Invalid or expired token'
            }), 401
        
        # Get or create user from Firebase UID
        firebase_uid = decoded_token.get('uid')
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not registered. Please complete registration first.'
            }), 403
        
        if not user.is_active:
            return jsonify({
                'status': 'error',
                'message': 'Account is suspended'
            }), 403
        
        # Set user in request context
        g.current_user = user
        g.firebase_uid = firebase_uid
        
        return f(*args, **kwargs)
    
    return decorated_function


def admin_required(f):
    """
    Decorator to require admin access for an endpoint.
    Must be used after @auth_required.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        
        if not user or not user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Admin access required'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def optional_auth(f):
    """
    Decorator for optional authentication.
    Sets g.current_user if authenticated, but allows unauthenticated access.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from app.models import User
        
        g.current_user = None
        g.firebase_uid = None
        
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                id_token = parts[1]
                
                # Demo mode
                if id_token == 'demo-token':
                    demo_user = User.query.filter_by(upi_id='demo.user@upi').first()
                    if demo_user:
                        g.current_user = demo_user
                        g.firebase_uid = 'demo-uid'
                else:
                    decoded_token = verify_firebase_token(id_token)
                    if decoded_token:
                        firebase_uid = decoded_token.get('uid')
                        user = User.query.filter_by(firebase_uid=firebase_uid).first()
                        if user and user.is_active:
                            g.current_user = user
                            g.firebase_uid = firebase_uid
        
        return f(*args, **kwargs)
    
    return decorated_function
