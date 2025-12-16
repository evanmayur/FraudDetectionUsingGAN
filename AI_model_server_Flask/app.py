"""
SafePay AI Backend - Main Entry Point
Runs the Flask application using the create_app factory.
"""

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    # Run with SocketIO for real-time features
    socketio.run(app, debug=True, port=5001, allow_unsafe_werkzeug=True)
