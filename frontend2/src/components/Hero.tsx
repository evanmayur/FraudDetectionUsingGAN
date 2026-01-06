import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SparklineChart } from "@/components/SparklineChart";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] orb-purple" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] orb-cyan" />

      <div className="relative max-w-[1600px] mx-auto px-4 lg:px-6 py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/30 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">
                AI Protection Active
              </span>
            </motion.div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1] mb-6">
              Stop UPI fraud{" "}
              <span className="neon-text text-primary">before</span> money leaves
              the account.
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Hybrid AI engine powered by{" "}
              <span className="text-foreground font-medium">Random Forest + Business Rules</span>{" "}
              scores each UPI payment in milliseconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/dashboard">
                <Button variant="neon" size="xl" className="group">
                  Launch SafePayAI
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                  View Live Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="glass-card glow-border p-6 lg:p-8">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SafePayAI</p>
                    <p className="font-semibold">Command Center</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success pulse-live" />
                  <span className="text-xs text-success font-medium">LIVE</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Balance</p>
                  <p className="text-2xl font-bold">₹2,45,890</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">+12.5%</span>
                  </div>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Today's Spend</p>
                  <p className="text-2xl font-bold">₹8,450</p>
                  <p className="text-xs text-muted-foreground mt-1">12 transactions</p>
                </div>
              </div>

              {/* Fraud Blocked Card */}
              <div className="glass-card p-4 mb-6 border-success/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <Ban className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fraud Blocked</p>
                      <p className="text-3xl font-bold text-success neon-text">₹1.2L</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                    +3 today
                  </div>
                </div>
              </div>

              {/* Live Activity Chart */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">Live Activity</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success" /> Safe
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-destructive" /> Blocked
                    </span>
                  </div>
                </div>
                <SparklineChart />
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
