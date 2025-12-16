"""
Data Service for UPI Transaction Demo
Handles loading and querying synthetic data from CSV files.
"""

import pandas as pd
import numpy as np
import os
from flask import current_app

class DataService:
    def __init__(self):
        self.users_df = None
        self.transactions_df = None
        self._loaded = False
    
    def load_data(self):
        """Load CSV data on first access."""
        if self._loaded:
            return
        
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            
            users_path = os.path.join(base_dir, "upi_users.csv")
            transactions_path = os.path.join(base_dir, "upi_transactions.csv")
            
            if os.path.exists(users_path):
                self.users_df = pd.read_csv(users_path)
                print(f"✅ Loaded {len(self.users_df)} users from {users_path}")
            else:
                print(f"⚠️ Users file not found: {users_path}")
                self.users_df = pd.DataFrame()
            
            if os.path.exists(transactions_path):
                self.transactions_df = pd.read_csv(transactions_path)
                print(f"✅ Loaded {len(self.transactions_df)} transactions from {transactions_path}")
            else:
                print(f"⚠️ Transactions file not found: {transactions_path}")
                self.transactions_df = pd.DataFrame()
            
            self._loaded = True
            
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            self.users_df = pd.DataFrame()
            self.transactions_df = pd.DataFrame()
    
    def get_user_by_upi(self, upi_id):
        """
        Get user profile by UPI ID.
        Returns None if user not found.
        """
        self.load_data()
        
        if self.users_df.empty:
            return None
        
        matches = self.users_df[self.users_df['upi_id'] == upi_id]
        if len(matches) == 0:
            return None
        
        user = matches.iloc[0].to_dict()
        
        # Convert NaN to None for JSON serialization
        for key, value in user.items():
            if pd.isna(value):
                user[key] = None
        
        return user
    
    def get_all_users(self):
        """Get all users for frontend autocomplete."""
        self.load_data()
        
        if self.users_df.empty:
            return []
        
        return self.users_df[['upi_id', 'display_name', 'verification_status', 'risk_category']].to_dict('records')
    
    def get_transaction_history(self, upi_id, limit=10):
        """
        Get recent transaction history for a UPI ID.
        Returns transactions where the UPI ID is either sender or receiver.
        """
        self.load_data()
        
        if self.transactions_df.empty:
            return []
        
        # Filter transactions involving this UPI ID
        mask = (self.transactions_df['sender_upi_id'] == upi_id) | \
               (self.transactions_df['receiver_upi_id'] == upi_id)
        
        history = self.transactions_df[mask].sort_values('timestamp', ascending=False).head(limit)
        
        return history.to_dict('records')
    
    def search_users(self, query, limit=10):
        """Search users by UPI ID or display name."""
        self.load_data()
        
        if self.users_df.empty or not query:
            return []
        
        query_lower = query.lower()
        
        mask = self.users_df['upi_id'].str.lower().str.contains(query_lower, na=False) | \
               self.users_df['display_name'].str.lower().str.contains(query_lower, na=False)
        
        results = self.users_df[mask].head(limit)
        
        return results[['upi_id', 'display_name', 'verification_status', 'risk_category']].to_dict('records')
    
    def get_user_stats(self, upi_id):
        """
        Get aggregate statistics for a user from historical data.
        Returns dictionary with stats.
        """
        self.load_data()
        
        if self.transactions_df.empty:
            return {'avg_amount': 0, 'tx_count': 0}
        
        # Consider user as either sender or receiver
        txs = self.transactions_df[
            (self.transactions_df['sender_upi_id'] == upi_id) | 
            (self.transactions_df['receiver_upi_id'] == upi_id)
        ]
        
        if txs.empty:
            return {'avg_amount': 0, 'tx_count': 0}
            
        return {
            'avg_amount': txs['amount'].mean(),
            'tx_count': len(txs),
            'last_tx_amount': txs.iloc[0]['amount'] if not txs.empty else 0
        }

    def get_transaction_frequency(self, upi_id, hours=24):
        """
        Calculate number of transactions in the last N hours.
        """
        self.load_data()
        
        if self.transactions_df.empty:
            return 0
            
        # Filter for this user
        user_txs = self.transactions_df[
            (self.transactions_df['sender_upi_id'] == upi_id) | 
            (self.transactions_df['receiver_upi_id'] == upi_id)
        ].copy()
        
        if user_txs.empty:
            return 0
            
        # Convert timestamp to datetime if not already
        if not pd.api.types.is_datetime64_any_dtype(user_txs['timestamp']):
            user_txs['timestamp'] = pd.to_datetime(user_txs['timestamp'])
            
        cutoff_time = pd.Timestamp.now() - pd.Timedelta(hours=hours)
        recent_txs = user_txs[user_txs['timestamp'] >= cutoff_time]
        
        return len(recent_txs)

    def get_time_since_last_transaction(self, upi_id):
        """
        Get hours since the last transaction for this user.
        """
        self.load_data()
        
        if self.transactions_df.empty:
            return 24.0 # Default to 1 day if no history
            
        user_txs = self.transactions_df[
            (self.transactions_df['sender_upi_id'] == upi_id) | 
            (self.transactions_df['receiver_upi_id'] == upi_id)
        ].copy()
        
        if user_txs.empty:
            return 24.0
            
        if not pd.api.types.is_datetime64_any_dtype(user_txs['timestamp']):
            user_txs['timestamp'] = pd.to_datetime(user_txs['timestamp'])
            
        last_tx_time = user_txs['timestamp'].max()
        hours_diff = (pd.Timestamp.now() - last_tx_time).total_seconds() / 3600.0
        
        return max(0, hours_diff)
    
    def get_demo_recipients(self):
        """Get recommended demo recipients from CSV."""
        self.load_data()
        
        if self.users_df.empty:
            return []
            
        # Pick a mix of safe and risky users from CSV
        # Try to find specific known profiles first, fall back to random samples
        
        results = []
        
        # 1. High Risk User
        high_risk = self.users_df[self.users_df['risk_category'] == 'high'].head(2).to_dict('records')
        results.extend(high_risk)
        
        # 2. Medium Risk User
        medium_risk = self.users_df[self.users_df['risk_category'] == 'medium'].head(1).to_dict('records')
        results.extend(medium_risk)
        
        # 3. Safe Users
        safe_users = self.users_df[self.users_df['risk_category'] == 'safe'].head(2).to_dict('records')
        results.extend(safe_users)
        
        # Add a couple more random ones if we don't have enough
        if len(results) < 5:
             remaining = 5 - len(results)
             random_users = self.users_df.sample(min(remaining, len(self.users_df))).to_dict('records')
             results.extend(random_users)

        # Handle NaNs
        final_results = []
        seen_ids = set()
        
        for user in results:
            if user['upi_id'] in seen_ids:
                continue
            seen_ids.add(user['upi_id'])
            
            clean_user = user.copy()
            for key, value in clean_user.items():
                if pd.isna(value):
                    clean_user[key] = None
            final_results.append(clean_user)
        
        return final_results


# Singleton instance
data_service = DataService()
