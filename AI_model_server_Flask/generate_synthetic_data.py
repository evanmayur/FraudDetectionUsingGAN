"""
Synthetic UPI Transaction Data Generator (v2)
Generates realistic UPI transaction data for exhibition demo.
Uses the existing trained model to ensure label consistency.
IMPORTANT: Features are normalized to match training data format.
"""

import numpy as np
import pandas as pd
import pickle
import random
from datetime import datetime, timedelta
import os

# Configuration
NUM_USERS = 100
NUM_TRANSACTIONS = 10000
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Load the trained model
MODEL_PATH = os.path.join(OUTPUT_DIR, "best_rf_model (1).pkl")

# Normalization ranges from original dataset (from the notebook output)
# These are used to normalize raw values to 0-1 range
NORM_RANGES = {
    'transaction_amount': (0.005817, 4747.858107),  # min, max
    'transaction_frequency': (0, 13),
    'blacklist_status': (0, 1),
    'device_fingerprinting': (0, 1),
    'vpn_usage': (0, 1),
    'behavioral_biometrics': (0.00004, 3.0),
    'time_since_last': (0.000168, 29.997497),
    'social_trust_score': (0.012724, 99.987487),
    'account_age': (0.000975, 4.999239),
    'high_risk_time': (0, 1),
    'past_fraud_flags': (0, 1),
    'location_inconsistent': (0, 1),
    'normalized_amount': (0.000421, 1.256827),
    'context_anomalies': (0.000095, 3.997015),
    'fraud_complaints': (0, 5),
    'merchant_mismatch': (0, 1),
    'daily_limit_exceeded': (0, 1),
    'recent_high_value': (0, 1),
}

def normalize(value, min_val, max_val):
    """Normalize a value to 0-1 range using MinMaxScaler logic."""
    if max_val == min_val:
        return 0.0
    return (value - min_val) / (max_val - min_val)

def load_model():
    """Load the trained Random Forest model."""
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    print(f"✅ Model loaded from {MODEL_PATH}")
    return model

def generate_upi_id():
    """Generate a realistic-looking UPI ID."""
    first_names = [
        "amit", "priya", "rahul", "sneha", "vikram", "neha", "arjun", "kavya",
        "rohan", "ananya", "karan", "pooja", "aditya", "divya", "nikhil", "riya",
        "sanjay", "meera", "raj", "nisha", "deepak", "swati", "varun", "isha",
        "mohit", "anjali", "harsh", "kritika", "akash", "simran", "gaurav", "komal"
    ]
    last_names = [
        "sharma", "verma", "gupta", "singh", "patel", "kumar", "jain", "mehta",
        "agarwal", "reddy", "nair", "iyer", "rao", "mishra", "choudhary", "dubey"
    ]
    banks = ["upi", "paytm", "gpay", "phonepe", "ybl", "oksbi", "okaxis", "okicici"]
    
    first = random.choice(first_names)
    last = random.choice(last_names)
    bank = random.choice(banks)
    
    formats = [
        f"{first}.{last}@{bank}",
        f"{first}{last}@{bank}",
        f"{first}{random.randint(1, 99)}@{bank}",
        f"{first}.{last}{random.randint(1, 9)}@{bank}",
    ]
    return random.choice(formats)

