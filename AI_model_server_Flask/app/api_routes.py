"""
API Routes for Production System
Handles authentication, transactions, user management, and admin operations.
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime, timedelta
from decimal import Decimal

from app.database import db
from app.models import User, Transaction, FraudAlert, UserRiskProfile
from app.models import VerificationStatus, TransactionStatus, AlertSeverity
from app.auth_middleware import auth_required, admin_required, optional_auth, get_current_user
from app.services import fraud_service
from app.data_service import data_service
from app.utils import success_response, error_response

api = Blueprint('api', __name__)


# ============================================================================
# Authentication Endpoints
# ============================================================================

@api.route('/auth/register', methods=['POST'])
def register():
    """
    Register a new user.
    Creates user account and generates UPI ID.
    """
    try:
        data = request.get_json()
        
        firebase_uid = data.get('firebase_uid')
        email = data.get('email')
        display_name = data.get('display_name', 'User')
        phone = data.get('phone_number')
        
        if not firebase_uid:
            return error_response("Firebase UID required")
        
        # Check if user already exists
        existing = User.query.filter_by(firebase_uid=firebase_uid).first()
        if existing:
            return success_response(existing.to_dict(include_private=True), "User already registered")
        
        # Generate unique UPI ID
        base_upi = display_name.lower().replace(' ', '.').replace('@', '')
        upi_id = f"{base_upi}@safepay"
        
        # Ensure uniqueness
        counter = 1
        while User.query.filter_by(upi_id=upi_id).first():
            upi_id = f"{base_upi}{counter}@safepay"
            counter += 1
        
        # Create user
        user = User(
            upi_id=upi_id,
            display_name=display_name,
            email=email,
            firebase_uid=firebase_uid,
            phone_number=phone,
            verification_status=VerificationStatus.PENDING,
            account_balance=Decimal('10000.00'),  # Demo starting balance
        )
        
        db.session.add(user)
        db.session.flush()
        
        # Create risk profile
        risk_profile = UserRiskProfile(
            user_id=user.id,
            trust_score=50.0,
        )
        db.session.add(risk_profile)
        
        db.session.commit()
        
        return success_response({
            'user': user.to_dict(include_private=True),
            'upi_id': upi_id,
        }, "Registration successful")
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@api.route('/auth/me', methods=['GET'])
@auth_required
def get_current_user_info():
    """Get current authenticated user's info."""
    user = get_current_user()
    return success_response({
        'user': user.to_dict(include_private=True),
        'risk_profile': user.risk_profile.to_dict() if user.risk_profile else None,
    }, "User retrieved")


# ============================================================================
# User Endpoints
# ============================================================================

@api.route('/users/<upi_id>', methods=['GET'])
@optional_auth
def get_user_by_upi(upi_id):
    """
    Lookup user by UPI ID.
    Returns public profile for recipient verification.
    First checks DB, then falls back to CSV via DataService.
    """
    # 1. Check DB first
    user = User.query.filter_by(upi_id=upi_id).first()
    
    if user:
        response = {
            'upi_id': user.upi_id,
            'display_name': user.display_name,
            'verification_status': user.verification_status.value if user.verification_status else None,
            'is_active': user.is_active,
            'source': 'db'
        }
        
        # Include risk info if authenticated
        if get_current_user() and user.risk_profile:
            response['risk_category'] = user.risk_profile.get_risk_category()
            
        return success_response(response, "User found in DB")
    
    # 2. Check CSV via DataService
    csv_user = data_service.get_user_by_upi(upi_id)
    if csv_user:
        return success_response({
            'upi_id': csv_user.get('upi_id'),
            'display_name': csv_user.get('display_name'),
            'verification_status': csv_user.get('verification_status', 'verified'),
            'is_active': True,
            'risk_category': csv_user.get('risk_category', 'medium'),
            'source': 'csv'
        }, "User found in Directory")

    return error_response(f"User '{upi_id}' not found", 404)


@api.route('/users/balance', methods=['GET'])
@auth_required
def get_balance():
    """Get current user's balance."""
    user = get_current_user()
    return success_response({
        'balance': 150000.0, # Always show 150,000 as per demo requirement
        'daily_limit': float(user.daily_limit),
        'daily_spent': float(user.daily_spent),
    }, "Balance retrieved")


