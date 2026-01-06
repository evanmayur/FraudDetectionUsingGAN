import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Wifi,
  Smartphone,
  DollarSign,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const riskFactors = [
  {
    id: "vpn",
    label: "VPN / Proxy On",
    icon: Wifi,
    riskIncrease: 25,
    detection: "Unusual network location detected",
  },
  {
    id: "device",
    label: "New Device",
    icon: Smartphone,
    riskIncrease: 20,
    detection: "Unrecognized device signature",
  },
  {
    id: "amount",
    label: "High Amount",
    icon: DollarSign,
    riskIncrease: 30,
    detection: "Transaction exceeds normal pattern",
  },
  {
    id: "payee",
    label: "New Payee",
    icon: UserPlus,
    riskIncrease: 15,
    detection: "First-time recipient detected",
  },
];

export function LiveDemoControls() {
  const [activeFactors, setActiveFactors] = useState<Record<string, boolean>>({
    vpn: false,
    device: false,
    amount: false,
    payee: false,
  });

  const [riskScore, setRiskScore] = useState(15);

  useEffect(() => {
    const baseRisk = 15;
    const additionalRisk = riskFactors.reduce((acc, factor) => {
      return acc + (activeFactors[factor.id] ? factor.riskIncrease : 0);
    }, 0);
    setRiskScore(Math.min(baseRisk + additionalRisk, 100));
  }, [activeFactors]);

  const classification =
    riskScore > 70 ? "blocked" : riskScore > 40 ? "review" : "safe";

  const classificationConfig = {
    safe: {
      label: "Safe",
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/20",
      glow: "shadow-glow-success",
    },
    review: {
      label: "Needs Review",
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/20",
      glow: "",
    },
    blocked: {
      label: "Blocked",
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/20",
      glow: "shadow-glow-destructive",
    },
  };

  const config = classificationConfig[classification];
  const ClassIcon = config.icon;

  const activeDetections = riskFactors.filter((f) => activeFactors[f.id]);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Controls Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card glow-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Simulation Controls</h3>
            <p className="text-sm text-muted-foreground">
              Toggle risk factors to see AI response
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {riskFactors.map((factor) => {
            const Icon = factor.icon;
            const isActive = activeFactors[factor.id];

            return (
              <motion.div
                key={factor.id}
                whileHover={{ scale: 1.01 }}
                className={`glass-card p-4 transition-all ${
                  isActive ? "border-primary/50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        isActive ? "bg-primary/20" : "bg-secondary"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{factor.label}</p>
                      <p className="text-xs text-muted-foreground">
                        +{factor.riskIncrease} risk points
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setActiveFactors((prev) => ({
                        ...prev,
                        [factor.id]: checked,
                      }))
                    }
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Risk Score Display */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {/* Gauge */}
        <div className={`glass-card glow-border p-8 text-center ${config.glow}`}>
          <div className="relative w-48 h-48 mx-auto mb-6">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="12"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke={
                  riskScore > 70
                    ? "hsl(0 84% 60%)"
                    : riskScore > 40
                    ? "hsl(38 92% 50%)"
                    : "hsl(142 76% 50%)"
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={502}
                initial={{ strokeDashoffset: 502 }}
                animate={{ strokeDashoffset: 502 - (riskScore / 100) * 502 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={riskScore}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-5xl font-bold ${config.color}`}
              >
                {riskScore}
              </motion.span>
              <span className="text-sm text-muted-foreground">Risk Score</span>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.color}`}
          >
            <ClassIcon className="w-5 h-5" />
            <span className="font-semibold">{config.label}</span>
          </div>
        </div>

        {/* Detection Panel */}
        <div className="glass-card glow-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">What SafePayAI Detected</h4>
          </div>

          {activeDetections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No risk factors active. Transaction would proceed normally.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeDetections.map((factor) => (
                <motion.li
                  key={factor.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3"
                >
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{factor.detection}</p>
                    <p className="text-xs text-muted-foreground">
                      Source: {factor.label}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
