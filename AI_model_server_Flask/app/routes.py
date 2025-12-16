"""
API Routes for SafePay AI Demo
Includes fraud detection prediction and recipient lookup endpoints.
"""

from flask import Blueprint, request, jsonify
from app.services import fraud_service
from app.data_service import data_service
from app.utils import success_response, error_response, validate_features
import numpy as np

main = Blueprint('main', __name__)


# ============================================================================
# Health Check
# ============================================================================

@main.route('/', methods=['GET'])
def home():
    return success_response(None, "Welcome to SafePay AI API - Exhibition Demo")


# ============================================================================
# Recipient Lookup Endpoints
# ============================================================================

@main.route('/recipient/<upi_id>', methods=['GET'])
def get_recipient(upi_id):
    """
    Get recipient profile by UPI ID.
    Used to display verification badge and risk indicators in the frontend.
    """
    try:
        user = data_service.get_user_by_upi(upi_id)
        
        if not user:
            return error_response(f"Recipient '{upi_id}' not found", 404)
        
        return success_response({
            "upi_id": user.get('upi_id'),
            "display_name": user.get('display_name'),
            "verification_status": user.get('verification_status'),
            "risk_category": user.get('risk_category'),
            "account_age_months": user.get('account_age_months'),
            "social_trust_score": user.get('social_trust_score'),
            "blacklist_status": user.get('blacklist_status'),
            "fraud_complaints_count": user.get('fraud_complaints_count'),
        }, "Recipient found")
        
    except Exception as e:
        return error_response(str(e), 500)


@main.route('/recipients/search', methods=['GET'])
def search_recipients():
    """
    Search recipients by UPI ID or name.
    Used for autocomplete in the frontend.
    """
    try:
        query = request.args.get('q', '')
        limit = min(int(request.args.get('limit', 10)), 50)
        
        results = data_service.search_users(query, limit)
        
        return success_response({
            "results": results,
            "count": len(results)
        }, f"Found {len(results)} matches")
        
    except Exception as e:
        return error_response(str(e), 500)


@main.route('/recipients/demo', methods=['GET'])
def get_demo_recipients():
    """
    Get recommended demo recipients for exhibition.
    These are pre-defined users with known fraud/safe profiles.
    """
    try:
        recipients = data_service.get_demo_recipients()
        
        return success_response({
            "recipients": recipients,
            "count": len(recipients)
        }, "Demo recipients loaded")
        
    except Exception as e:
        return error_response(str(e), 500)


@main.route('/recipients', methods=['GET'])
def get_all_recipients():
    """
    Get all recipients (paginated).
    """
    try:
        recipients = data_service.get_all_users()
        
        return success_response({
            "recipients": recipients[:100],  # Limit to 100 for performance
            "count": len(recipients)
        }, "Recipients loaded")
        
    except Exception as e:
        return error_response(str(e), 500)


# ============================================================================
# Fraud Detection Endpoints
# ============================================================================

@main.route('/predict', methods=['POST'])
def predict():
    """
    Original prediction endpoint.
    Expects a list of 22 pre-computed features.
    """
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


@main.route('/predict/transaction', methods=['POST'])
def predict_transaction():
    """
    Enhanced prediction endpoint for the demo.
    Accepts transaction details and constructs features dynamically.
    
    Request body:
    {
        "sender_upi_id": "demo.user@upi",
        "receiver_upi_id": "suspicious.account@upi",
        "transaction_amount": 50000,
        "transaction_hour": 2  // Optional, defaults to current hour
    }
    """
    try:
        data = request.get_json()
        if not data:
            return error_response("No input data provided")
        
        # Required fields
        sender_upi = data.get('sender_upi_id')
        receiver_upi = data.get('receiver_upi_id')
        amount = data.get('transaction_amount')
        
        if not all([sender_upi, receiver_upi, amount]):
            return error_response("Missing required fields: sender_upi_id, receiver_upi_id, transaction_amount")
        
        try:
            amount = float(amount)
        except (ValueError, TypeError):
            return error_response("Invalid transaction_amount: must be a number")
        
        # Get transaction hour (default to current)
        from datetime import datetime
        hour = data.get('transaction_hour', datetime.now().hour)
        
        # Lookup receiver profile
        receiver = data_service.get_user_by_upi(receiver_upi)
        if not receiver:
            return error_response(f"Receiver '{receiver_upi}' not found in database", 404)
        
        # Build features dynamically
        features = build_transaction_features(receiver, amount, hour)
        
        # Get prediction
        result = fraud_service.predict(features)
        prediction = result["prediction"]
        probability = result["probability"]
        
        fraud_prob = probability[0][1]
        is_fraud = prediction[0] == 1
        
        # Build response with risk factors
        risk_factors = []
        if receiver.get('blacklist_status', 0) == 1:
            risk_factors.append("Recipient is on blacklist")
        if receiver.get('verification_status') == 'suspicious':
            risk_factors.append("Recipient has suspicious verification status")
        if receiver.get('past_fraud_flags', 0) == 1:
            risk_factors.append("Recipient has past fraud flags")
        if receiver.get('fraud_complaints_count', 0) > 2:
            risk_factors.append(f"Recipient has {receiver.get('fraud_complaints_count')} fraud complaints")
        if hour >= 23 or hour <= 5:
            risk_factors.append("Transaction at high-risk hours (late night)")
        if amount > 50000:
            risk_factors.append("High transaction amount")
        if receiver.get('account_age_months', 12) < 3:
            risk_factors.append("Recipient account is recently created")
        if receiver.get('social_trust_score', 50) < 30:
            risk_factors.append("Recipient has low trust score")
        
        return success_response({
            "prediction": prediction,
            "is_fraud": is_fraud,
            "fraud_probability": fraud_prob,
            "risk_score": round(fraud_prob * 100, 2),
            "risk_level": get_risk_level(fraud_prob),
            "risk_factors": risk_factors if is_fraud else [],
            "receiver_info": {
                "upi_id": receiver.get('upi_id'),
                "display_name": receiver.get('display_name'),
                "verification_status": receiver.get('verification_status'),
                "risk_category": receiver.get('risk_category'),
            },
            "transaction": {
                "sender": sender_upi,
                "receiver": receiver_upi,
                "amount": amount,
                "hour": hour
            }
        }, "Fraud blocked" if is_fraud else "Transaction authorized")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(str(e), 500)


