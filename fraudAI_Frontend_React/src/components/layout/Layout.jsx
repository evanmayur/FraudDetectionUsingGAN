import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30">
            <Sidebar />
            <Header />
            <main className="ml-64 p-8 min-h-[calc(100vh-4rem)]">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
