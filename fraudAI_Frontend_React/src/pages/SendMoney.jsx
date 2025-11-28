import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, CheckCircle, AlertTriangle, ArrowRight, Settings2, Activity } from 'lucide-react';
import axios from 'axios';

const SendMoney = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ upiId: '', amount: '', remarks: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, checking, success, fraud
    const [riskScore, setRiskScore] = useState(0);
    const [showSimulator, setShowSimulator] = useState(false);
    const [activeScenario, setActiveScenario] = useState('normal');

    // Sample features for demonstration
    const SCENARIOS = {
        normal: {
            label: "Safe Transaction",
            description: "Standard behavior, low amount",
            features: [
                0.007772198, 0.4615384615, 0.0, 0.0, 0.0, 0.1190841842, 0.7942634013, 0.1721738243,
                0.786936131, 0.0, 0.0, 0.0, 0.4140030852, 0.1869060353, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0
            ]
        },
        fraud_high_amount: {
            label: "High Value Fraud",
            description: "Unusually high amount for this user",
            features: [
                0.0079769523, 0.0, 1.0, 0.0, 1.0, 0.1892930732, 0.2897591761, 0.8752220188,
                0.0329058891, 0.0, 0.0, 0.0, 0.5557675537, 0.15793259, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0
            ]
        },
        fraud_device: {
            label: "Suspicious Device",
            description: "Transaction from unknown device/location",
            features: [
                0.0079769523, 0.0, 1.0, 0.0, 1.0, 0.1892930732, 0.2897591761, 0.8752220188,
                0.0329058891, 0.0, 0.0, 0.0, 0.5557675537, 0.15793259, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0
            ]
        }
    };

    const handleNext = () => setStep(step + 1);

    const handleSubmit = async () => {
        setStep(3);
        setIsLoading(true);
        setStatus('checking');

        try {
            // 1. Simulate AI Analysis Delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Select features based on active scenario
            const features = SCENARIOS[activeScenario].features;

            // 3. Call API
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/predict`, {
                features: features
            });

            const isFraud = response.data.is_fraud;
            const score = response.data.risk_score;
            setRiskScore(score);

            if (isFraud) {
                setStatus('fraud');
            } else {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                setStatus('success');
            }
        } catch (error) {
            console.error("Transaction Error", error);
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-6">
            {/* Main Transaction Area */}
            <div className="flex-1 max-w-2xl mx-auto">
                <div className="mb-8 text-center relative">
                    <h1 className="text-3xl font-bold text-white mb-2">Send Money</h1>
                    <p className="text-gray-400">Secure UPI transfers powered by AI</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 text-gray-500 hover:text-white"
                        onClick={() => setShowSimulator(!showSimulator)}
                    >
                        <Settings2 className="w-5 h-5" />
                    </Button>
                </div>

                <Card className="overflow-hidden relative">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    <CardContent className="p-8 min-h-[400px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label>Recipient UPI ID</Label>
                                        <Input
                                            placeholder="username@upi"
                                            value={formData.upiId}
                                            onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                            className="text-lg py-6"
                                        />
                                    </div>
                                    <Button className="w-full py-6 text-lg" onClick={handleNext} disabled={!formData.upiId}>
                                        Next <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">₹</span>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className="pl-10 text-3xl py-8 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Remarks (Optional)</Label>
                                        <Input
                                            placeholder="What's this for?"
                                            value={formData.remarks}
                                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        />
                                    </div>
                                    <Button className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={!formData.amount}>
                                        Pay Securely <ShieldCheck className="ml-2 w-5 h-5" />
                                    </Button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center space-y-6"
                                >
                                    {status === 'checking' && (
                                        <>
                                            <div className="relative w-24 h-24">
                                                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping" />
                                                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                                                <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">AI Security Scan</h3>
                                                <p className="text-gray-400">Analyzing transaction patterns...</p>
                                            </div>
                                        </>
                                    )}

                                    {status === 'success' && (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center"
                                            >
                                                <CheckCircle className="w-12 h-12 text-green-500" />
                                            </motion.div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">Payment Successful</h3>
                                                <p className="text-gray-400">₹{formData.amount} sent to {formData.upiId}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 rounded-full">
                                                <Activity className="w-4 h-4 text-green-500" />
                                                <span className="text-sm text-green-400">Risk Score: {riskScore}% (Safe)</span>
                                            </div>
                                            <Button variant="outline" onClick={() => { setStep(1); setFormData({ upiId: '', amount: '', remarks: '' }); setStatus('idle') }}>
                                                Make Another Payment
                                            </Button>
                                        </>
                                    )}

                                    {status === 'fraud' && (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center"
                                            >
                                                <AlertTriangle className="w-12 h-12 text-red-500" />
                                            </motion.div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-red-500">Transaction Blocked</h3>
                                                <p className="text-gray-300 mt-2">Our AI detected suspicious activity patterns.</p>
                                            </div>

                                            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-500 to-red-600"
                                                    style={{ width: `${riskScore}%` }}
                                                />
                                            </div>
                                            <p className="text-sm text-red-400 font-bold">Risk Score: {riskScore}%</p>

                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left w-full">
                                                <p className="text-sm text-red-200 font-medium">Security Alert:</p>
                                                <ul className="text-xs text-red-300 list-disc list-inside mt-1">
                                                    <li>High probability of fraud detected</li>
                                                    <li>Transaction pattern matches known threats</li>
                                                </ul>
                                            </div>
                                            <Button variant="destructive" onClick={() => { setStep(1); setFormData({ upiId: '', amount: '', remarks: '' }); setStatus('idle') }}>
                                                Return to Safety
                                            </Button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>

            {/* Simulator Console */}
            <AnimatePresence>
                {showSimulator && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="glass border-l border-white/10 overflow-hidden"
                    >
                        <div className="p-6 w-80 space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center">
                                    <Settings2 className="w-5 h-5 mr-2 text-blue-400" />
                                    Simulator Console
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">Control AI inputs for demo</p>
                            </div>

                            <div className="space-y-4">
                                <Label>Select Scenario</Label>
                                <div className="grid gap-2">
                                    {Object.entries(SCENARIOS).map(([key, scenario]) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveScenario(key)}
                                            className={`text-left p-3 rounded-lg border transition-all ${activeScenario === key
                                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                                    : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="font-medium text-sm">{scenario.label}</div>
                                            <div className="text-xs opacity-70">{scenario.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Live Features</Label>
                                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-green-400 h-48 overflow-y-auto">
                                    {JSON.stringify(SCENARIOS[activeScenario].features, null, 2)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SendMoney;
