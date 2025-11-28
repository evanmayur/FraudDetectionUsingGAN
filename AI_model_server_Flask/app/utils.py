from flask import jsonify

def success_response(data, message="Success", status_code=200):
    return jsonify({
        "status": "success",
        "message": message,
        "data": data
    }), status_code

def error_response(message, status_code=400):
    return jsonify({
        "status": "error",
        "message": message
    }), status_code

def validate_features(features):
    if not features or not isinstance(features, list):
        return False, "Features must be a list"
    if len(features) != 22:
        return False, f"Expected 22 features, got {len(features)}"
    return True, None
