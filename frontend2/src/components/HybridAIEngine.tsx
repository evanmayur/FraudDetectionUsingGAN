import { motion } from "framer-motion";
import { Brain, GitBranch, Cpu, Zap } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Random Forest",
    description: "ML model trained on millions of transactions",
  },
  {
    icon: Brain,
    title: "Business Rules",
    description: "Custom fraud detection heuristics",
  },
  {
    icon: Cpu,
    title: "Real-time Processing",
    description: "Sub-100ms decision latency",
  },
  {
    icon: Zap,
    title: "Adaptive Learning",
    description: "Continuously improving accuracy",
  },
];

export function HybridAIEngine() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-card glow-border p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Hybrid AI Engine</h3>
          <p className="text-sm text-muted-foreground">
            Random Forest + Business Rules
          </p>
        </div>
      </div>

      {/* Code-style visualization */}
      <div className="glass-card p-4 mb-6 font-mono text-sm">
        <div className="text-muted-foreground">
          <span className="text-primary">function</span>{" "}
          <span className="text-accent">detectFraud</span>
          <span className="text-foreground">(transaction)</span> {"{"}
        </div>
        <div className="pl-4 text-muted-foreground">
          <span className="text-primary">const</span> mlScore ={" "}
          <span className="text-accent">randomForest</span>(transaction);
        </div>
        <div className="pl-4 text-muted-foreground">
          <span className="text-primary">const</span> ruleScore ={" "}
          <span className="text-accent">businessRules</span>(transaction);
        </div>
        <div className="pl-4 text-success">
          <span className="text-primary">return</span> hybridScore(mlScore, ruleScore);
        </div>
        <div className="text-muted-foreground">{"}"}</div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
