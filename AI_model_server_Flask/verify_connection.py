
import sys
import os
import json
from decimal import Decimal

# Add path
sys.path.append(os.path.abspath('/Users/evanhabibani/Projects/upi/FraudDetectionUsingGAN/AI_model_server_Flask'))

from app import create_app
from app.data_service import data_service
from app.models import User, UserRiskProfile, VerificationStatus
from app.api_routes import perform_fraud_check
from app.routes import build_transaction_features

app = create_app()

def verify_csv_loading():
    print("\n--- Verifying CSV Loading ---")
    data_service.load_data()
    print(f"Users loaded: {len(data_service.users_df)}")
    print(f"Transactions loaded: {len(data_service.transactions_df)}")
    
    if len(data_service.users_df) > 0 and len(data_service.transactions_df) > 0:
        print("✅ CSV Loading Successful")
    else:
        print("❌ CSV Loading Failed")

def verify_fraud_check():
    print("\n--- Verifying Fraud Check Logic ---")
    
    with app.app_context():
        # 1. Get a high risk user from CSV
        high_risk = data_service.users_df[data_service.users_df['risk_category'] == 'high'].iloc[0]
        print(f"Testing with High Risk User: {high_risk['upi_id']}")
        
        # Mock objects for perform_fraud_check
        sender = User(id=1, upi_id='sender@test', account_balance=Decimal('100000'))
        
        # Map status for mock
        raw_status = high_risk['verification_status']
        if raw_status == 'suspicious':
             status = VerificationStatus.PENDING
        else:
             status = VerificationStatus(raw_status)

        receiver = User(
            id=2, 
            upi_id=high_risk['upi_id'],
            verification_status=status,
            created_at=None # Simulate new
        )
        receiver.risk_profile = UserRiskProfile(
            trust_score=float(high_risk['social_trust_score']),
            fraud_flags=int(high_risk['past_fraud_flags']),
            fraud_complaints_received=int(high_risk['fraud_complaints_count']),
            geo_location_flag=high_risk['geo_location_flag']
        )
        
        # Test High Value Transaction
        amount = 60000.0 # High value
        print(f"Simulating transaction amount: {amount}")
        
        result = perform_fraud_check(sender, receiver, amount)
        print("Result:", json.dumps(result, indent=2))
        
        if result['fraud_probability'] > 0.5: # Should be high prob
            print("✅ Correctly flagged as high risk/fraud")
        else:
            print("⚠️ Warning: Model prediction is low for high risk user (might be expected depending on model)")
            
        if "High transaction amount" in result['risk_factors']:
             print("✅ 'High transaction amount' factor detected")
             
        # Test Safe Scenario
        safe_user = data_service.users_df[data_service.users_df['risk_category'] == 'safe'].iloc[0]
        print(f"\nTesting with Safe User: {safe_user['upi_id']}")
        
        receiver_safe = User(
            id=3,
            upi_id=safe_user['upi_id'],
             verification_status=VerificationStatus(safe_user['verification_status'])
        )
        receiver_safe.risk_profile = UserRiskProfile(
             trust_score=float(safe_user['social_trust_score']),
              fraud_flags=0,
              fraud_complaints_received=0,
              geo_location_flag='normal'
        )
        
        result_safe = perform_fraud_check(sender, receiver_safe, 500.0)
        print("Result Safe:", json.dumps(result_safe, indent=2))
        
        if result_safe['fraud_probability'] < 0.5:
             print("✅ Correctly flagged as safe")
        else:
             print(f"⚠️ Warning: Safe transaction flagged as fraud ({result_safe['fraud_probability']})")

if __name__ == "__main__":
    verify_csv_loading()
    verify_fraud_check()
