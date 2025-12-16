/**
 * LiveDemo.jsx - Exhibition Demo Page
 * 3-step UPI fraud detection demonstration with live ML model predictions.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// API Base URL
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Step indicator component
const StepIndicator = ({ currentStep, step, label }) => {
    const isActive = currentStep === step;
    const isCompleted = currentStep > step;

    return (
        <div className="flex flex-col items-center">
            <motion.div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${isCompleted ? 'bg-green-500 text-white' :
                        isActive ? 'bg-purple-500 text-white ring-4 ring-purple-300' :
                            'bg-gray-700 text-gray-400'
                    }`}
                animate={{ scale: isActive ? 1.1 : 1 }}
            >
                {isCompleted ? '✓' : step}
            </motion.div>
            <span className={`mt-2 text-sm ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                {label}
            </span>
        </div>
    );
};

// Demo recipient cards
const RecipientCard = ({ recipient, isSelected, onSelect }) => {
    const riskColors = {
        safe: 'border-green-500 bg-green-500/10',
        medium: 'border-yellow-500 bg-yellow-500/10',
        high: 'border-red-500 bg-red-500/10',
    };

    const verificationBadge = {
        verified: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
        suspicious: { icon: '⚠', color: 'text-red-400', bg: 'bg-red-500/20' },
        recently_registered: { icon: '🆕', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    };

    const badge = verificationBadge[recipient.verification_status] || verificationBadge.verified;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(recipient)}
            className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${isSelected ? 'ring-2 ring-purple-500 border-purple-500' : riskColors[recipient.risk_category]
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h3 className="text-white font-medium">{recipient.display_name}</h3>
                    <p className="text-gray-400 text-sm font-mono">{recipient.upi_id}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.color}`}>
                    {badge.icon} {recipient.verification_status}
                </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-0.5 rounded ${recipient.risk_category === 'high' ? 'bg-red-900/50 text-red-300' :
                        recipient.risk_category === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-green-900/50 text-green-300'
                    }`}>
                    {recipient.risk_category.toUpperCase()} RISK
                </span>
            </div>
        </motion.div>
    );
};

// Loading spinner
const LoadingSpinner = ({ message = "Analyzing..." }) => (
    <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-24 h-24">
            <motion.div
                className="absolute inset-0 border-4 border-purple-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ borderTopColor: 'transparent' }}
            />
            <motion.div
                className="absolute inset-2 border-4 border-blue-500 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ borderTopColor: 'transparent' }}
            />
            <motion.div
                className="absolute inset-4 border-4 border-cyan-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{ borderTopColor: 'transparent' }}
            />
        </div>
        <motion.p
            className="mt-6 text-gray-300 text-lg"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        >
            {message}
        </motion.p>
    </div>
);

// Result display component
const ResultDisplay = ({ result, onReset }) => {
    const isFraud = result.is_fraud;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            {/* Large icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${isFraud ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}
            >
                <span className={`text-7xl ${isFraud ? 'text-red-500' : 'text-green-500'}`}>
                    {isFraud ? '✕' : '✓'}
                </span>
            </motion.div>

            {/* Status message */}
            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl font-bold mb-4 ${isFraud ? 'text-red-400' : 'text-green-400'}`}
            >
                {isFraud ? 'TRANSACTION BLOCKED' : 'TRANSACTION APPROVED'}
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-lg mb-8"
            >
                {isFraud
                    ? '⚠️ Potential Fraud Detected - Transaction Not Authorized'
                    : '✅ Transaction verified safe by AI security system'
                }
            </motion.p>

            {/* Risk score gauge */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 rounded-2xl p-6 mb-6 inline-block"
            >
                <div className="text-gray-400 text-sm mb-2">RISK SCORE</div>
                <div className={`text-5xl font-bold ${result.risk_score >= 70 ? 'text-red-500' :
                        result.risk_score >= 40 ? 'text-yellow-500' :
                            'text-green-500'
                    }`}>
                    {result.risk_score.toFixed(1)}%
                </div>
                <div className={`text-sm mt-1 ${result.risk_level === 'HIGH' ? 'text-red-400' :
                        result.risk_level === 'MEDIUM' ? 'text-yellow-400' :
                            'text-green-400'
                    }`}>
                    {result.risk_level} RISK
                </div>
            </motion.div>

            {/* Risk factors */}
            {isFraud && result.risk_factors && result.risk_factors.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 max-w-md mx-auto"
                >
                    <h3 className="text-red-400 font-medium mb-3 text-left">Risk Factors Detected:</h3>
                    <ul className="text-left text-gray-300 text-sm space-y-2">
                        {result.risk_factors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                {factor}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Transaction details */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/30 rounded-xl p-4 mb-8 max-w-md mx-auto"
            >
                <h3 className="text-gray-400 font-medium mb-3 text-left">Transaction Details:</h3>
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                        <div className="text-gray-500 text-xs">AMOUNT</div>
                        <div className="text-white font-medium">₹{result.transaction?.amount?.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">RECIPIENT</div>
                        <div className="text-white font-mono text-sm">{result.receiver_info?.upi_id}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">RECIPIENT STATUS</div>
                        <div className={`font-medium ${result.receiver_info?.verification_status === 'suspicious' ? 'text-red-400' :
                                result.receiver_info?.verification_status === 'verified' ? 'text-green-400' :
                                    'text-yellow-400'
                            }`}>
                            {result.receiver_info?.verification_status}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">FRAUD PROBABILITY</div>
                        <div className="text-white font-medium">{(result.fraud_probability * 100).toFixed(2)}%</div>
                    </div>
                </div>
            </motion.div>

            {/* Reset button */}
            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onReset}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
            >
                Try Another Transaction
            </motion.button>
        </motion.div>
    );
};

// Main LiveDemo component
export default function LiveDemo() {
    const [step, setStep] = useState(1);
    const [demoRecipients, setDemoRecipients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Form state
    const [senderUpi, setSenderUpi] = useState('demo.user@upi');
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [amount, setAmount] = useState('');

    // Load demo recipients on mount
    useEffect(() => {
        loadDemoRecipients();
    }, []);

    const loadDemoRecipients = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/recipients/demo`);
            if (response.data.status === 'success') {
                setDemoRecipients(response.data.data.recipients);
            }
        } catch (err) {
            console.error('Failed to load recipients:', err);
            setError('Failed to connect to backend server');
        } finally {
            setLoading(false);
        }
    };

    const handleRecipientSelect = (recipient) => {
        setSelectedRecipient(recipient);
        setStep(2);
    };

    const handleAmountSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setStep(3);
        setAnalyzing(true);
        setError(null);

        try {
            // Add artificial delay for dramatic effect in demo
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await axios.post(`${API_BASE}/predict/transaction`, {
                sender_upi_id: senderUpi,
                receiver_upi_id: selectedRecipient.upi_id,
                transaction_amount: parseFloat(amount),
            });

            if (response.data.status === 'success') {
                setResult(response.data.data);
            } else {
                throw new Error(response.data.message || 'Prediction failed');
            }
        } catch (err) {
            console.error('Prediction error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to analyze transaction');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSelectedRecipient(null);
        setAmount('');
        setResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Header */}
            <header className="py-6 px-4 border-b border-gray-700">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            SafePay AI
                        </h1>
                        <p className="text-gray-400 text-sm">Live Fraud Detection Demo</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        AI Model Active
                    </div>
                </div>
            </header>

            {/* Step Progress */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-center items-center gap-8 mb-12">
                    <StepIndicator currentStep={step} step={1} label="Select Recipient" />
                    <div className={`w-16 h-0.5 ${step > 1 ? 'bg-purple-500' : 'bg-gray-700'}`} />
                    <StepIndicator currentStep={step} step={2} label="Enter Amount" />
                    <div className={`w-16 h-0.5 ${step > 2 ? 'bg-purple-500' : 'bg-gray-700'}`} />
                    <StepIndicator currentStep={step} step={3} label="Fraud Analysis" />
                </div>

                {/* Error display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Main content area */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Select Recipient */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h2 className="text-xl font-semibold mb-2">Select Transaction Recipient</h2>
                                <p className="text-gray-400 mb-6">
                                    Choose from demo profiles to see how the AI detects fraud patterns
                                </p>

                                {loading ? (
                                    <div className="text-center py-8 text-gray-400">Loading recipients...</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {demoRecipients.map((recipient) => (
                                            <RecipientCard
                                                key={recipient.upi_id}
                                                recipient={recipient}
                                                isSelected={selectedRecipient?.upi_id === recipient.upi_id}
                                                onSelect={handleRecipientSelect}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Enter Amount */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="max-w-md mx-auto"
                            >
                                <h2 className="text-xl font-semibold mb-2">Enter Transaction Amount</h2>
                                <p className="text-gray-400 mb-6">
                                    Sending to <span className="text-purple-400 font-mono">{selectedRecipient?.upi_id}</span>
                                </p>

                                {/* Recipient preview */}
                                <div className={`mb-6 p-4 rounded-xl border ${selectedRecipient?.risk_category === 'high' ? 'border-red-500/50 bg-red-500/10' :
                                        selectedRecipient?.risk_category === 'medium' ? 'border-yellow-500/50 bg-yellow-500/10' :
                                            'border-green-500/50 bg-green-500/10'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl">
                                            {selectedRecipient?.display_name?.[0]}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{selectedRecipient?.display_name}</div>
                                            <div className="text-gray-400 text-sm">{selectedRecipient?.verification_status}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount input */}
                                <div className="relative mb-6">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-4 pl-14 text-4xl font-bold bg-gray-900/50 border border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none text-white"
                                        autoFocus
                                    />
                                </div>

                                {/* Quick amount buttons */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {[500, 2000, 10000, 50000, 100000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setAmount(amt.toString())}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                                        >
                                            ₹{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleAmountSubmit}
                                        disabled={!amount || parseFloat(amount) <= 0}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
                                    >
                                        Analyze Transaction
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Analysis & Results */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                {analyzing ? (
                                    <LoadingSpinner message="AI analyzing transaction patterns..." />
                                ) : result ? (
                                    <ResultDisplay result={result} onReset={handleReset} />
                                ) : null}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 text-center text-gray-500 text-sm">
                <p>SafePay AI - University Tech Exhibition Demo</p>
                <p className="text-xs mt-1">Powered by Hybrid ML (GAN + Random Forest)</p>
            </footer>
        </div>
    );
}
