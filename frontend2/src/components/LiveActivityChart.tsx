import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { transactionAPI } from "@/lib/api";

interface ChartData {
  time: string;
  safe: number;
  blocked: number;
}

export function LiveActivityChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivityData = async () => {
    try {
      const response = await transactionAPI.getHistory(1, 100);
      if (response.status === 'success') {
        const txs = response.data.transactions || [];

        // Group transactions by hour
        const hourlyData: { [key: string]: { safe: number; blocked: number } } = {};

        // Initialize 24 hours
        for (let i = 0; i < 24; i += 4) {
          const hour = i.toString().padStart(2, '0') + ':00';
          hourlyData[hour] = { safe: 0, blocked: 0 };
        }

        // Count transactions per hour
        txs.forEach((tx: any) => {
          const date = new Date(tx.created_at);
          const hour = Math.floor(date.getHours() / 4) * 4; // Group by 4-hour blocks
          const timeKey = hour.toString().padStart(2, '0') + ':00';

          if (hourlyData[timeKey]) {
            if (tx.status === 'blocked') {
              hourlyData[timeKey].blocked += 1;
            } else if (tx.status === 'completed') {
              hourlyData[timeKey].safe += 1;
            }
          }
        });

        // Convert to array format for chart
        const data = Object.entries(hourlyData).map(([time, counts]) => ({
          time,
          safe: counts.safe,
          blocked: counts.blocked,
        }));

        setChartData(data);
      }
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivityData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadActivityData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-card glow-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Live Activity</h3>
          <p className="text-sm text-muted-foreground">
            Transaction volume over 24 hours
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            Safe
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive" />
            Blocked
          </span>
          <div className="flex items-center gap-1 ml-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success">Live</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="safeArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 76% 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222 30% 18%)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 47% 8%)",
                  border: "1px solid hsl(222 30% 18%)",
                  borderRadius: "8px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: "hsl(210 40% 98%)" }}
              />
              <Area
                type="monotone"
                dataKey="safe"
                stroke="hsl(142 76% 50%)"
                strokeWidth={2}
                fill="url(#safeArea)"
              />
              <Area
                type="monotone"
                dataKey="blocked"
                stroke="hsl(0 84% 60%)"
                strokeWidth={2}
                fill="url(#blockedArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
