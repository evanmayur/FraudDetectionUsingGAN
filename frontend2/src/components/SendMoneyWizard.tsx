import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  IndianRupee,
  Shield,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Smartphone,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transactionAPI, demoAPI, userAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const steps = [
  { id: 1, title: "Recipient", icon: User },
  { id: 2, title: "Amount", icon: IndianRupee },
  { id: 3, title: "Processing", icon: Shield },
];

const quickAmounts = [500, 1000, 2000, 5000];

interface DemoRecipient {
  upi_id: string;
  display_name: string;
  verification_status: string;
  risk_category: string;
}

export function SendMoneyWizard() {
  const { getBalance } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [upiId, setUpiId] = useState("");
  const [nickname, setNickname] = useState("");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<"success" | "blocked" | null>(null);
  const [detectedIssues, setDetectedIssues] = useState<string[]>([]);
  const [demoRecipients, setDemoRecipients] = useState<DemoRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);

  const riskLevel =
    parseInt(amount) > 10000 ? "high" : parseInt(amount) > 5000 ? "medium" : "low";

  // Load demo recipients and balance on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const recipientsResponse = await demoAPI.getDemoRecipients();
        if (recipientsResponse.status === 'success') {
          setDemoRecipients(recipientsResponse.data.recipients || []);
        }
      } catch (error) {
        console.error('Failed to load demo recipients:', error);
        toast.error('Failed to load recipients');
      } finally {
        setLoadingRecipients(false);
      }

      try {
        const balanceData = await getBalance();
        if (balanceData) {
          setBalance(balanceData.balance);
        }
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    };
    loadData();
  }, []);

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
    if (currentStep === 2) {
      setProcessing(true);
      setResult(null);
      setDetectedIssues([]);

      try {
        // Minimum loading time for animation effect
        const minLoadingPromise = new Promise((resolve) => setTimeout(resolve, 2000));

        const apiCallPromise = transactionAPI.send(
          upiId,
          parseFloat(amount),
          nickname || ''
        );

        const [_, response] = await Promise.all([minLoadingPromise, apiCallPromise]);

        if (response.status === 'success') {
          if (response.data.is_fraud) {
            setResult("blocked");
            setDetectedIssues(response.data.risk_factors || []);
          } else {
            setResult("success");
          }
          // Refresh balance
          const balanceData = await getBalance();
          if (balanceData) {
            setBalance(balanceData.balance);
          }
        }
      } catch (error: any) {
        console.error("Transaction failed", error);
        toast.error(error.response?.data?.message || "Failed to process transaction. Please try again.");
        setCurrentStep(2); // Go back to amount step on error
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUpiId("");
    setNickname("");
    setAmount("");
    setResult(null);
    setProcessing(false);
  };

  return (
    <div className="glass-card glow-border p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive
                    ? "bg-gradient-to-br from-primary to-accent"
                    : "bg-secondary"
                    } ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                  />
                </div>
                <span
                  className={`text-xs mt-2 ${isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 lg:w-24 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-secondary"
                    }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  UPI ID / Phone Number
                </label>
                <Input
                  placeholder="name@upi or 9876543210"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nickname (Optional)
                </label>
                <Input
                  placeholder="e.g., John's Account"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="glass-card p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Risk Assessment
              </h4>
              <div className="space-y-3">
                {loadingRecipients ? (
                  <p className="text-sm text-muted-foreground">Loading recipients...</p>
                ) : demoRecipients.length > 0 ? (
                  demoRecipients.slice(0, 3).map((recipient) => (
                    <div
                      key={recipient.upi_id}
                      onClick={() => setUpiId(recipient.upi_id)}
                      className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                          {recipient.display_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{recipient.display_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{recipient.upi_id}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${recipient.risk_category === 'safe' ? "bg-success/20 text-success" :
                            recipient.risk_category === 'medium' ? "bg-warning/20 text-warning" :
                              "bg-destructive/20 text-destructive"
                          }`}
                      >
                        {recipient.risk_category === 'safe' ? '✓ Safe' :
                          recipient.risk_category === 'medium' ? '⚠ Medium' :
                            '⚠ High Risk'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recipients available</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <label className="block text-sm font-medium mb-4">
                Enter Amount
              </label>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-5xl font-bold text-center bg-transparent border-0 w-48 p-0 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${amount === amt.toString()
                    ? "bg-primary text-primary-foreground"
                    : "glass-card hover:border-primary/50"
                    }`}
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Risk Bar */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Current Risk Level
                </span>
                <span
                  className={`text-sm font-medium ${riskLevel === "high"
                    ? "text-destructive"
                    : riskLevel === "medium"
                      ? "text-warning"
                      : "text-success"
                    }`}
                >
                  {riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      riskLevel === "high"
                        ? "100%"
                        : riskLevel === "medium"
                          ? "60%"
                          : "25%",
                  }}
                  className={`h-full rounded-full ${riskLevel === "high"
                    ? "bg-gradient-to-r from-warning to-destructive"
                    : riskLevel === "medium"
                      ? "bg-gradient-to-r from-success to-warning"
                      : "bg-success"
                    }`}
                />
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-8"
          >
            {processing && (
              <div className="text-center space-y-6">
                {/* Radar Animation */}
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                  <div className="absolute inset-2 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-4 rounded-full border-2 border-primary/10" />
                  <div
                    className="absolute inset-0 rounded-full border-t-2 border-primary animate-radar-sweep"
                    style={{ transformOrigin: "center" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    AI Detection in Progress...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Analyzing transaction patterns
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {["Checking device", "Verifying payee", "Analyzing amount", "Risk scoring"].map(
                    (step, i) => (
                      <motion.span
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.5 }}
                        className="px-3 py-1 rounded-full glass-card text-xs"
                      >
                        {step}
                      </motion.span>
                    )
                  )}
                </div>
              </div>
            )}

            {result === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-success" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-success neon-text mb-2">
                    Transaction Safe & Sent
                  </h3>
                  <p className="text-muted-foreground">
                    ₹{parseInt(amount).toLocaleString()} sent to {upiId || "recipient"}
                  </p>
                </div>
                <Button variant="neon" onClick={handleReset}>
                  Send Another
                </Button>
              </motion.div>
            )}

            {result === "blocked" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-destructive mb-2">
                    Transaction Blocked
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    SafePayAI detected suspicious activity
                  </p>
                  <div className="glass-card p-4 max-w-sm mx-auto text-left">
                    <div className="flex items-center gap-2 text-warning text-sm mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Detected Issues:
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {detectedIssues.length > 0 ? (
                          detectedIssues.map((issue, idx) => (
                            <li key={idx}>• {issue}</li>
                          ))
                        ) : (
                          <li>• Suspicious activity detected</li>
                        )}
                      </ul>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button variant="glass">Review Details</Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < 3 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="neon"
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !upiId) || (currentStep === 2 && !amount)
            }
            className="gap-2"
          >
            {currentStep === 2 ? "Send Money" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
