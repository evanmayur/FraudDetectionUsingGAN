import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { transactionAPI } from "@/lib/api";

const statusConfig = {
  completed: {
    icon: CheckCircle,
    label: "Safe",
    className: "status-safe",
  },
  blocked: {
    icon: XCircle,
    label: "Blocked",
    className: "status-blocked",
  },
  pending: {
    icon: AlertTriangle,
    label: "Review",
    className: "status-review",
  },
};

interface Transaction {
  transaction_ref: string;
  sender_upi_id: string;
  receiver_upi_id: string;
  amount: number;
  status: string;
  is_fraud: boolean;
  fraud_score: number;
  created_at: string;
  direction?: string;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getHistory(1, 10);
      if (response.status === 'success') {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getMerchantName = (tx: Transaction) => {
    return tx.direction === 'sent' ? tx.receiver_upi_id : tx.sender_upi_id;
  };

  const getRiskScore = (tx: Transaction) => {
    return Math.round((tx.fraud_score || 0) * 100);
  };

  const getStatus = (tx: Transaction): keyof typeof statusConfig => {
    if (tx.status === 'blocked') return 'blocked';
    if (tx.status === 'completed') return 'completed';
    return 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="glass-card glow-border overflow-hidden"
    >
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">
            Live transaction monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Merchant
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.slice(0, 6).map((tx, index) => {
                const status = getStatus(tx);
                const config = statusConfig[status];
                const Icon = config.icon;
                const riskScore = getRiskScore(tx);

                return (
                  <motion.tr
                    key={tx.transaction_ref}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                      {formatTime(tx.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getMerchantName(tx)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${riskScore > 70
                                ? "bg-destructive"
                                : riskScore > 40
                                  ? "bg-warning"
                                  : "bg-success"
                              }`}
                            style={{ width: `${riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {riskScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
