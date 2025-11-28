import { Link, useLocation } from 'react-router-dom';
import { Home, Send, Activity, Settings, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Send Money', path: '/send-money', icon: Send },
        { name: 'Transactions', path: '/transactions', icon: Activity },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex flex-col w-64 h-screen glass border-r border-white/10 fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    SafePay AI
                </span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-blue-400" : "text-gray-500 group-hover:text-white")} />
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4">
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2">Security Status</p>
                    <div className="flex items-center space-x-2 text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold">System Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
