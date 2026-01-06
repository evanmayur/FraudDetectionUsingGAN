import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardStats } from "@/components/DashboardStats";
import { LiveActivityChart } from "@/components/LiveActivityChart";
import { HybridAIEngine } from "@/components/HybridAIEngine";
import { RecentTransactions } from "@/components/RecentTransactions";
import { motion } from "framer-motion";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 lg:pt-28 pb-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              Command <span className="gradient-text">Center</span>
            </h1>
            <p className="text-muted-foreground">
              Real-time monitoring of your UPI transactions
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats />
          </div>

          {/* Charts & AI Engine */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <LiveActivityChart />
            <HybridAIEngine />
          </div>

          {/* Recent Transactions */}
          <RecentTransactions />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
