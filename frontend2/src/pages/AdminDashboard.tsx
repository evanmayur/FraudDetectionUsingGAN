import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { adminAPI } from "@/lib/api";
import {
    Shield,
    AlertTriangle,
    Users,
    Activity,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";

interface Alert {
    id: number;
    transaction_ref: string;
    user_id: number;
    severity: string;
    message: string;
    created_at: string;
    reviewed: boolean;
}

interface AdminStats {
    totalUsers: number;
    totalTransactions: number;
    blockedTransactions: number;
    pendingAlerts: number;
}

const AdminDashboard = () => {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalTransactions: 0,
        blockedTransactions: 0,
        pendingAlerts: 0,
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAdminData = async () => {
        try {
            // Load admin stats
            const statsResponse = await adminAPI.getStats();
            if (statsResponse.status === 'success') {
                setStats(statsResponse.data);
            }

            // Load fraud alerts
            const alertsResponse = await adminAPI.getAlerts(1, 10, false);
            if (alertsResponse.status === 'success') {
                setAlerts(alertsResponse.data.alerts || []);
            }
        } catch (error) {
            console.error('Failed to load admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
        // Refresh every 15 seconds
        const interval = setInterval(loadAdminData, 15000);
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({
        icon: Icon,
        label,
        value,
        color = "primary"
    }: {
        icon: any;
        label: string;
        value: string | number;
        color?: string;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card glow-border p-6"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${color}/20 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
            </div>
            <p className="text-2xl font-bold mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </motion.div>
    );

    const AlertRow = ({ alert }: { alert: Alert }) => {
        const severityColors = {
            high: 'destructive',
            medium: 'warning',
            low: 'success',
        };

        const color = severityColors[alert.severity as keyof typeof severityColors] || 'muted';

        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${color}/20`}>
                        <AlertTriangle className={`w-5 h-5 text-${color}`} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                            Ref: {alert.transaction_ref} • {new Date(alert.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded bg-${color}/20 text-${color}`}>
                        {alert.severity.toUpperCase()}
                    </span>
                    {alert.reviewed ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                        <Clock className="w-5 h-5 text-warning" />
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 lg:pt-28 pb-16">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                                Admin <span className="gradient-text">Dashboard</span>
                            </h1>
                        </div>
                        <p className="text-muted-foreground">
                            System monitoring and fraud alert management
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={stats.totalUsers}
                            color="primary"
                        />
                        <StatCard
                            icon={Activity}
                            label="Total Transactions"
                            value={stats.totalTransactions}
                            color="success"
                        />
                        <StatCard
                            icon={XCircle}
                            label="Blocked Transactions"
                            value={stats.blockedTransactions}
                            color="destructive"
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Pending Alerts"
                            value={stats.pendingAlerts}
                            color="warning"
                        />
                    </div>

                    {/* Fraud Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card glow-border p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Fraud Alerts</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Recent fraud detection alerts
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                                <span className="text-xs text-destructive">Live</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading alerts...
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No alerts to review
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {alerts.map((alert) => (
                                    <AlertRow key={alert.id} alert={alert} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboard;
