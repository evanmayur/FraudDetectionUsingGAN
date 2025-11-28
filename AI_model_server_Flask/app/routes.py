from flask import Blueprint, request, jsonify
from app.services import fraud_service
from app.utils import success_response, error_response, validate_features

main = Blueprint('main', __name__)

@main.route('/', methods=['GET'])
def home():
    return success_response(None, "Welcome to SafePay AI API")

@main.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return error_response("No input data provided")

        features = data.get('features')
        is_valid, error_msg = validate_features(features)
        
        if not is_valid:
            return error_response(f"Invalid input: {error_msg}")

        result = fraud_service.predict(features)
        prediction = result["prediction"]
        probability = result["probability"]
        
        # Probability of class 1 (Fraud)
        fraud_prob = probability[0][1]
        
        return success_response({
            "prediction": prediction,
            "is_fraud": prediction[0] == 1,
            "fraud_probability": fraud_prob,
            "risk_score": round(fraud_prob * 100, 2)
        }, "Prediction successful")

    except Exception as e:
        return error_response(str(e), 500)
