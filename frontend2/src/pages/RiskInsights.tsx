import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Lock,
  Zap,
  Users
} from "lucide-react";

const insights = [
  {
    icon: Brain,
    title: "ML Model Accuracy",
    value: "99.7%",
    description: "Random Forest model trained on 50M+ transactions",
    trend: "+0.3%",
  },
  {
    icon: Shield,
    title: "Threats Blocked",
    value: "12,450",
    description: "Total fraudulent transactions prevented this month",
    trend: "+18%",
  },
  {
    icon: AlertTriangle,
    title: "False Positive Rate",
    value: "0.12%",
    description: "Industry-leading precision in fraud detection",
    trend: "-0.05%",
  },
  {
    icon: TrendingUp,
    title: "Money Saved",
    value: "₹2.4Cr",
    description: "Total amount protected from fraud",
    trend: "+25%",
  },
];

const riskCategories = [
  {
    name: "Transaction Velocity",
    description: "Monitors unusual frequency of transactions",
    icon: Zap,
    risk: 15,
  },
  {
    name: "Amount Anomalies",
    description: "Detects transactions outside normal patterns",
    icon: BarChart3,
    risk: 8,
  },
  {
    name: "Device Trust",
    description: "Validates device fingerprint and behavior",
    icon: Lock,
    risk: 5,
  },
  {
    name: "Beneficiary Analysis",
    description: "Evaluates recipient risk profile",
    icon: Users,
    risk: 12,
  },
];

const RiskInsights = () => {
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
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              Risk <span className="gradient-text">Insights</span>
            </h1>
            <p className="text-muted-foreground">
              Deep analytics into your fraud protection system
            </p>
          </motion.div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card glow-border p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs text-success font-medium">
                      {insight.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-1">{insight.value}</p>
                  <p className="text-sm text-muted-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {insight.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Risk Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card glow-border p-6"
          >
            <h2 className="text-xl font-semibold mb-6">Active Risk Monitors</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {riskCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.name}
                    className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{category.name}</h3>
                        <span className="text-xs text-success">
                          {category.risk}% risk level
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-success to-primary"
                          style={{ width: `${100 - category.risk}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RiskInsights;