def generate_users(num_users):
    """Generate user profiles with risk attributes."""
    users = []
    
    # Increased high-risk ratio for demo purposes
    risk_distribution = {
        'safe': 0.50,      # 50% safe users
        'medium': 0.25,    # 25% medium risk
        'high': 0.25       # 25% high risk (increased for demo)
    }
    
    for i in range(num_users):
        upi_id = generate_upi_id()
        
        roll = random.random()
        if roll < risk_distribution['safe']:
            risk_category = 'safe'
        elif roll < risk_distribution['safe'] + risk_distribution['medium']:
            risk_category = 'medium'
        else:
            risk_category = 'high'
        
        # Generate attributes based on risk category
        if risk_category == 'safe':
            user = {
                'upi_id': upi_id,
                'display_name': upi_id.split('@')[0].replace('.', ' ').title(),
                'verification_status': 'verified',
                'blacklist_status': 0,
                'past_fraud_flags': 0,
                'fraud_complaints_count': 0,
                'account_age_months': random.randint(12, 60),
                'social_trust_score': random.uniform(60, 100),
                'geo_location_flag': 'normal',
                'merchant_category_mismatch': 0,
                'risk_category': 'safe'
            }
        elif risk_category == 'medium':
            user = {
                'upi_id': upi_id,
                'display_name': upi_id.split('@')[0].replace('.', ' ').title(),
                'verification_status': random.choice(['verified', 'recently_registered']),
                'blacklist_status': 0,
                'past_fraud_flags': random.choice([0, 1]),
                'fraud_complaints_count': random.randint(0, 2),
                'account_age_months': random.randint(3, 24),
                'social_trust_score': random.uniform(30, 70),
                'geo_location_flag': random.choice(['normal', 'unusual']),
                'merchant_category_mismatch': random.choice([0, 1]),
                'risk_category': 'medium'
            }
        else:  # high risk
            user = {
                'upi_id': upi_id,
                'display_name': upi_id.split('@')[0].replace('.', ' ').title(),
                'verification_status': random.choice(['suspicious', 'recently_registered']),
                'blacklist_status': random.choice([0, 1]),
                'past_fraud_flags': 1,
                'fraud_complaints_count': random.randint(2, 5),
                'account_age_months': random.randint(0, 6),
                'social_trust_score': random.uniform(0, 40),
                'geo_location_flag': random.choice(['unusual', 'high-risk']),
                'merchant_category_mismatch': random.choice([0, 1]),
                'risk_category': 'high'
            }
        
        users.append(user)
    
    # Add known demo users for easy testing
    demo_users = [
        {
            'upi_id': 'demo.user@upi',
            'display_name': 'Demo User',
            'verification_status': 'verified',
            'blacklist_status': 0,
            'past_fraud_flags': 0,
            'fraud_complaints_count': 0,
            'account_age_months': 24,
            'social_trust_score': 90,
            'geo_location_flag': 'normal',
            'merchant_category_mismatch': 0,
            'risk_category': 'safe'
        },
        {
            'upi_id': 'trusted.merchant@upi',
            'display_name': 'Trusted Merchant',
            'verification_status': 'verified',
            'blacklist_status': 0,
            'past_fraud_flags': 0,
            'fraud_complaints_count': 0,
            'account_age_months': 48,
            'social_trust_score': 95,
            'geo_location_flag': 'normal',
            'merchant_category_mismatch': 0,
            'risk_category': 'safe'
        },
        {
            'upi_id': 'suspicious.account@upi',
            'display_name': 'Suspicious Account',
            'verification_status': 'suspicious',
            'blacklist_status': 1,
            'past_fraud_flags': 1,
            'fraud_complaints_count': 5,
            'account_age_months': 1,
            'social_trust_score': 5,
            'geo_location_flag': 'high-risk',
            'merchant_category_mismatch': 1,
            'risk_category': 'high'
        },
        {
            'upi_id': 'new.user@upi',
            'display_name': 'New User',
            'verification_status': 'recently_registered',
            'blacklist_status': 0,
            'past_fraud_flags': 0,
            'fraud_complaints_count': 0,
            'account_age_months': 1,
            'social_trust_score': 50,
            'geo_location_flag': 'normal',
            'merchant_category_mismatch': 0,
            'risk_category': 'medium'
        },
        {
            'upi_id': 'fraud.actor@upi',
            'display_name': 'Fraud Actor',
            'verification_status': 'suspicious',
            'blacklist_status': 1,
            'past_fraud_flags': 1,
            'fraud_complaints_count': 5,
            'account_age_months': 0,
            'social_trust_score': 2,
            'geo_location_flag': 'high-risk',
            'merchant_category_mismatch': 1,
            'risk_category': 'high'
        }
    ]
    
    users.extend(demo_users)
    return pd.DataFrame(users)