@api.route('/users/profile', methods=['PUT'])
@auth_required
def update_profile():
    """Update current user's profile."""
    user = get_current_user()
    data = request.get_json()
    
    if 'display_name' in data:
        user.display_name = data['display_name']
    
    if 'phone_number' in data:
        user.phone_number = data['phone_number']
    
    db.session.commit()
    
    return success_response(user.to_dict(include_private=True), "Profile updated")


# ============================================================================
# Recipients Endpoints
# ============================================================================

@api.route('/recipients/demo', methods=['GET'])
def get_demo_recipients_api():
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


# ============================================================================
# Transaction Endpoints
# ============================================================================

@api.route('/transactions/send', methods=['POST'])
@auth_required
def send_transaction():
    """
    Process a new transaction with fraud detection.
    """
    try:
        data = request.get_json()
        sender = get_current_user()
        
        receiver_upi = data.get('receiver_upi_id')
        amount = data.get('amount')
        description = data.get('description', '')
        
        # Validate input
        if not receiver_upi or not amount:
            return error_response("Receiver UPI ID and amount required")
        
        try:
            amount = Decimal(str(amount))
        except:
            return error_response("Invalid amount")
        
        if amount <= 0:
            return error_response("Amount must be positive")
        
        # Check sender balance (Demo mode logic: Balance is effectively infinite/150k fixed)
        # if sender.account_balance < amount:
        #    return error_response("Insufficient balance")
        
        # Check daily limit (Disabled for demo mode)
        # if sender.daily_spent + amount > sender.daily_limit:
        #     return error_response("Daily transaction limit exceeded")
        
        # Get receiver
        receiver = User.query.filter_by(upi_id=receiver_upi).first()
        
        # If receiver not in DB, try to provision from CSV
        if not receiver:
            csv_user = data_service.get_user_by_upi(receiver_upi)
            if csv_user:
                # JIT Provisioning
                print(f"Provisioning CSV user: {receiver_upi}")
                
                # Map CSV status to valid DB Enum
                raw_status = csv_user.get('verification_status', 'pending').lower()
                if raw_status == 'suspicious':
                    status_enum = VerificationStatus.PENDING # Default to pending, risk handled by profile
                elif raw_status in ['verified', 'suspended', 'pending']:
                    status_enum = VerificationStatus(raw_status)
                else:
                    status_enum = VerificationStatus.PENDING
                
                receiver = User(
                    upi_id=csv_user['upi_id'],
                    display_name=csv_user.get('display_name', 'Unknown User'),
                    email=f"{csv_user['upi_id']}@placeholder.com", # Placeholder
                    verification_status=status_enum,
                    account_balance=Decimal('50000.00'), # Default balance for recipients
                )
                db.session.add(receiver)
                db.session.flush() # Get ID
                
                # Create risk profile from CSV data
                risk_profile = UserRiskProfile(
                    user_id=receiver.id,
                    trust_score=float(csv_user.get('social_trust_score', 50.0)),
                    fraud_flags=int(csv_user.get('past_fraud_flags', 0)),
                    fraud_complaints_received=int(csv_user.get('fraud_complaints_count', 0)),
                    geo_location_flag=csv_user.get('geo_location_flag', 'normal')
                )
                db.session.add(risk_profile)
                db.session.commit()
            else:
                return error_response(f"Receiver '{receiver_upi}' not found", 404)
        
        if receiver.id == sender.id:
            return error_response("Cannot send to yourself")
        
        if not receiver.is_active:
            return error_response("Receiver account is not active")
        
        # Create transaction
        transaction = Transaction(
            sender_id=sender.id,
            receiver_id=receiver.id,
            amount=amount,
            description=description,
            status=TransactionStatus.PENDING,
        )
        db.session.add(transaction)
        db.session.flush()
        
        # Perform fraud detection
        fraud_result = perform_fraud_check(sender, receiver, float(amount))
        
        transaction.fraud_score = fraud_result['fraud_probability']
        transaction.is_fraud = fraud_result['is_fraud']
        transaction.risk_factors = fraud_result.get('risk_factors', [])
        
        if fraud_result['is_fraud']:
            # Block the transaction
            transaction.status = TransactionStatus.BLOCKED
            transaction.failure_reason = "Fraud detected"
            
            # Create fraud alert
            alert = FraudAlert(
                transaction_id=transaction.id,
                alert_type='fraud_detected',
                severity=AlertSeverity.HIGH if fraud_result['fraud_probability'] > 0.7 else AlertSeverity.MEDIUM,
                description=f"Transaction blocked: {', '.join(fraud_result.get('risk_factors', [])[:3])}",
            )
            db.session.add(alert)
            
            # Increment receiver's fraud flags
            if receiver.risk_profile:
                receiver.risk_profile.fraud_flags += 1
                receiver.risk_profile.fraud_complaints_received += 1
            
        else:
            # Complete the transaction
            transaction.status = TransactionStatus.COMPLETED
            transaction.processed_at = datetime.utcnow()
            
            # Update balances
            # sender.account_balance -= amount # Don't deduct from sender in demo mode
            sender.daily_spent += amount
            receiver.account_balance += amount
            
            # Update risk profiles
            if sender.risk_profile:
                sender.risk_profile.total_transactions += 1
                sender.risk_profile.successful_transactions += 1
                sender.risk_profile.last_transaction_at = datetime.utcnow()
            
            if receiver.risk_profile:
                receiver.risk_profile.total_transactions += 1
                receiver.risk_profile.successful_transactions += 1
        
        db.session.commit()
        
        # Emit WebSocket event
        from app import socketio
        socketio.emit('transaction_update', {
            'transaction_ref': transaction.transaction_ref,
            'status': transaction.status.value,
            'is_fraud': transaction.is_fraud,
        })
        
        return success_response({
            'transaction_ref': transaction.transaction_ref,
            'status': transaction.status.value,
            'is_fraud': transaction.is_fraud,
            'fraud_probability': transaction.fraud_score,
            'risk_score': round(transaction.fraud_score * 100, 2) if transaction.fraud_score else 0,
            'risk_factors': transaction.risk_factors or [],
            'message': 'Transaction blocked - Potential fraud detected' if transaction.is_fraud else 'Transaction successful',
            'new_balance': float(sender.account_balance),
        }, "Transaction blocked" if transaction.is_fraud else "Transaction completed")
        
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return error_response(str(e), 500)