def get_risk_level(fraud_prob):
    """Convert fraud probability to human-readable risk level."""
    if fraud_prob >= 0.7:
        return "HIGH"
    elif fraud_prob >= 0.4:
        return "MEDIUM"
    else:
        return "LOW"


def build_transaction_features(receiver, amount, hour):
    """
    Build the 22 normalized features for the model.
    Uses DataService to fetch real historical stats from CSV/DB to ensure consistency.
    """
    
    # Normalization ranges from training data
    NORM_RANGES = {
        'transaction_amount': (0.005817, 4747.858107),
        'transaction_frequency': (0, 13),
        'behavioral_biometrics': (0.00004, 3.0),
        'time_since_last': (0.000168, 29.997497),
        'social_trust_score': (0.012724, 99.987487),
        'account_age': (0.000975, 4.999239),
        'normalized_amount': (0.000421, 1.256827),
        'context_anomalies': (0.000095, 3.997015),
        'fraud_complaints': (0, 5),
    }
    
    def normalize(value, min_val, max_val):
        if max_val == min_val:
            return 0.0
        return max(0, min(1, (value - min_val) / (max_val - min_val)))
    
    # --- DYNAMIC FEATURE EXTRACTION ---
    
    upi_id = receiver.get('upi_id')
    
    # 1. Frequency (Last 24h) from DataService
    # This includes both CSV history and potentially DB history if DataService was fully unified,
    # but currently DataService reads CSV. For the demo endpoint, CSV correctness is priority.
    transaction_frequency = data_service.get_transaction_frequency(upi_id, hours=24)
    
    # 2. Time Since Last Transaction
    time_since_last = data_service.get_time_since_last_transaction(upi_id)
    
    # 3. Profile Stats
    risk_cat = receiver.get('risk_category', 'medium')
    trust_score = float(receiver.get('social_trust_score', 50.0))
    past_fraud_flags = int(receiver.get('past_fraud_flags', 0))
    fraud_complaints = int(receiver.get('fraud_complaints_count', 0))
    geo_flag = receiver.get('geo_location_flag', 'normal')
    
    # 4. Synthesized/Session Features
    # (Same logic as api_routes.py for consistency)
    import random
    device_fingerprint = 0 
    vpn_usage = 0 
    behavioral_biometrics = random.uniform(0.1, 1.0)
    location_inconsistent = 1 if geo_flag == 'unusual' else 0
    context_anomalies = random.uniform(0, 1.0)
    
    # Normalize features
    norm_amount = normalize(amount, *NORM_RANGES['transaction_amount'])
    norm_frequency = normalize(transaction_frequency, *NORM_RANGES['transaction_frequency'])
    norm_blacklist = receiver.get('blacklist_status', 0)
    norm_device = device_fingerprint
    norm_vpn = vpn_usage
    norm_biometrics = normalize(behavioral_biometrics, *NORM_RANGES['behavioral_biometrics'])
    norm_time = normalize(time_since_last, *NORM_RANGES['time_since_last'])
    norm_trust = normalize(trust_score, *NORM_RANGES['social_trust_score'])
    
    account_age_years = receiver.get('account_age_months', 12) / 12.0
    norm_age = normalize(account_age_years, *NORM_RANGES['account_age'])
    
    norm_high_risk_time = 1 if (hour >= 23 or hour <= 5) else 0
    norm_past_fraud = 1 if past_fraud_flags > 0 else 0
    norm_location = location_inconsistent
    
    raw_norm_amount = min(amount / 5000, 1.26)
    norm_norm_amount = normalize(raw_norm_amount, *NORM_RANGES['normalized_amount'])
    
    norm_context = normalize(context_anomalies, *NORM_RANGES['context_anomalies'])
    norm_complaints = normalize(fraud_complaints, *NORM_RANGES['fraud_complaints'])
    norm_mismatch = receiver.get('merchant_category_mismatch', 0)
    norm_limit = 1 if amount > 100000 else 0
    norm_high_value = 1 if amount > 50000 else 0
    
    # One-hot encoded categorical features
    verification = receiver.get('verification_status', 'verified')
    is_suspicious = 1 if verification == 'suspicious' or verification == 'suspended' else 0
    is_verified = 1 if verification == 'verified' else 0
    
    is_geo_normal = 1 if geo_flag == 'normal' else 0
    is_geo_unusual = 1 if geo_flag == 'unusual' else 0
    
    # Build feature array (22 features)
    features = [
        norm_amount,
        norm_frequency,
        norm_blacklist,
        norm_device,
        norm_vpn,
        norm_biometrics,
        norm_time,
        norm_trust,
        norm_age,
        norm_high_risk_time,
        norm_past_fraud,
        norm_location,
        norm_norm_amount,
        norm_context,
        norm_complaints,
        norm_mismatch,
        norm_limit,
        norm_high_value,
        is_suspicious,
        is_verified,
        is_geo_normal,
        is_geo_unusual,
    ]
    
    return features
