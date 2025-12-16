"""
SQLAlchemy Models for SafePay AI Production System
Defines User, Transaction, FraudAlert, and UserRiskProfile tables.
"""

from datetime import datetime
from app.database import db
import enum
import uuid


class VerificationStatus(enum.Enum):
    PENDING = 'pending'
    VERIFIED = 'verified'
    SUSPENDED = 'suspended'


class TransactionStatus(enum.Enum):
    PENDING = 'pending'
    COMPLETED = 'completed'
    BLOCKED = 'blocked'
    FAILED = 'failed'


class AlertSeverity(enum.Enum):
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'


class User(db.Model):
    """User account model."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    upi_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=True)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    
    # Account status
    verification_status = db.Column(
        db.Enum(VerificationStatus), 
        default=VerificationStatus.PENDING
    )
    is_active = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Financial
    account_balance = db.Column(db.Numeric(15, 2), default=10000.00)  # Demo balance
    daily_limit = db.Column(db.Numeric(15, 2), default=100000.00)
    daily_spent = db.Column(db.Numeric(15, 2), default=0.00)
    last_limit_reset = db.Column(db.Date, nullable=True)
    
    # PIN (hashed)
    pin_hash = db.Column(db.String(256), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    sent_transactions = db.relationship('Transaction', foreign_keys='Transaction.sender_id', backref='sender', lazy='dynamic')
    received_transactions = db.relationship('Transaction', foreign_keys='Transaction.receiver_id', backref='receiver', lazy='dynamic')
    risk_profile = db.relationship('UserRiskProfile', backref='user', uselist=False, lazy='joined')
    
    def __repr__(self):
        return f'<User {self.upi_id}>'
    
    def to_dict(self, include_private=False):
        """Convert to dictionary for API responses."""
        data = {
            'id': self.id,
            'upi_id': self.upi_id,
            'display_name': self.display_name,
            'verification_status': self.verification_status.value if self.verification_status else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_private:
            data.update({
                'email': self.email,
                'phone_number': self.phone_number,
                'account_balance': float(self.account_balance) if self.account_balance else 0,
                'daily_limit': float(self.daily_limit) if self.daily_limit else 0,
                'daily_spent': float(self.daily_spent) if self.daily_spent else 0,
                'is_active': self.is_active,
                'is_admin': self.is_admin,
            })
        
        return data


class Transaction(db.Model):
    """Transaction record model."""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_ref = db.Column(db.String(32), unique=True, nullable=False, index=True)
    
    # Parties
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Transaction details
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(3), default='INR')
    description = db.Column(db.String(255), nullable=True)
    
    # Status
    status = db.Column(db.Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Fraud detection results
    fraud_score = db.Column(db.Float, nullable=True)
    is_fraud = db.Column(db.Boolean, default=False)
    risk_factors = db.Column(db.JSON, nullable=True)  # Store as JSON array
    
    # Processing info
    processed_at = db.Column(db.DateTime, nullable=True)
    failure_reason = db.Column(db.String(255), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.transaction_ref:
            # Generate unique transaction reference
            self.transaction_ref = f"TXN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
    
    def __repr__(self):
        return f'<Transaction {self.transaction_ref}>'
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            'transaction_ref': self.transaction_ref,
            'sender_upi_id': self.sender.upi_id if self.sender else None,
            'receiver_upi_id': self.receiver.upi_id if self.receiver else None,
            'amount': float(self.amount) if self.amount else 0,
            'currency': self.currency,
            'description': self.description,
            'status': self.status.value if self.status else None,
            'fraud_score': self.fraud_score,
            'is_fraud': self.is_fraud,
            'risk_factors': self.risk_factors or [],
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class FraudAlert(db.Model):
    """Fraud alert for admin review."""
    __tablename__ = 'fraud_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)
    
    # Alert details
    alert_type = db.Column(db.String(50), nullable=False)  # e.g., 'high_risk_recipient', 'unusual_amount'
    severity = db.Column(db.Enum(AlertSeverity), default=AlertSeverity.MEDIUM)
    description = db.Column(db.Text, nullable=True)
    
    # Review status
    reviewed = db.Column(db.Boolean, default=False)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text, nullable=True)
    
    # Action taken
    action_taken = db.Column(db.String(50), nullable=True)  # e.g., 'approved', 'rejected', 'escalated'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    transaction = db.relationship('Transaction', backref='alerts')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    
    def __repr__(self):
        return f'<FraudAlert {self.id} - {self.alert_type}>'
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            'id': self.id,
            'transaction_ref': self.transaction.transaction_ref if self.transaction else None,
            'alert_type': self.alert_type,
            'severity': self.severity.value if self.severity else None,
            'description': self.description,
            'reviewed': self.reviewed,
            'reviewed_by': self.reviewer.display_name if self.reviewer else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'action_taken': self.action_taken,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class UserRiskProfile(db.Model):
    """User risk profile for fraud detection."""
    __tablename__ = 'user_risk_profiles'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    
    # Risk metrics
    trust_score = db.Column(db.Float, default=50.0)  # 0-100
    total_transactions = db.Column(db.Integer, default=0)
    successful_transactions = db.Column(db.Integer, default=0)
    failed_transactions = db.Column(db.Integer, default=0)
    blocked_transactions = db.Column(db.Integer, default=0)
    
    # Flags
    fraud_flags = db.Column(db.Integer, default=0)
    fraud_complaints_received = db.Column(db.Integer, default=0)
    blacklist_status = db.Column(db.Boolean, default=False)
    
    # Geo and device info
    geo_location_flag = db.Column(db.String(20), default='normal')  # normal, unusual, high-risk
    known_devices = db.Column(db.JSON, default=list)  # List of known device fingerprints
    
    # Behavioral
    avg_transaction_amount = db.Column(db.Numeric(15, 2), default=0)
    max_transaction_amount = db.Column(db.Numeric(15, 2), default=0)
    
    # Timestamps
    last_transaction_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserRiskProfile user_id={self.user_id}>'
    
    def to_dict(self):
        """Convert to dictionary for API responses."""
        return {
            'user_id': self.user_id,
            'trust_score': self.trust_score,
            'total_transactions': self.total_transactions,
            'successful_transactions': self.successful_transactions,
            'blocked_transactions': self.blocked_transactions,
            'fraud_flags': self.fraud_flags,
            'blacklist_status': self.blacklist_status,
            'geo_location_flag': self.geo_location_flag,
            'avg_transaction_amount': float(self.avg_transaction_amount) if self.avg_transaction_amount else 0,
            'last_transaction_at': self.last_transaction_at.isoformat() if self.last_transaction_at else None,
        }
    
    def get_risk_category(self):
        """Determine risk category based on metrics."""
        if self.blacklist_status or self.fraud_flags >= 3:
            return 'high'
        elif self.trust_score < 30 or self.fraud_complaints_received >= 2:
            return 'high'
        elif self.trust_score < 60:
            return 'medium'
        else:
            return 'safe'
