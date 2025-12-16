# SafePay AI - Exhibition Demo Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd FraudDetectionUsingGAN/AI_model_server_Flask

# Create virtual environment
python3 -m venv new_venv
source new_venv/bin/activate

# Install dependencies
pip install flask flask-cors pandas numpy scikit-learn

# Start the backend server
python run.py
```

Backend runs on: `http://localhost:5001`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd FraudDetectionUsingGAN/fraudAI_Frontend_React

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## Demo Access

**Live Demo Page**: `http://localhost:5173/demo`

---

## Demo Flow

### Step 1: Select Recipient
Choose from 5 pre-configured demo profiles:
| Profile | Risk Level | Expected Result |
|---------|------------|-----------------|
| Demo User | Safe (Green) | ✅ Approved |
| Trusted Merchant | Safe (Green) | ✅ Approved |
| New User | Medium (Yellow) | Varies by amount |
| Suspicious Account | High (Red) | ❌ Blocked |
| Fraud Actor | High (Red) | ❌ Blocked |

### Step 2: Enter Amount
- Use quick buttons: ₹500, ₹2,000, ₹10,000, ₹50,000, ₹100,000
- Higher amounts to high-risk recipients increase fraud probability

### Step 3: View AI Analysis
- **Green checkmark** = Transaction Approved (Low Risk)
- **Red X** = Transaction Blocked (Fraud Detected)
- Risk factors explaining AI decision displayed for fraud cases

---

## Demo Scenarios

### Scenario 1: Safe Transaction
1. Select "Trusted Merchant" (verified, green)
2. Enter ₹500
3. Result: ✅ **Approved** - 0% risk score

### Scenario 2: Fraud Detection
1. Select "Fraud Actor" (suspicious, red)
2. Enter ₹100,000
3. Result: ❌ **Blocked** - ~60% risk score
4. Risk factors shown:
   - Recipient is on blacklist
   - Suspicious verification status
   - Past fraud flags
   - High fraud complaints count
   - High transaction amount
   - Recently created account
   - Low trust score

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recipients/demo` | GET | Get demo profiles |
| `/recipient/<upi_id>` | GET | Lookup user profile |
| `/predict/transaction` | POST | Analyze transaction |

### Example API Call
```bash
curl -X POST http://localhost:5001/predict/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "sender_upi_id": "demo.user@upi",
    "receiver_upi_id": "fraud.actor@upi",
    "transaction_amount": 75000
  }'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not starting | Ensure Python venv is activated |
| Model loading error | Check `best_rf_model (1).pkl` exists |
| Frontend can't connect | Verify backend is running on port 5001 |
| CORS errors | Backend has CORS enabled by default |

---

## Technical Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Flask + Python + scikit-learn
- **ML Model**: Random Forest (trained with GAN-augmented data)
- **Features**: 22 normalized features from transaction/user context
