import { motion } from "framer-motion";
import { Brain, Shield, Cpu, Database, Code2, Zap } from "lucide-react";

const logos = [
  { name: "Python", icon: Code2 },
  { name: "TensorFlow", icon: Brain },
  { name: "SafePayAI", icon: Shield },
  { name: "Flask", icon: Database },
  { name: "Neural Network", icon: Cpu },
  { name: "ML Engine", icon: Zap },
  { name: "Python", icon: Code2 },
  { name: "TensorFlow", icon: Brain },
  { name: "SafePayAI", icon: Shield },
  { name: "Flask", icon: Database },
  { name: "Neural Network", icon: Cpu },
  { name: "ML Engine", icon: Zap },
];

export function LogoScroll() {
  return (
    <section className="relative py-12 overflow-hidden border-y border-border/30">
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
          className="flex gap-12 items-center"
        >
          {logos.map((logo, index) => {
            const Icon = logo.icon;
            return (
              <div
                key={`${logo.name}-${index}`}
                className="flex items-center gap-3 px-6 py-3 glass-card whitespace-nowrap"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {logo.name}
                </span>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
          className="flex gap-12 items-center ml-12"
        >
          {logos.map((logo, index) => {
            const Icon = logo.icon;
            return (
              <div
                key={`${logo.name}-dup-${index}`}
                className="flex items-center gap-3 px-6 py-3 glass-card whitespace-nowrap"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {logo.name}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Subtitle */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Powered by cutting-edge AI & ML technologies
      </p>
    </section>
  );
}
