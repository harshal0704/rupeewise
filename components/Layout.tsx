import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Smartphone, TrendingUp, FileText,
    MessageSquareText, Box, Menu, X, LineChart, LogOut,
    Search, Bell, Settings, User, Star, Briefcase, GraduationCap, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }: any) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl mx-2 transition-all duration-200 group ${active
            ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
    >
        <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-medium">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
    </Link>
);

const Layout: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/upi', icon: Smartphone, label: 'UPI Tracker' },
        { path: '/invest', icon: TrendingUp, label: 'Investments' },
        { path: '/stocks', icon: LineChart, label: 'Market Hub' },
        { path: '/watchlist', icon: Star, label: 'Watchlist' },
        { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
        { path: '/learn', icon: GraduationCap, label: 'Academy' },
        { path: '/goals', icon: Target, label: 'Goals' },
        { path: '/tax', icon: FileText, label: 'Tax Simplifier' },
        { path: '/coach', icon: MessageSquareText, label: 'AI Coach' },
    ];

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();

            // Page Navigation Shortcuts
            const pageMap: { [key: string]: string } = {
                'dashboard': '/',
                'upi': '/upi',
                'invest': '/invest',
                'stocks': '/stocks',
                'market': '/stocks',
                'watchlist': '/watchlist',
                'portfolio': '/portfolio',
                'academy': '/learn',
                'learn': '/learn',
                'goals': '/goals',
                'tax': '/tax',
                'coach': '/coach',
                'ai': '/coach'
            };

            if (pageMap[query]) {
                navigate(pageMap[query]);
            } else {
                // Default to stock search
                navigate(`/stocks?search=${encodeURIComponent(searchQuery)}`);
            }
            setSearchQuery('');
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-slate-100 overflow-hidden relative">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-blob" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000" />

            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-72 glass-panel m-4 rounded-3xl border-slate-700/50 fixed h-[calc(100vh-2rem)] z-20">
                <div className="p-6 flex items-center space-x-3 border-b border-slate-700/30">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                        <img src="/logo.png" alt="RupeeWise" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">RupeeWise</h1>
                        <span className="text-[10px] text-primary font-semibold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Pro</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map(item => (
                        <SidebarLink
                            key={item.path}
                            to={item.path}
                            icon={item.icon}
                            label={item.label}
                            active={location.pathname === item.path}
                        />
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-700/30">
                    <div className="glass-panel p-3 rounded-xl flex items-center justify-between group hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-700 shadow-sm" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-200 truncate w-24">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-500">Premium Plan</p>
                            </div>
                        </div>
                        <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed w-full glass-panel z-30 border-b border-slate-700/30 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" alt="RupeeWise" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-xl font-bold text-white">RupeeWise</h1>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-20 pt-20 animate-fade-in">
                    <nav className="flex flex-col p-4 space-y-2">
                        {navItems.map(item => (
                            <SidebarLink
                                key={item.path}
                                to={item.path}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.path}
                                onClick={() => setMobileMenuOpen(false)}
                            />
                        ))}
                        <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 text-red-400 mt-4 border border-red-500/20 rounded-xl hover:bg-red-500/10">
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 md:ml-[20rem] p-4 md:p-6 pt-20 md:pt-6 transition-all duration-300 min-h-screen">
                {/* Top Header (Desktop) */}
                <header className="hidden md:flex items-center justify-between mb-8 glass-panel px-6 py-4 rounded-2xl sticky top-6 z-10">
                    <div className="flex items-center text-slate-400 w-96 bg-slate-900/50 rounded-xl px-4 py-2.5 border border-slate-700/50 focus-within:border-primary/50 focus-within:text-primary transition-colors">
                        <Search size={18} className="mr-3" />
                        <input
                            type="text"
                            placeholder="Search stocks, mutual funds, or features..."
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    <div className="flex items-center space-x-4 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors relative"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-80 glass-panel rounded-2xl border border-slate-700/50 shadow-2xl z-50 animate-fade-in origin-top-right overflow-hidden">
                                    <div className="p-4 border-b border-slate-700/30 flex justify-between items-center bg-slate-900/50">
                                        <h3 className="font-bold text-white">Notifications</h3>
                                        <div className="flex gap-2">
                                            <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-glow transition-colors">Mark all read</button>
                                            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-400 transition-colors">Clear</button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500">
                                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-slate-400'}`}>{notification.title}</h4>
                                                        <span className="text-[10px] text-slate-500">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{notification.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/settings" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                            <Settings size={20} />
                        </Link>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default Layout;
