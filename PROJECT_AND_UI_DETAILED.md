# SafePayAI: Project & UI Documentation

## 1. Project Overview
**SafePayAI** is a next-generation fintech application designed to secure Unified Payments Interface (UPI) transactions using advanced Artificial Intelligence. Unlike traditional payment apps that react to fraud after it happens, SafePayAI proactively analyzes every transaction in real-time—blocking suspicious activities *before* money leaves the sender's account.

The system employs a **Hybrid Fraud Detection Engine** that combines a pre-trained Machine Learning model (Random Forest) with strict business rule boosters to deliver high-accuracy risk assessment (Risk Score 0-100%).

---

## 2. User Interface (UI) & User Experience (UX)
The SafePayAI interface is designed with a **"Premium Dark Mode"** aesthetic, utilizing deep gradients, glassmorphism, and fluid animations to create a futuristic and trustworthy feel.

### 2.1 Design Language
*   **Color Palette:**
    *   **Background:** Deep Midnight Gradient (`gray-900` to `gray-800`).
    *   **Primary Accent:** Electric Purple (`purple-600` to `purple-400`) & Cyan (`blue-400`).
    *   **Status Colors:** Neon Green (Safe), Amber (Warning), Rose Red (Fraud/Blocked).
*   **Visual Elements:**
    *   **Glassmorphism:** Semi-transparent cards with `backdrop-blur` for depth.
    *   **Micro-interactions:** Buttons and cards scale slightly on hover (`framer-motion`).
    *   **Typography:** Modern sans-serif (Inter/SF Pro) for high readability.

### 2.2 Key Pages Breakdown

#### A. Main Dashboard (`/dashboard`)
The command center for the user.
*   **Header:** Personalized welcome message with a glowing "Protected by AI" shield badge.
*   **Status Cards:** Three glass-panel cards displaying key metrics:
    1.  **Total Balance:** Gradient background (Purple-to-Blue) to make it pop.
    2.  **Daily Spent:** Tracks spending against daily limits.
    3.  **Fraud Blocked:** A dynamic counter that turns red if threats were stopped, reinforcing the app's value.
*   **Activity Chart:** A smooth spline chart visualizing spending trends over the week.
*   **Recent Transactions:** A list of latest transfers featuring:
    *   **Directional Icons:** Arrows for sent (Red) vs. received (Green).
    *   **Status Indicators:** Live status badges (Verified, Pending, Blocked).
    *   **Fraud Highlights:** Blocked transactions are highlighted in red to draw attention.

#### B. Send Money & Fraud Check (`/send`)
The core feature flow, split into a 3-step wizard.
*   **Step 1: Recipient Selection**
    *   **Search:** Real-time UPI ID lookup.
    *   **Quick Select:** A grid of frequent contacts. Each contact card displays a **Risk Badge**:
        *   🟢 **Verified:** Safe to transact.
        *   ⚠️ **High Risk:** Visual warning if the user has a low trust score.
*   **Step 2: Amount & Context**
    *   Large, bold input focused on the numbers.
    *   Quick-tap buttons (₹500, ₹1000) for speed.
    *   Smart warning banner if the amount exceeds the user's balance.
*   **Step 3: Processing & Result**
    *   **The "AI Moment":** A spinning loader with text "AI fraud detection in progress..." creates anticipation.
    *   **Success State:** A large animated Green Checkmark. Confetti-style celebration.
    *   **Blocked State (Fraud Detected):**
        *   A dramatic Red X animation.
        *   **Risk Score Display:** E.g., "Risk Score: 78%".
        *   **Reasoning:** A "Why was this blocked?" section listing specific factors (e.g., "High-risk recipient", "Unusual device", "Location mismatch").

#### C. Live Exhibition Mode (`/demo`)
A specialized view for presentations.
*   **Visualization:** Shows the internal logic of the system.
*   **Toggle Controls:** Allows the presenter to artificially inject risk factors (e.g., "Simulate VPN Usage", "Simulate Blacklisted User") to demonstrate how the AI reacts in real-time without needing actual fraud data.

---

## 3. Technical Architecture

### 3.1 Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons |
| **Backend** | Python, Flask, Flask-SocketIO (Real-time) |
| **Database** | SQLite (Production-ready schema via SQLAlchemy) |
| **AI/ML** | Scikit-learn (Random Forest), Pandas, NumPy |
| **Auth** | Firebase Authentication |

### 3.2 The Hybrid Intelligence Engine
The backend doesn't just guess; it calculates.
1.  **Data Gathering:** When a user clicks "Pay", the system instantly aggregates **22 Features** (e.g., Device Fingerprint, Geo-Location, Transaction Frequency, Account Age).
2.  **ML Prediction:** These features are fed into a Random Forest Classifier to generate a base probability.
3.  **Rule Boosters:** The system applies "Veto Rules". For example, if a user is **Blacklisted**, the transaction is blocked immediately, regardless of the ML score.
4.  **Decision:**
    *   **Score < 30%:** Allowed (Green).
    *   **Score > 30% OR Rule Triggered:** Blocked (Red).

### 3.3 Data Flow
1.  **Frontend:** `SendTransaction.jsx` sends payload `POST /api/transactions/send`.
2.  **Backend:**
    *   Validates User & Balance.
    *   `FraudDetectionService` runs the ML model.
    *   If Fraud -> Creates `FraudAlert` in DB -> Returns `403 Forbidden` with Risk Report.
    *   If Safe -> Updates Balances -> Returns `200 OK`.
3.  **Real-Time:** The Dashboard listens via `Socket.IO` to instantly update the "Fraud Blocked" counter if an attack happens on another device logged into the same account.

---

## 4. Key Features Summary
*   **Real-Time Protection:** Sub-second analysis of every transaction.
*   **Explainable AI:** Tells users *why* a transaction was blocked (Risk Factors).
*   **Behavioral Biometrics:** Analyzes spending patterns (Time of day, Frequency).
*   **Admin Console:** A dedicated interface for security analysts to review flagged transactions and adjust user Trust Scores.
*   **Responsive Design:** Fully optimized for Desktop, Tablet, and Mobile views.
