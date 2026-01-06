import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LiveDemoControls } from "@/components/LiveDemoControls";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

const LiveDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 lg:pt-28 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/30 mb-6">
              <Play className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Interactive Demo
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              Simulate <span className="gradient-text">Real-World</span> Scenarios
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Toggle risk factors to see how SafePayAI detects and responds to potential fraud
            </p>
          </motion.div>

          {/* Live Demo Controls */}
          <LiveDemoControls />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LiveDemo;