def generate_transaction_features_normalized(sender, receiver, amount, hour, users_df, force_fraud=False):
    """
    Generate the 22 normalized features required by the model.
    
    Model expects features in this order (after preprocessing):
    1. Transaction Amount (normalized)
    2. Transaction Frequency (normalized)
    3. Recipient Blacklist Status (normalized, 0 or 1)
    4. Device Fingerprinting (normalized, 0 or 1)
    5. VPN or Proxy Usage (normalized, 0 or 1)
    6. Behavioral Biometrics (normalized)
    7. Time Since Last Transaction (normalized)
    8. Social Trust Score (normalized)
    9. Account Age (normalized)
    10. High-Risk Transaction Times (normalized, 0 or 1)
    11. Past Fraudulent Behavior Flags (normalized, 0 or 1)
    12. Location-Inconsistent Transactions (normalized, 0 or 1)
    13. Normalized Transaction Amount (normalized)
    14. Transaction Context Anomalies (normalized)
    15. Fraud Complaints Count (normalized)
    16. Merchant Category Mismatch (normalized, 0 or 1)
    17. User Daily Limit Exceeded (normalized, 0 or 1)
    18. Recent High-Value Transaction Flags (normalized, 0 or 1)
    19. Recipient Verification Status_suspicious (bool -> 0/1)
    20. Recipient Verification Status_verified (bool -> 0/1)
    21. Geo-Location Flags_normal (bool -> 0/1)
    22. Geo-Location Flags_unusual (bool -> 0/1)
    """
    
    # Get receiver info from users database
    receiver_info = users_df[users_df['upi_id'] == receiver]
    if len(receiver_info) == 0:
        receiver_info = {
            'verification_status': 'verified',
            'blacklist_status': 0,
            'geo_location_flag': 'normal',
            'social_trust_score': 50,
            'account_age_months': 12,
            'past_fraud_flags': 0,
            'fraud_complaints_count': 0,
            'merchant_category_mismatch': 0,
            'risk_category': 'medium'
        }
    else:
        receiver_info = receiver_info.iloc[0].to_dict()
    
    risk_cat = receiver_info.get('risk_category', 'medium')
    
    # For demo: inject additional risk factors when force_fraud=True
    if force_fraud or risk_cat == 'high':
        # High-risk transaction patterns
        transaction_frequency = random.randint(0, 2)  # Low frequency
        device_fingerprint = random.choice([0, 0, 1])  # Higher chance of mismatch
        vpn_usage = random.choice([0, 1])  # 50% VPN
        behavioral_biometrics = random.uniform(0.5, 3.0)  # Higher values
        time_since_last = random.uniform(0, 5)  # Very recent
        location_inconsistent = random.choice([0, 0, 1])  # Higher chance
        context_anomalies = random.uniform(1.0, 4.0)  # High anomalies
        daily_limit_exceeded = 1 if amount > 50000 else 0
        recent_high_value = 1 if amount > 10000 else 0
    else:
        # Normal transaction patterns
        transaction_frequency = random.randint(2, 10)
        device_fingerprint = 0
        vpn_usage = random.choice([0, 0, 0, 0, 0, 0, 0, 0, 0, 1])  # 10%
        behavioral_biometrics = random.uniform(0, 1.5)
        time_since_last = random.uniform(5, 30)
        location_inconsistent = 0
        context_anomalies = random.uniform(0, 1.5)
        daily_limit_exceeded = 0
        recent_high_value = 0
    
    # Raw values
    raw_amount = amount
    raw_frequency = transaction_frequency
    raw_blacklist = receiver_info.get('blacklist_status', 0)
    raw_device = device_fingerprint
    raw_vpn = vpn_usage
    raw_biometrics = behavioral_biometrics
    raw_time_since = time_since_last
    raw_trust = receiver_info.get('social_trust_score', 50)
    raw_age = receiver_info.get('account_age_months', 12) / 12  # Convert to years
    raw_high_risk_time = 1 if (hour >= 23 or hour <= 5) else 0
    raw_past_fraud = receiver_info.get('past_fraud_flags', 0)
    raw_location = location_inconsistent
    raw_norm_amount = min(amount / 5000, 1.26)
    raw_context = context_anomalies
    raw_complaints = receiver_info.get('fraud_complaints_count', 0)
    raw_mismatch = receiver_info.get('merchant_category_mismatch', 0)
    raw_limit = daily_limit_exceeded
    raw_high_value = recent_high_value
    
    # Normalize numerical features
    norm_amount = normalize(raw_amount, *NORM_RANGES['transaction_amount'])
    norm_frequency = normalize(raw_frequency, *NORM_RANGES['transaction_frequency'])
    norm_blacklist = raw_blacklist  # Already 0 or 1
    norm_device = raw_device  # Already 0 or 1
    norm_vpn = raw_vpn  # Already 0 or 1
    norm_biometrics = normalize(raw_biometrics, *NORM_RANGES['behavioral_biometrics'])
    norm_time = normalize(raw_time_since, *NORM_RANGES['time_since_last'])
    norm_trust = normalize(raw_trust, *NORM_RANGES['social_trust_score'])
    norm_age = normalize(raw_age, *NORM_RANGES['account_age'])
    norm_high_risk_time = raw_high_risk_time  # Already 0 or 1
    norm_past_fraud = raw_past_fraud  # Already 0 or 1
    norm_location = raw_location  # Already 0 or 1
    norm_norm_amount = normalize(raw_norm_amount, *NORM_RANGES['normalized_amount'])
    norm_context = normalize(raw_context, *NORM_RANGES['context_anomalies'])
    norm_complaints = normalize(raw_complaints, *NORM_RANGES['fraud_complaints'])
    norm_mismatch = raw_mismatch  # Already 0 or 1
    norm_limit = raw_limit  # Already 0 or 1
    norm_high_value = raw_high_value  # Already 0 or 1
    
    # One-hot encoded categorical features (4 columns)
    # Verification Status: suspicious, verified (drop_first removes 'recently_registered')
    verification = receiver_info.get('verification_status', 'verified')
    is_suspicious = 1 if verification == 'suspicious' else 0
    is_verified = 1 if verification == 'verified' else 0
    
    # Geo-Location: normal, unusual (drop_first removes 'high-risk')
    geo = receiver_info.get('geo_location_flag', 'normal')
    is_geo_normal = 1 if geo == 'normal' else 0
    is_geo_unusual = 1 if geo == 'unusual' else 0
    
    # Build the 22-feature array
    features = [
        norm_amount,           # 1. Transaction Amount
        norm_frequency,        # 2. Transaction Frequency
        norm_blacklist,        # 3. Recipient Blacklist Status
        norm_device,           # 4. Device Fingerprinting
        norm_vpn,              # 5. VPN or Proxy Usage
        norm_biometrics,       # 6. Behavioral Biometrics
        norm_time,             # 7. Time Since Last Transaction
        norm_trust,            # 8. Social Trust Score
        norm_age,              # 9. Account Age
        norm_high_risk_time,   # 10. High-Risk Transaction Times
        norm_past_fraud,       # 11. Past Fraudulent Behavior Flags
        norm_location,         # 12. Location-Inconsistent Transactions
        norm_norm_amount,      # 13. Normalized Transaction Amount
        norm_context,          # 14. Transaction Context Anomalies
        norm_complaints,       # 15. Fraud Complaints Count
        norm_mismatch,         # 16. Merchant Category Mismatch
        norm_limit,            # 17. User Daily Limit Exceeded
        norm_high_value,       # 18. Recent High-Value Transaction Flags
        is_suspicious,         # 19. Recipient Verification Status_suspicious
        is_verified,           # 20. Recipient Verification Status_verified
        is_geo_normal,         # 21. Geo-Location Flags_normal
        is_geo_unusual,        # 22. Geo-Location Flags_unusual
    ]
    
    # Store raw values for CSV output
    raw_features = {
        'amount': raw_amount,
        'frequency': raw_frequency,
        'blacklist': raw_blacklist,
        'device': raw_device,
        'vpn': raw_vpn,
        'biometrics': raw_biometrics,
        'time_since': raw_time_since,
        'trust': raw_trust,
        'age': raw_age,
        'high_risk_time': raw_high_risk_time,
        'past_fraud': raw_past_fraud,
        'location': raw_location,
        'norm_amount': raw_norm_amount,
        'context': raw_context,
        'complaints': raw_complaints,
        'mismatch': raw_mismatch,
        'limit': raw_limit,
        'high_value': raw_high_value,
        'verification_status': verification,
        'geo_flag': geo,
    }
    
    return features, raw_features

