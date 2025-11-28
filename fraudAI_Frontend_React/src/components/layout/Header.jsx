import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Header = () => {
    return (
        <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-40 ml-64">
            <div className="w-96">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search transactions..."
                        className="pl-10 bg-black/20 border-white/5 focus:bg-black/40"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                </Button>
                <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white">Evan Habibani</p>
                        <p className="text-xs text-gray-400">Premium User</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