@api.route('/transactions/history', methods=['GET'])
@auth_required
def get_transaction_history():
    """Get paginated transaction history for current user."""
    user = get_current_user()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status')
    
    query = Transaction.query.filter(
        (Transaction.sender_id == user.id) | (Transaction.receiver_id == user.id)
    )
    
    if status_filter:
        try:
            status = TransactionStatus(status_filter)
            query = query.filter_by(status=status)
        except ValueError:
            pass
    
    query = query.order_by(Transaction.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    transactions = [t.to_dict() for t in pagination.items]
    
    # Mark direction (sent/received)
    for t in transactions:
        t['direction'] = 'sent' if t['sender_upi_id'] == user.upi_id else 'received'
    
    return success_response({
        'transactions': transactions,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    }, f"Found {len(transactions)} transactions")


@api.route('/transactions/<ref>', methods=['GET'])
@auth_required
def get_transaction_detail(ref):
    """Get single transaction details."""
    user = get_current_user()
    
    transaction = Transaction.query.filter_by(transaction_ref=ref).first()
    
    if not transaction:
        return error_response("Transaction not found", 404)
    
    # Check access
    if transaction.sender_id != user.id and transaction.receiver_id != user.id and not user.is_admin:
        return error_response("Access denied", 403)
    
    return success_response(transaction.to_dict(), "Transaction found")


# ============================================================================
# Admin Endpoints
# ============================================================================

@api.route('/admin/alerts', methods=['GET'])
@auth_required
@admin_required
def get_fraud_alerts():
    """Get pending fraud alerts for review."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    reviewed_filter = request.args.get('reviewed', 'false').lower() == 'true'
    
    query = FraudAlert.query
    
    if not reviewed_filter:
        query = query.filter_by(reviewed=False)
    
    query = query.order_by(FraudAlert.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return success_response({
        'alerts': [a.to_dict() for a in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
    }, f"Found {pagination.total} alerts")


@api.route('/admin/alerts/<int:alert_id>/review', methods=['PUT'])
@auth_required
@admin_required
def review_alert(alert_id):
    """Review a fraud alert."""
    admin = get_current_user()
    data = request.get_json()
    
    alert = FraudAlert.query.get(alert_id)
    if not alert:
        return error_response("Alert not found", 404)
    
    alert.reviewed = True
    alert.reviewed_by = admin.id
    alert.reviewed_at = datetime.utcnow()
    alert.review_notes = data.get('notes', '')
    alert.action_taken = data.get('action', 'reviewed')
    
    db.session.commit()
    
    return success_response(alert.to_dict(), "Alert reviewed")


@api.route('/admin/users/<int:user_id>/suspend', methods=['POST'])
@auth_required
@admin_required
def suspend_user(user_id):
    """Suspend a user account."""
    user = User.query.get(user_id)
    if not user:
        return error_response("User not found", 404)
    
    user.is_active = False
    user.verification_status = VerificationStatus.SUSPENDED
    
    if user.risk_profile:
        user.risk_profile.blacklist_status = True
    
    db.session.commit()
    
    return success_response({'user_id': user_id}, "User suspended")


@api.route('/admin/stats', methods=['GET'])
@auth_required
@admin_required
def get_admin_stats():
    """Get system-wide statistics."""
    total_users = User.query.count()
    total_transactions = Transaction.query.count()
    blocked_transactions = Transaction.query.filter_by(status=TransactionStatus.BLOCKED).count()
    pending_alerts = FraudAlert.query.filter_by(reviewed=False).count()
    
    return success_response({
        'total_users': total_users,
        'total_transactions': total_transactions,
        'blocked_transactions': blocked_transactions,
        'fraud_rate': round(blocked_transactions / max(total_transactions, 1) * 100, 2),
        'pending_alerts': pending_alerts,
    }, "Stats retrieved")


# ============================================================================
# Helper Functions
# ============================================================================

def perform_fraud_check(sender, receiver, amount):
    """
    Perform fraud detection using the ML model.
    Using DYNAMIC features derived from CSV historical data + DB real-time data.
    """
    
    # Get receiver's risk profile (from DB, which might be synced from CSV)
    risk_profile = receiver.risk_profile
    
    # Build features for the model
    hour = datetime.now().hour
    
    # Normalization ranges (from training data)
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
    
    # 1. Frequency (Last 24h)
    # Combine CSV history + DB recent transactions
    csv_freq = data_service.get_transaction_frequency(receiver.upi_id, hours=24)
    # Count DB transactions in last 24h
    cutoff = datetime.utcnow() - timedelta(hours=24)
    db_freq = Transaction.query.filter(
        (Transaction.sender_id == receiver.id) | (Transaction.receiver_id == receiver.id),
        Transaction.created_at >= cutoff
    ).count()
    transaction_frequency = csv_freq + db_freq
    
    # 2. Time Since Last Transaction
    # Min of CSV time and DB time
    csv_time_since = data_service.get_time_since_last_transaction(receiver.upi_id)
    
    last_db_tx = Transaction.query.filter(
        (Transaction.sender_id == receiver.id) | (Transaction.receiver_id == receiver.id)
    ).order_by(Transaction.created_at.desc()).first()
    
    if last_db_tx:
        db_time_since = (datetime.utcnow() - last_db_tx.created_at).total_seconds() / 3600.0
        time_since_last = min(csv_time_since, db_time_since)
    else:
        time_since_last = csv_time_since

    # 3. Social Trust Score & Risk Stats (From Profile/CSV)
    if risk_profile:
        trust_score = risk_profile.trust_score
        past_fraud_flags = risk_profile.fraud_flags
        fraud_complaints = risk_profile.fraud_complaints_received
        geo_flag = risk_profile.geo_location_flag
    else:
        # Fallback if profile missing (shouldn't happen with provisioning)
        trust_score = 50.0
        past_fraud_flags = 0
        fraud_complaints = 0
        geo_flag = 'normal'

    # 4. Synthesized/Session Features (Since we don't have full device tracking yet)
    # We use safe defaults or random noise for 'behavioral' features in absence of real sensor data
    # BUT we are strictly avoiding hardcoded 'scenario' logic.
    import random
    device_fingerprint = 0 # Assume same device unless flagged
    vpn_usage = 0 # Assume no VPN
    behavioral_biometrics = random.uniform(0.1, 1.0) # Normal range
    location_inconsistent = 1 if geo_flag == 'unusual' else 0
    context_anomalies = random.uniform(0, 1.0) # Low anomaly
    
    # Normalize features
    norm_amount = normalize(amount, *NORM_RANGES['transaction_amount'])
    norm_frequency = normalize(transaction_frequency, *NORM_RANGES['transaction_frequency'])
    norm_blacklist = 1 if (risk_profile and risk_profile.blacklist_status) else 0
    norm_device = device_fingerprint
    norm_vpn = vpn_usage
    norm_biometrics = normalize(behavioral_biometrics, *NORM_RANGES['behavioral_biometrics'])
    norm_time = normalize(time_since_last, *NORM_RANGES['time_since_last'])
    norm_trust = normalize(trust_score, *NORM_RANGES['social_trust_score'])
    
    # Account age
    if receiver.created_at:
        account_age_days = (datetime.utcnow() - receiver.created_at).days
        account_age_years = account_age_days / 365.0
    else:
        account_age_years = 1.0
    norm_age = normalize(account_age_years, *NORM_RANGES['account_age'])
    
    norm_high_risk_time = 1 if (hour >= 23 or hour <= 5) else 0
    norm_past_fraud = 1 if past_fraud_flags > 0 else 0
    norm_location = location_inconsistent
    
    raw_norm_amount = min(amount / 5000, 1.26)
    norm_norm_amount = normalize(raw_norm_amount, *NORM_RANGES['normalized_amount'])
    
    norm_context = normalize(context_anomalies, *NORM_RANGES['context_anomalies'])
    norm_complaints = normalize(fraud_complaints, *NORM_RANGES['fraud_complaints'])
    norm_mismatch = 0 # Merchant mismatch (not applicable for P2P yet)
    norm_limit = 1 if amount > 100000 else 0
    norm_high_value = 1 if amount > 50000 else 0
    
    # One-hot encoded categorical features
    verification = receiver.verification_status.value if receiver.verification_status else 'pending'
    is_suspicious = 1 if verification == 'suspended' or verification == 'suspicious' else 0
    is_verified = 1 if verification == 'verified' else 0
    
    is_geo_normal = 1 if geo_flag == 'normal' else 0
    is_geo_unusual = 1 if geo_flag == 'unusual' else 0
    
    # Build feature array (22 features)
    features = [
        norm_amount, norm_frequency, norm_blacklist, norm_device, norm_vpn,
        norm_biometrics, norm_time, norm_trust, norm_age, norm_high_risk_time,
        norm_past_fraud, norm_location, norm_norm_amount, norm_context,
        norm_complaints, norm_mismatch, norm_limit, norm_high_value,
        is_suspicious, is_verified, is_geo_normal, is_geo_unusual,
    ]
    
    # Get ML prediction
    result = fraud_service.predict(features)
    prediction = result["prediction"]
    probability = result["probability"]
    
    fraud_prob = probability[0][1] if len(probability[0]) > 1 else probability[0][0]
    
    # HYBRID FRAUD DETECTION:
    # 1. ML model prediction with LOWER threshold (0.3 instead of default 0.5)
    # 2. Rule-based boosters for severe risk factors
    
    FRAUD_THRESHOLD = 0.3  # Lower threshold to catch more potential fraud
    
    # Rule-based boosters - force fraud flag for severe conditions
    force_fraud = False
    if norm_blacklist:
        force_fraud = True  # Blacklisted recipients are always fraud
    if trust_score < 15:
        force_fraud = True  # Very low trust score
    if past_fraud_flags >= 3:
        force_fraud = True  # Multiple fraud flags
    if fraud_complaints >= 5:
        force_fraud = True  # Many complaints
    
    # Determine fraud status
    is_fraud = force_fraud or (fraud_prob >= FRAUD_THRESHOLD) or (prediction[0] == 1)
    
    # Build risk factors
    risk_factors = []
    if norm_blacklist:
        risk_factors.append("Recipient is on blacklist")
    if is_suspicious:
        risk_factors.append("Recipient has suspicious status")
    if norm_past_fraud:
        risk_factors.append("Recipient has past fraud flags")
    if fraud_complaints >= 2:
        risk_factors.append(f"Recipient has {fraud_complaints} fraud complaints")
    if norm_high_risk_time:
        risk_factors.append("Transaction at high-risk hours")
    if amount > 50000:
        risk_factors.append("High transaction amount")
    if trust_score < 30:
        risk_factors.append("Recipient has low trust score")
    if account_age_years < 0.25:
        risk_factors.append("Recipient account is recently created")
    if fraud_prob >= FRAUD_THRESHOLD:
        risk_factors.append(f"ML model flagged with {fraud_prob:.1%} probability")
    
    return {
        'is_fraud': is_fraud,
        'fraud_probability': fraud_prob,
        'risk_factors': risk_factors,
    }