def generate_transactions(users_df, model, num_transactions):
    """Generate transaction records with model-predicted labels."""
    transactions = []
    user_ids = users_df['upi_id'].tolist()
    
    base_date = datetime.now()
    
    for i in range(num_transactions):
        # Select sender and receiver
        sender = random.choice(user_ids)
        receiver = random.choice([u for u in user_ids if u != sender])
        
        # Get receiver risk category
        receiver_info = users_df[users_df['upi_id'] == receiver].iloc[0]
        risk_cat = receiver_info['risk_category']
        
        # Generate amount based on risk category
        if risk_cat == 'high':
            # High risk: more large transactions
            amount = random.choice([
                random.uniform(50, 500),      # 20% small
                random.uniform(500, 5000),    # 30% medium  
                random.uniform(5000, 50000),  # 30% large
                random.uniform(50000, 200000),# 20% very large
            ])
        elif risk_cat == 'medium':
            amount = random.choice([
                random.uniform(100, 1000),    # 40% small
                random.uniform(1000, 10000),  # 40% medium
                random.uniform(10000, 50000), # 20% large
            ])
        else:
            # Safe: typical amounts
            amount = random.choice([
                random.uniform(50, 500),      # 50% small
                random.uniform(500, 2000),    # 35% medium
                random.uniform(2000, 5000),   # 15% larger
            ])
        
        amount = round(amount, 2)
        
        # Generate timestamp
        days_ago = random.randint(0, 90)
        # Bias high-risk transactions to late night hours
        if risk_cat == 'high':
            hour = random.choice([random.randint(0, 5), random.randint(22, 23), random.randint(0, 23)])
        else:
            hour = random.randint(6, 22)
        minute = random.randint(0, 59)
        timestamp = base_date - timedelta(days=days_ago, hours=hour, minutes=minute)
        
        # Generate normalized features
        force_fraud = (risk_cat == 'high' and random.random() < 0.7)  # 70% of high-risk should be fraud
        features, raw_features = generate_transaction_features_normalized(
            sender, receiver, amount, hour, users_df, force_fraud
        )
        
        # Get model prediction
        try:
            features_array = np.array(features).reshape(1, -1)
            prediction = model.predict(features_array)[0]
            probability = model.predict_proba(features_array)[0]
            fraud_prob = probability[1] if len(probability) > 1 else probability[0]
        except Exception as e:
            print(f"Warning: Prediction failed for transaction {i}: {e}")
            prediction = 0
            fraud_prob = 0.0
        
        transaction = {
            'transaction_id': f'TXN{str(i+1).zfill(6)}',
            'sender_upi_id': sender,
            'receiver_upi_id': receiver,
            'amount': amount,
            'timestamp': timestamp.isoformat(),
            'hour': hour,
            'receiver_risk_category': risk_cat,
            # Raw feature values for display
            'raw_amount': raw_features['amount'],
            'raw_frequency': raw_features['frequency'],
            'raw_verification': raw_features['verification_status'],
            'raw_blacklist': raw_features['blacklist'],
            'raw_geo': raw_features['geo_flag'],
            'raw_trust_score': raw_features['trust'],
            'raw_account_age_years': raw_features['age'],
            'raw_fraud_complaints': raw_features['complaints'],
            'raw_past_fraud': raw_features['past_fraud'],
            # Normalized features (what the model sees)
            'norm_f1_amount': features[0],
            'norm_f2_frequency': features[1],
            'norm_f3_blacklist': features[2],
            'norm_f4_device': features[3],
            'norm_f5_vpn': features[4],
            'norm_f6_biometrics': features[5],
            'norm_f7_time_since': features[6],
            'norm_f8_trust': features[7],
            'norm_f9_age': features[8],
            'norm_f10_risk_time': features[9],
            'norm_f11_past_fraud': features[10],
            'norm_f12_location': features[11],
            'norm_f13_norm_amount': features[12],
            'norm_f14_context': features[13],
            'norm_f15_complaints': features[14],
            'norm_f16_mismatch': features[15],
            'norm_f17_limit': features[16],
            'norm_f18_high_value': features[17],
            'norm_f19_suspicious': features[18],
            'norm_f20_verified': features[19],
            'norm_f21_geo_normal': features[20],
            'norm_f22_geo_unusual': features[21],
            'fraud_probability': round(fraud_prob, 4),
            'label': int(prediction)
        }
        
        transactions.append(transaction)
        
        if (i + 1) % 1000 == 0:
            print(f"Generated {i + 1}/{num_transactions} transactions...")
    
    return pd.DataFrame(transactions)

