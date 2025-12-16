import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ShieldAlert,
    Users,
    Activity,
    Search,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    MoreVertical,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../lib/api';
import { socketService } from '../lib/socket';

const AdminDashboard = () => {
    const { userProfile, isAuthenticated, isDemoMode } = useAuth();
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'users'

    useEffect(() => {
        loadData();
    }, []);

    // Listen for real-time updates
    useEffect(() => {
        if (!socketService.isConnected()) {
            socketService.connect();
        }

        const handleUpdate = () => {
            console.log('🔔 Admin update received');
            loadData();
        };

        const unsubscribeAlert = socketService.subscribe('fraud_alert', handleUpdate);
        const unsubscribeTx = socketService.subscribe('transaction_update', handleUpdate);

        return () => {
            unsubscribeAlert();
            unsubscribeTx();
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load stats
            const statsData = await adminAPI.getStats();
            if (statsData.status === 'success') {
                setStats(statsData.data);
            }

            // Load pending alerts
            const alertsData = await adminAPI.getAlerts(1, 50, false);
            if (alertsData.status === 'success') {
                setAlerts(alertsData.data.alerts);
            }
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewAlert = async (alertId, action) => {
        try {
            await adminAPI.reviewAlert(alertId, 'Reviewed via dashboard', action);
            loadData(); // Refresh list
        } catch (err) {
            console.error('Failed to review alert:', err);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('en-IN');
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400">System Overview & Fraud Monitoring</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-purple-500/20 bg-purple-900/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
                        <Users className="w-4 h-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_users || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-blue-500/20 bg-blue-900/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Transactions</CardTitle>
                        <Activity className="w-4 h-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.total_transactions || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-900/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Blocked Fraud</CardTitle>
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.blocked_transactions || 0}</div>
                        <p className="text-xs text-red-400 mt-1">{stats?.fraud_rate}% fraud rate</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/20 bg-orange-900/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Pending Alerts</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats?.pending_alerts || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Fraud Alerts</CardTitle>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('alerts')}
                                    className={`px-3 py-1 rounded text-sm ${activeTab === 'alerts' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Pending Review
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3">Severity</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {alerts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                No pending alerts. System is secure.
                                            </td>
                                        </tr>
                                    ) : (
                                        alerts.map((alert) => (
                                            <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                                                        ${alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                                            alert.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-blue-500/20 text-blue-400'}
                                                    `}>
                                                        {alert.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-white font-medium">
                                                    {alert.alert_type}
                                                </td>
                                                <td className="px-4 py-3 text-gray-300 text-sm max-w-md truncate">
                                                    {alert.description}
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-sm">
                                                    {formatTime(alert.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleReviewAlert(alert.id, 'dismissed')}
                                                            className="p-1 hover:text-green-400 text-gray-400 transition-colors" title="Mark as Reviewed"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-1 hover:text-purple-400 text-gray-400 transition-colors" title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
