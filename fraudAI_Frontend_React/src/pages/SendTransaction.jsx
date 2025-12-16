/**
 * SendTransaction.jsx - Production Send Money Page
 * Real transaction processing with fraud detection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI, transactionAPI, demoAPI } from '../lib/api';

// Step component
const StepIndicator = ({ currentStep, step, label }) => {
    const isActive = currentStep === step;
    const isCompleted = currentStep > step;

    return (
        <div className="flex flex-col items-center">
            <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-purple-500 text-white ring-4 ring-purple-300/30' :
                        'bg-gray-700 text-gray-400'
                    }`}
                animate={{ scale: isActive ? 1.1 : 1 }}
            >
                {isCompleted ? '✓' : step}
            </motion.div>
            <span className={`mt-2 text-xs ${isActive ? 'text-purple-300' : 'text-gray-500'}`}>
                {label}
            </span>
        </div>
    );
};

// Recipient search result card
const RecipientCard = ({ recipient, onSelect, isSelected }) => {
    const riskColors = {
        safe: 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20',
        medium: 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20',
        high: 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20',
    };

    const statusBadge = {
        verified: { text: 'Verified', color: 'bg-green-500/20 text-green-400' },
        pending: { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
        suspended: { text: 'Suspended', color: 'bg-red-500/20 text-red-400' },
    };

    const badge = statusBadge[recipient.verification_status] || statusBadge.pending;
    const riskCategory = recipient.risk_category || 'medium';

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(recipient)}
            className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${isSelected ? 'ring-2 ring-purple-500 border-purple-500' : riskColors[riskCategory]
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-semibold text-white">
                        {recipient.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="text-white font-medium">{recipient.display_name}</h3>
                        <p className="text-gray-400 text-sm font-mono">{recipient.upi_id}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${badge.color}`}>
                    {badge.text}
                </span>
            </div>
            {riskCategory === 'high' && (
                <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                    <span>⚠️</span>
                    <span>High-risk recipient</span>
                </div>
            )}
        </motion.div>
    );
};

// Transaction result component
const TransactionResult = ({ result, onClose }) => {
    const isSuccess = !result.is_fraud;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
            >
                <span className={`text-5xl ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                    {isSuccess ? '✓' : '✕'}
                </span>
            </motion.div>

            {/* Title */}
            <h2 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                {isSuccess ? 'Transaction Successful!' : 'Transaction Blocked'}
            </h2>

            <p className="text-gray-400 mb-6">
                {isSuccess
                    ? `₹${result.amount?.toLocaleString()} sent successfully`
                    : 'Potential fraud detected - transaction not authorized'
                }
            </p>

            {/* Details */}
            <div className="bg-gray-800/50 rounded-xl p-4 max-w-sm mx-auto mb-6">
                <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Reference</span>
                    <span className="text-white font-mono text-sm">{result.transaction_ref}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Status</span>
                    <span className={isSuccess ? 'text-green-400' : 'text-red-400'}>
                        {result.status?.toUpperCase()}
                    </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Risk Score</span>
                    <span className={`font-bold ${result.risk_score >= 50 ? 'text-red-400' :
                        result.risk_score >= 30 ? 'text-yellow-400' :
                            'text-green-400'
                        }`}>
                        {result.risk_score}%
                    </span>
                </div>
                {isSuccess && result.new_balance !== undefined && (
                    <div className="flex justify-between py-2">
                        <span className="text-gray-400">New Balance</span>
                        <span className="text-white">₹{result.new_balance?.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Risk Factors */}
            {!isSuccess && result.risk_factors?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-w-sm mx-auto mb-6">
                    <h3 className="text-red-400 font-medium mb-2 text-left text-sm">Risk Factors:</h3>
                    <ul className="text-left text-gray-300 text-sm space-y-1">
                        {result.risk_factors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                {factor}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                onClick={onClose}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
            >
                Done
            </button>
        </motion.div>
    );
};

export default function SendTransaction() {
    const { userProfile, getBalance, useDemoMode, isAuthenticated } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initializing, setInitializing] = useState(true);

    // Form state
    const [upiSearch, setUpiSearch] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [demoRecipients, setDemoRecipients] = useState([]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [balance, setBalance] = useState(null);
    const [result, setResult] = useState(null);

    // Auto-activate demo mode if not authenticated
    useEffect(() => {
        const initAuth = async () => {
            // Check if already has token
            const token = localStorage.getItem('authToken');
            if (!token) {
                // Auto-activate demo mode
                console.log('🔐 Auto-activating demo mode...');
                localStorage.setItem('authToken', 'demo-token');
                // Small delay to let the auth state update
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            setInitializing(false);
        };
        initAuth();
    }, []);

    // Load demo recipients and balance after initialization
    useEffect(() => {
        if (!initializing) {
            loadDemoRecipients();
            loadBalance();
        }
    }, [initializing]);

    const loadDemoRecipients = async () => {
        try {
            const response = await demoAPI.getDemoRecipients();
            if (response.status === 'success') {
                // Filter out self
                const recipients = response.data.recipients.filter(
                    r => r.upi_id !== userProfile?.upi_id
                );
                setDemoRecipients(recipients);
            }
        } catch (err) {
            console.error('Failed to load recipients:', err);
        }
    };

    const loadBalance = async () => {
        try {
            const bal = await getBalance();
            if (bal) {
                setBalance(bal);
            }
        } catch (err) {
            console.error('Failed to load balance:', err);
        }
    };

    // Search for recipient by UPI ID
    const searchRecipient = useCallback(async () => {
        if (!upiSearch.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await userAPI.lookupByUpi(upiSearch.trim());
            if (response.status === 'success') {
                setSelectedRecipient(response.data);
                setStep(2);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError('UPI ID not found');
            } else {
                setError('Failed to lookup recipient');
            }
        } finally {
            setLoading(false);
        }
    }, [upiSearch]);

    // Handle recipient selection
    const handleSelectRecipient = (recipient) => {
        setSelectedRecipient(recipient);
        setStep(2);
    };

    // Handle transaction submission
    const handleSubmit = async () => {
        if (!selectedRecipient || !amount) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (balance && amountNum > balance.balance) {
            setError('Insufficient balance');
            return;
        }

        setLoading(true);
        setError(null);
        setStep(3);

        try {
            // Artificial delay for UX
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await transactionAPI.send(
                selectedRecipient.upi_id,
                amountNum,
                description
            );

            if (response.status === 'success') {
                setResult({
                    ...response.data,
                    amount: amountNum,
                });

                // Refresh balance
                loadBalance();
            } else {
                setError(response.message || 'Transaction failed');
                setStep(2);
            }
        } catch (err) {
            console.error('Transaction error:', err);
            setError(err.response?.data?.message || 'Transaction failed');
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setStep(1);
        setSelectedRecipient(null);
        setAmount('');
        setDescription('');
        setResult(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Send Money
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {balance ? `Balance: ₹${balance.balance?.toLocaleString()}` : 'Loading balance...'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center items-center gap-8 mb-8">
                    <StepIndicator currentStep={step} step={1} label="Recipient" />
                    <div className={`w-12 h-0.5 ${step > 1 ? 'bg-purple-500' : 'bg-gray-700'}`} />
                    <StepIndicator currentStep={step} step={2} label="Amount" />
                    <div className={`w-12 h-0.5 ${step > 2 ? 'bg-purple-500' : 'bg-gray-700'}`} />
                    <StepIndicator currentStep={step} step={3} label="Complete" />
                </div>

                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Main Content */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Select Recipient */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h2 className="text-lg font-semibold mb-4">Select Recipient</h2>

                                {/* UPI Search */}
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={upiSearch}
                                        onChange={(e) => setUpiSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && searchRecipient()}
                                        placeholder="Enter UPI ID (e.g., name@upi)"
                                        className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
                                    />
                                    <button
                                        onClick={searchRecipient}
                                        disabled={loading || !upiSearch.trim()}
                                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-xl font-medium transition-colors"
                                    >
                                        {loading ? '...' : 'Search'}
                                    </button>
                                </div>

                                {/* Quick Select */}
                                {demoRecipients.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-px flex-1 bg-gray-700" />
                                            <span className="text-gray-500 text-sm">or select recipient</span>
                                            <div className="h-px flex-1 bg-gray-700" />
                                        </div>

                                        <div className="grid gap-3">
                                            {demoRecipients.map((recipient) => (
                                                <RecipientCard
                                                    key={recipient.upi_id}
                                                    recipient={recipient}
                                                    onSelect={handleSelectRecipient}
                                                    isSelected={selectedRecipient?.upi_id === recipient.upi_id}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Enter Amount */}
                        {step === 2 && selectedRecipient && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h2 className="text-lg font-semibold mb-4">Enter Amount</h2>

                                {/* Selected Recipient */}
                                <div className="mb-6 p-4 bg-gray-900/30 rounded-xl border border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-semibold text-white">
                                            {selectedRecipient.display_name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{selectedRecipient.display_name}</div>
                                            <div className="text-gray-400 text-sm font-mono">{selectedRecipient.upi_id}</div>
                                        </div>
                                        <button
                                            onClick={() => setStep(1)}
                                            className="ml-auto text-purple-400 hover:text-purple-300 text-sm"
                                        >
                                            Change
                                        </button>
                                    </div>
                                    {selectedRecipient.risk_category === 'high' && (
                                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                            ⚠️ Warning: This is a high-risk recipient
                                        </div>
                                    )}
                                </div>

                                {/* Amount Input */}
                                <div className="relative mb-4">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-4 pl-12 text-3xl font-bold bg-gray-900/50 border border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none text-white"
                                        autoFocus
                                    />
                                </div>

                                {/* Quick Amount Buttons */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[500, 1000, 2000, 5000, 10000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setAmount(amt.toString())}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                                        >
                                            ₹{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                {/* Description */}
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a note (optional)"
                                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none text-white placeholder-gray-500 mb-6"
                                />

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!amount || parseFloat(amount) <= 0 || loading}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
                                    >
                                        {loading ? 'Processing...' : 'Send Money'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Processing / Result */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="relative w-20 h-20 mb-6">
                                            <motion.div
                                                className="absolute inset-0 border-4 border-purple-500 rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                style={{ borderTopColor: 'transparent' }}
                                            />
                                        </div>
                                        <p className="text-gray-300">Processing transaction...</p>
                                        <p className="text-gray-500 text-sm mt-1">AI fraud detection in progress</p>
                                    </div>
                                ) : result ? (
                                    <TransactionResult result={result} onClose={handleReset} />
                                ) : null}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
