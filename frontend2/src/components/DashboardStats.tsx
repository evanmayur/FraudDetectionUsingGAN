import { motion, Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { transactionAPI } from "@/lib/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function DashboardStats() {
  const { getBalance } = useAuth();
  const [balance, setBalance] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [blockedUsersCount, setBlockedUsersCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [totalBlockedTxs, setTotalBlockedTxs] = useState(0);

  const loadStats = async () => {
    try {
      // Load balance
      const balanceData = await getBalance();
      if (balanceData) {
        setBalance(balanceData.balance);
      }

      // Load transactions to calculate real-time today's spent
      const historyResponse = await transactionAPI.getHistory(1, 100);
      if (historyResponse.status === 'success') {
        const txs = historyResponse.data.transactions || [];

        // Calculate today's spent from actual transactions (sent only)
        const today = new Date().toDateString();
        const todayTxs = txs.filter((tx: any) => {
          const txDate = new Date(tx.created_at).toDateString();
          return txDate === today && tx.direction === 'sent' && tx.status === 'completed';
        });

        // Calculate total spent today
        const totalSpent = todayTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0);
        setTodaySpent(totalSpent);
        setTransactionCount(todayTxs.length);

        // Calculate blocked users (all time) - unique UPI IDs that were blocked
        const blockedTxs = txs.filter((tx: any) => tx.status === 'blocked');
        const uniqueBlockedUsers = new Set(
          blockedTxs.map((tx: any) => tx.receiver_upi_id)
        );
        setBlockedUsersCount(uniqueBlockedUsers.size);
        setTotalBlockedTxs(blockedTxs.length);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: "Account Balance",
      value: `₹${balance.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: Wallet,
      description: "Available balance",
    },
    {
      title: "Today's Spent",
      value: `₹${todaySpent.toLocaleString()}`,
      change: transactionCount > 0 ? `-${transactionCount}` : "0",
      trend: "down",
      icon: CreditCard,
      description: `${transactionCount} transactions today`,
    },
    {
      title: "Blocked Users",
      value: `${blockedUsersCount}`,
      change: `${totalBlockedTxs} attempts`,
      trend: "up",
      icon: ShieldCheck,
      description: "All time",
      accent: true,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

        return (
          <motion.div
            key={stat.title}
            variants={cardVariants}
            className={`glass-card glow-border p-6 ${stat.accent ? "border-success/30" : ""
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.accent
                  ? "bg-success/20"
                  : "bg-gradient-to-br from-primary/20 to-accent/20"
                  }`}
              >
                <Icon
                  className={`w-6 h-6 ${stat.accent ? "text-success" : "text-primary"}`}
                />
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.trend === "up"
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive"
                  }`}
              >
                <TrendIcon className="w-3 h-3" />
                {stat.change}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
            <p
              className={`text-3xl font-bold tracking-tight ${stat.accent ? "text-success neon-text" : ""
                }`}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
