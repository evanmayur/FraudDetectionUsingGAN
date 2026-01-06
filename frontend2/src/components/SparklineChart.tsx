import { motion } from "framer-motion";

const data = [
  { value: 40, status: "safe" },
  { value: 65, status: "safe" },
  { value: 55, status: "safe" },
  { value: 80, status: "blocked" },
  { value: 45, status: "safe" },
  { value: 70, status: "safe" },
  { value: 35, status: "safe" },
  { value: 90, status: "blocked" },
  { value: 50, status: "safe" },
  { value: 60, status: "safe" },
  { value: 75, status: "safe" },
  { value: 45, status: "safe" },
];

export function SparklineChart() {
  const maxValue = Math.max(...data.map((d) => d.value));
  const chartHeight = 60;

  return (
    <div className="sparkline-glow">
      <svg
        viewBox={`0 0 ${data.length * 24} ${chartHeight}`}
        className="w-full h-16"
        preserveAspectRatio="none"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="safeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(142 76% 50%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(142 76% 50%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="blockedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={`
            M 0 ${chartHeight}
            ${data
              .map((d, i) => {
                const x = i * 24 + 12;
                const y = chartHeight - (d.value / maxValue) * (chartHeight - 10);
                return `L ${x} ${y}`;
              })
              .join(" ")}
            L ${data.length * 24} ${chartHeight}
            Z
          `}
          fill="url(#safeGradient)"
        />

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d={`
            M ${12} ${chartHeight - (data[0].value / maxValue) * (chartHeight - 10)}
            ${data
              .slice(1)
              .map((d, i) => {
                const x = (i + 1) * 24 + 12;
                const y = chartHeight - (d.value / maxValue) * (chartHeight - 10);
                return `L ${x} ${y}`;
              })
              .join(" ")}
          `}
          fill="none"
          stroke="hsl(142 76% 50%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = i * 24 + 12;
          const y = chartHeight - (d.value / maxValue) * (chartHeight - 10);
          const isBlocked = d.status === "blocked";

          return (
            <motion.circle
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              cx={x}
              cy={y}
              r={isBlocked ? 5 : 3}
              fill={isBlocked ? "hsl(0 84% 60%)" : "hsl(142 76% 50%)"}
              className={isBlocked ? "animate-pulse" : ""}
            />
          );
        })}
      </svg>
    </div>
  );
}
