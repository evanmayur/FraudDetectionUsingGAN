import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Wallet, ShieldCheck, Loader2, Send, History, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { transactionAPI, userAPI } from '../lib/api';
import { socketService } from '../lib/socket';

const Dashboard = () => {
    const navigate = useNavigate();
    const { userProfile, getBalance, useDemoMode, isDemoMode, isAuthenticated } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(null);
    const [stats, setStats] = useState({ sent: 0, received: 0, blocked: 0 });

    // Auto-activate demo mode if not authenticated
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('🔐 Auto-activating demo mode for dashboard...');
                localStorage.setItem('authToken', 'demo-token');
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            loadData();
        };
        initAuth();
    }, []);

    // Listen for real-time updates
    useEffect(() => {
        if (!socketService.isConnected()) {
            socketService.connect();
        }

        const handleUpdate = (data) => {
            console.log('🔔 Real-time update received:', data);
            // Refresh data to show new state
            loadData();

            // Show toast/notification (optional)
        };

        const unsubscribeTx = socketService.subscribe('transaction_update', handleUpdate);
        const unsubscribeNew = socketService.subscribe('new_transaction', handleUpdate);

        return () => {
            unsubscribeTx();
            unsubscribeNew();
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load transactions first to calculate local stats
            const txResponse = await transactionAPI.getHistory(1, 10);
            let localStats = { sent: 0, received: 0, blocked: 0, todaySpent: 0 };

            if (txResponse.status === 'success') {
                const txs = txResponse.data.transactions;
                setTransactions(txs);

                // Calculate stats
                const sentTxs = txs.filter(t => t.direction === 'sent' && t.status === 'completed');
                const received = txs.filter(t => t.direction === 'received').length;
                const blocked = txs.filter(t => t.status === 'blocked').length;

                // Calculate today's spending from list (fallback)
                const today = new Date().toDateString();
                const todaySpent = sentTxs
                    .filter(t => new Date(t.created_at).toDateString() === today)
                    .reduce((sum, t) => sum + t.amount, 0);

                localStats = { sent: sentTxs.length, received, blocked, todaySpent };
                setStats(localStats);
            }

            // Load balance
            const balanceData = await getBalance();
            if (balanceData) {
                console.log('💰 Balance data loaded:', balanceData);
                // If daily_spent is 0 but we have local transactions, use local calculation
                if (balanceData.daily_spent === 0 && localStats.todaySpent > 0) {
                    balanceData.daily_spent = localStats.todaySpent;
                }
                setBalance(balanceData);
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Generate chart data from transactions
    const getChartData = () => {
        if (transactions.length === 0) {
            return [
                { name: 'Mon', value: 0 },
                { name: 'Tue', value: 0 },
                { name: 'Wed', value: 0 },
                { name: 'Thu', value: 0 },
                { name: 'Fri', value: 0 },
            ];
        }

        // Group transactions by day
        const dayMap = {};
        transactions.forEach(tx => {
            const date = new Date(tx.created_at);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            dayMap[day] = (dayMap[day] || 0) + tx.amount;
        });

        return Object.entries(dayMap).map(([name, value]) => ({ name, value }));
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return 'Just now';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusIcon = (tx) => {
        if (tx.is_fraud || tx.status === 'blocked') {
            return <XCircle className="w-5 h-5 text-red-400" />;
        }
        if (tx.status === 'completed') {
            return <CheckCircle className="w-5 h-5 text-green-400" />;
        }
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
    };

    const getStatusColor = (tx) => {
        if (tx.is_fraud || tx.status === 'blocked') return 'text-red-400';
        if (tx.status === 'completed') return 'text-green-400';
        return 'text-yellow-400';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400">
                        Welcome{userProfile?.display_name ? `, ${userProfile.display_name}` : ' back'}
                        {isDemoMode && <span className="ml-2 text-purple-400 text-sm">(Demo Mode)</span>}
                    </p>
                </div>
                <div className="flex space-x-4">
                    <div className="glass px-4 py-2 rounded-lg flex items-center space-x-2 text-green-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Protected by AI</span>
                    </div>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Total Balance</CardTitle>
                        <Wallet className="w-4 h-4 text-purple-100" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold text-white">
                                    {formatAmount(balance?.balance)}
                                </div>
                                <p className="text-xs text-purple-100 mt-1">
                                    Daily limit: {formatAmount(balance?.daily_limit)}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Daily Spent</CardTitle>
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold text-white">
                                    {formatAmount(balance?.daily_spent)}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {stats.sent} transactions today
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className={stats.blocked > 0 ? 'border-red-500/30' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Fraud Blocked</CardTitle>
                        <AlertTriangle className={`w-4 h-4 ${stats.blocked > 0 ? 'text-red-400' : 'text-gray-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.blocked > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {stats.blocked}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {stats.blocked > 0 ? 'Suspicious transactions stopped' : 'All transactions verified'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/send')}
                    className="p-4 bg-purple-600 hover:bg-purple-700 rounded-xl flex flex-col items-center gap-2 transition-colors"
                >
                    <Send className="w-6 h-6 text-white" />
                    <span className="text-white font-medium">Send Money</span>
                </button>
                <button
                    onClick={() => navigate('/transactions')}
                    className="p-4 glass hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-colors"
                >
                    <History className="w-6 h-6 text-gray-300" />
                    <span className="text-gray-300 font-medium">History</span>
                </button>
                <button
                    onClick={() => navigate('/demo')}
                    className="p-4 glass hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-colors"
                >
                    <ShieldCheck className="w-6 h-6 text-gray-300" />
                    <span className="text-gray-300 font-medium">Live Demo</span>
                </button>
                <button
                    onClick={loadData}
                    className="p-4 glass hover:bg-white/10 rounded-xl flex flex-col items-center gap-2 transition-colors"
                >
                    <Loader2 className={`w-6 h-6 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                    <span className="text-gray-300 font-medium">Refresh</span>
                </button>
            </div>

            {/* Activity and Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={getChartData()}>
                                    <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => [formatAmount(value), 'Amount']}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Transactions</CardTitle>
                        <button
                            onClick={() => navigate('/transactions')}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                            View All
                        </button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No transactions yet</p>
                                <button
                                    onClick={() => navigate('/send')}
                                    className="mt-2 text-purple-400 hover:text-purple-300 text-sm"
                                >
                                    Send your first payment →
                                </button>
                            </div>
                        ) : (
                            transactions.slice(0, 5).map((tx) => (
                                <div key={tx.transaction_ref} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.direction === 'sent' ? 'bg-red-500/20' : 'bg-green-500/20'
                                            }`}>
                                            {tx.direction === 'sent'
                                                ? <ArrowUpRight className="w-5 h-5 text-red-400" />
                                                : <ArrowDownLeft className="w-5 h-5 text-green-400" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {tx.direction === 'sent' ? tx.receiver_upi_id : tx.sender_upi_id}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatTime(tx.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-medium block ${tx.direction === 'sent' ? 'text-red-400' : 'text-green-400'
                                            }`}>
                                            {tx.direction === 'sent' ? '-' : '+'}{formatAmount(tx.amount)}
                                        </span>
                                        <div className="flex items-center gap-1 justify-end">
                                            {getStatusIcon(tx)}
                                            <span className={`text-[10px] ${getStatusColor(tx)}`}>
                                                {tx.status === 'blocked' ? 'Blocked' : tx.status === 'completed' ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;

