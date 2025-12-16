/**
 * TransactionHistory.jsx - Full Transaction History Page
 * Paginated list with filters and transaction details.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpRight, ArrowDownLeft, Loader2, Filter, X,
    CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
    Search, Calendar, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { transactionAPI } from '../lib/api';
import { socketService } from '../lib/socket';

// Transaction Detail Modal
const TransactionModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const isSuccess = transaction.status === 'completed';
    const isSent = transaction.direction === 'sent';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Transaction Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status Icon */}
                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                        {isSuccess ? (
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                            <XCircle className="w-8 h-8 text-red-400" />
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div className="text-center mb-6">
                    <div className={`text-3xl font-bold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                        {isSent ? '-' : '+'}₹{transaction.amount?.toLocaleString()}
                    </div>
                    <div className={`text-sm mt-1 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.status === 'blocked' ? 'Transaction Blocked' :
                            transaction.status === 'completed' ? 'Transaction Completed' : 'Pending'}
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3 bg-gray-900/50 rounded-xl p-4">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Reference</span>
                        <span className="text-white font-mono text-sm">{transaction.transaction_ref}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">{isSent ? 'To' : 'From'}</span>
                        <span className="text-white text-sm">
                            {isSent ? transaction.receiver_upi_id : transaction.sender_upi_id}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Date</span>
                        <span className="text-white text-sm">
                            {new Date(transaction.created_at).toLocaleString()}
                        </span>
                    </div>
                    {transaction.description && (
                        <div className="flex justify-between">
                            <span className="text-gray-400">Note</span>
                            <span className="text-white text-sm">{transaction.description}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-400">Risk Score</span>
                        <span className={`font-bold ${transaction.fraud_score >= 0.5 ? 'text-red-400' :
                            transaction.fraud_score >= 0.3 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                            {(transaction.fraud_score * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* Risk Factors */}
                {transaction.risk_factors && transaction.risk_factors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <h3 className="text-red-400 font-medium mb-2 text-sm">Risk Factors:</h3>
                        <ul className="space-y-1 text-sm text-gray-300">
                            {transaction.risk_factors.map((factor, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>{factor}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
                >
                    Close
                </button>
            </motion.div>
        </motion.div>
    );
};

// Transaction Row Component
const TransactionRow = ({ transaction, onClick }) => {
    const isSent = transaction.direction === 'sent';
    const isBlocked = transaction.status === 'blocked';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            onClick={() => onClick(transaction)}
            className="flex items-center justify-between p-4 rounded-xl cursor-pointer border border-gray-700/50 hover:border-gray-600 transition-all"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isBlocked ? 'bg-red-500/20' :
                    isSent ? 'bg-orange-500/20' : 'bg-green-500/20'
                    }`}>
                    {isBlocked ? (
                        <XCircle className="w-6 h-6 text-red-400" />
                    ) : isSent ? (
                        <ArrowUpRight className="w-6 h-6 text-orange-400" />
                    ) : (
                        <ArrowDownLeft className="w-6 h-6 text-green-400" />
                    )}
                </div>
                <div>
                    <p className="text-white font-medium">
                        {isSent ? transaction.receiver_upi_id : transaction.sender_upi_id}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${isBlocked ? 'text-red-400 line-through' :
                    isSent ? 'text-red-400' : 'text-green-400'
                    }`}>
                    {isSent ? '-' : '+'}₹{transaction.amount?.toLocaleString()}
                </p>
                <p className={`text-xs ${isBlocked ? 'text-red-400' :
                    transaction.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                    {isBlocked ? 'Blocked' : transaction.status === 'completed' ? 'Completed' : 'Pending'}
                </p>
            </div>
        </motion.div>
    );
};

export default function TransactionHistory() {
    const navigate = useNavigate();
    const { isDemoMode } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Auto-activate demo mode if needed
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            localStorage.setItem('authToken', 'demo-token');
        }
    }, []);

    // Load transactions
    useEffect(() => {
        loadTransactions();
    }, [page, statusFilter]);

    // Listen for real-time updates
    useEffect(() => {
        const handleUpdate = () => {
            console.log('🔔 Refreshing history due to update');
            loadTransactions();
        };

        const unsubscribeTx = socketService.subscribe('transaction_update', handleUpdate);
        const unsubscribeNew = socketService.subscribe('new_transaction', handleUpdate);

        return () => {
            unsubscribeTx();
            unsubscribeNew();
        };
    }, [page, statusFilter]); // Re-bind if filters change to ensure loadTransactions uses current state

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const response = await transactionAPI.getHistory(page, 10, statusFilter || null);
            if (response.status === 'success') {
                setTransactions(response.data.transactions);
                setTotalPages(response.data.pages);
                setTotal(response.data.total);
            }
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleFilterChange = (status) => {
        setStatusFilter(status);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-400 hover:text-white text-sm mb-2 flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Transaction History
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {total} total transactions
                            {isDemoMode && <span className="ml-2 text-purple-400 text-sm">(Demo Mode)</span>}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-xl transition-colors ${showFilters || statusFilter ? 'bg-purple-600' : 'glass hover:bg-white/10'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleFilterChange('')}
                                        className={`px-4 py-2 rounded-lg text-sm ${!statusFilter ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('completed')}
                                        className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Completed
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('blocked')}
                                        className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'blocked' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Blocked
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('pending')}
                                        className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        Pending
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transaction List */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 border border-gray-700">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-400">No transactions found</p>
                            {statusFilter && (
                                <button
                                    onClick={() => handleFilterChange('')}
                                    className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <TransactionRow
                                    key={tx.transaction_ref}
                                    transaction={tx}
                                    onClick={setSelectedTransaction}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                            <p className="text-gray-400 text-sm">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Detail Modal */}
            <AnimatePresence>
                {selectedTransaction && (
                    <TransactionModal
                        transaction={selectedTransaction}
                        onClose={() => setSelectedTransaction(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
