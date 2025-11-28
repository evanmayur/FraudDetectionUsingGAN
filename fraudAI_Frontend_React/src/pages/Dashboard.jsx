import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../components/logic/firebase";

const data = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 700 },
];

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const q = query(
                    collection(db, "transactions"),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                const querySnapshot = await getDocs(q);
                const txData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTransactions(txData);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400">Welcome back, Evan</p>
                </div>
                <div className="flex space-x-4">
                    <div className="glass px-4 py-2 rounded-lg flex items-center space-x-2 text-green-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Protected by AI</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Total Balance</CardTitle>
                        <Wallet className="w-4 h-4 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">₹24,562.00</div>
                        <p className="text-xs text-blue-100 mt-1">+20.1% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Spending</CardTitle>
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">₹12,234.00</div>
                        <p className="text-xs text-gray-400 mt-1">+4% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No recent transactions</p>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{tx.recipientUPI}</p>
                                            <p className="text-xs text-gray-400">
                                                {tx.createdAt?.seconds ? new Date(tx.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-white block">-₹{tx.amount}</span>
                                        <span className={`text-[10px] ${tx.fraudCheck === 'Passed' ? 'text-green-400' : 'text-red-400'}`}>
                                            {tx.fraudCheck === 'Passed' ? 'Verified' : 'Flagged'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