def main():
    print("=" * 60)
    print("🚀 UPI Transaction Data Generator (v2 - Normalized)")
    print("=" * 60)
    
    # Load model
    model = load_model()
    
    # Generate users
    print("\n📋 Generating user profiles...")
    users_df = generate_users(NUM_USERS)
    print(f"✅ Generated {len(users_df)} users")
    print(f"   - Safe: {len(users_df[users_df['risk_category'] == 'safe'])}")
    print(f"   - Medium: {len(users_df[users_df['risk_category'] == 'medium'])}")
    print(f"   - High: {len(users_df[users_df['risk_category'] == 'high'])}")
    
    # Save users
    users_path = os.path.join(OUTPUT_DIR, "upi_users.csv")
    users_df.to_csv(users_path, index=False)
    print(f"💾 Saved users to {users_path}")
    
    # Generate transactions
    print(f"\n💳 Generating {NUM_TRANSACTIONS} transactions...")
    transactions_df = generate_transactions(users_df, model, NUM_TRANSACTIONS)
    
    # Statistics
    fraud_count = transactions_df['label'].sum()
    normal_count = len(transactions_df) - fraud_count
    print(f"\n📊 Transaction Statistics:")
    print(f"   - Total: {len(transactions_df)}")
    print(f"   - Normal (0): {normal_count} ({100*normal_count/len(transactions_df):.1f}%)")
    print(f"   - Fraud (1): {fraud_count} ({100*fraud_count/len(transactions_df):.1f}%)")
    
    # Show sample fraud cases
    fraud_samples = transactions_df[transactions_df['label'] == 1].head(5)
    print(f"\n🔍 Sample fraud transactions:")
    for _, row in fraud_samples.iterrows():
        print(f"   - {row['transaction_id']}: ₹{row['amount']:.2f} to {row['receiver_upi_id']} "
              f"(prob: {row['fraud_probability']:.2%})")
    
    # Save transactions
    transactions_path = os.path.join(OUTPUT_DIR, "upi_transactions.csv")
    transactions_df.to_csv(transactions_path, index=False)
    print(f"\n💾 Saved transactions to {transactions_path}")
    
    print("\n" + "=" * 60)
    print("✅ Data generation complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
