import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SendMoneyWizard } from "@/components/SendMoneyWizard";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

const SendMoney = () => {
  const { getBalance } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const loadBalance = async () => {
      const balanceData = await getBalance();
      if (balanceData) {
        setBalance(balanceData.balance);
      }
    };
    loadBalance();
  }, []);

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
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">
              Send <span className="gradient-text">Money</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              AI-protected UPI transfers with real-time fraud detection
            </p>
            {balance !== null && (
              <p className="text-sm text-muted-foreground mt-2">
                Available Balance: <span className="text-primary font-semibold">₹{balance.toLocaleString()}</span>
              </p>
            )}
          </motion.div>

          {/* Send Money Wizard */}
          <SendMoneyWizard />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SendMoney;
