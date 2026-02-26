import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Smartphone, TrendingUp, FileText,
    MessageSquareText, Menu, X, LineChart, LogOut,
    Search, Bell, Settings, Star, Briefcase, GraduationCap, Target,
    ChevronsLeft, ChevronsRight, Home, Bot, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// ─── Sidebar Link ───
const SidebarLink = ({ to, icon: Icon, label, active, collapsed, onClick }: any) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mx-2 transition-all duration-200 group relative ${active
            ? 'bg-primary/15 text-white'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
        title={collapsed ? label : undefined}
    >
        {/* Glow Accent Bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
        )}
        <Icon size={20} className={`shrink-0 transition-transform duration-300 ${active ? 'text-primary scale-110' : 'group-hover:scale-110'}`} />
        {!collapsed && <span className="font-medium text-sm truncate">{label}</span>}
    </Link>
);

// ─── Section Label ───
const SectionLabel: React.FC<{ label: string; collapsed?: boolean }> = ({ label, collapsed }) => {
    if (collapsed) return <div className="mx-2 my-2 border-t border-slate-800/80" />;
    return (
        <div className="px-5 pt-4 pb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">{label}</span>
        </div>
    );
};

const Layout: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

    const navSections = [
        {
            label: 'Overview',
            items: [
                { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
            ]
        },
        {
            label: 'Money',
            items: [
                { path: '/upi', icon: Smartphone, label: 'UPI Tracker' },
                { path: '/invest', icon: TrendingUp, label: 'Investments' },
                { path: '/tax', icon: FileText, label: 'Tax Simplifier' },
            ]
        },
        {
            label: 'Markets',
            items: [
                { path: '/stocks', icon: LineChart, label: 'Market Hub' },
                { path: '/watchlist', icon: Star, label: 'Watchlist' },
                { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
            ]
        },
        {
            label: 'Learn & Plan',
            items: [
                { path: '/learn', icon: GraduationCap, label: 'Academy' },
                { path: '/goals', icon: Target, label: 'Goals' },
                { path: '/coach', icon: MessageSquareText, label: 'AI Coach' },
            ]
        }
    ];

    const allNavItems = navSections.flatMap(s => s.items);

    // Mobile bottom dock items
    const dockItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/stocks', icon: LineChart, label: 'Markets' },
        { path: '/goals', icon: Target, label: 'Goals' },
        { path: '/coach', icon: Bot, label: 'Coach' },
    ];

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const pageMap: { [key: string]: string } = {
                'dashboard': '/', 'upi': '/upi', 'invest': '/invest',
                'stocks': '/stocks', 'market': '/stocks', 'watchlist': '/watchlist',
                'portfolio': '/portfolio', 'academy': '/learn', 'learn': '/learn',
                'goals': '/goals', 'tax': '/tax', 'coach': '/coach', 'ai': '/coach'
            };
            if (pageMap[query]) {
                navigate(pageMap[query]);
            } else {
                navigate(`/stocks?search=${encodeURIComponent(searchQuery)}`);
            }
            setSearchQuery('');
        }
    };

    return (
        <div className="flex min-h-screen font-sans text-slate-100 overflow-hidden relative">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

            {/* ═══ SIDEBAR — Desktop ═══ */}
            <aside className={`hidden md:flex flex-col glass-panel m-3 rounded-2xl border-slate-700/30 fixed h-[calc(100vh-1.5rem)] z-20 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
                {/* Logo */}
                <div className={`p-4 flex items-center border-b border-slate-800/50 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                        <img src="/logo.png" alt="RupeeWise" className="w-full h-full object-cover" />
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-bold text-white leading-tight">RupeeWise</h1>
                            <span className="text-[9px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">Pro</span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {navSections.map((section) => (
                        <div key={section.label}>
                            <SectionLabel label={section.label} collapsed={collapsed} />
                            <div className="space-y-0.5">
                                {section.items.map(item => (
                                    <SidebarLink
                                        key={item.path}
                                        to={item.path}
                                        icon={item.icon}
                                        label={item.label}
                                        active={location.pathname === item.path}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="mx-2 mb-2 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all flex items-center justify-center"
                >
                    {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
                </button>

                {/* User Profile */}
                <div className="p-3 border-t border-slate-800/50">
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-slate-800/40 transition-colors`}>
                        <div className="relative shrink-0">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=36`}
                                alt="User"
                                className="w-9 h-9 rounded-full border border-slate-700"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 glow-dot" style={{ width: '8px', height: '8px' }} />
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user?.name || user?.user_metadata?.full_name || 'User'}</p>
                                    <p className="text-[10px] text-slate-500">Premium</p>
                                </div>
                                <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg" title="Sign Out">
                                    <LogOut size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ═══ MOBILE HEADER ═══ */}
            <div className="md:hidden fixed w-full glass-panel z-30 border-b border-slate-800/50 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img src="/logo.png" alt="RupeeWise" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-lg font-bold text-white">RupeeWise</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    </button>
                    <Link to="/settings" className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                        <Settings size={20} />
                    </Link>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-surface-0/95 backdrop-blur-xl z-40 pt-20 animate-fade-in">
                    <nav className="flex flex-col p-4 space-y-1">
                        {allNavItems.map(item => (
                            <SidebarLink
                                key={item.path}
                                to={item.path}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.path}
                                onClick={() => setMobileMenuOpen(false)}
                            />
                        ))}
                        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-400 mt-4 border border-red-500/20 rounded-xl hover:bg-red-500/10 mx-2">
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <main className={`flex-1 transition-all duration-300 min-h-screen ${collapsed ? 'md:ml-[84px]' : 'md:ml-[272px]'} p-4 md:p-5 pt-20 md:pt-5 pb-24 md:pb-5`}>
                {/* Top Header (Desktop) */}
                <header className="hidden md:flex items-center justify-between mb-6 glass-panel px-5 py-3 rounded-2xl sticky top-5 z-10 border-slate-800/30">
                    <div className="flex items-center text-slate-400 w-80 bg-surface-0/50 rounded-xl px-4 py-2.5 border border-slate-800/50 focus-within:border-primary/50 focus-within:text-primary transition-colors">
                        <Search size={16} className="mr-2.5 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search features, stocks..."
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-surface-2 rounded-md border border-slate-700/50 ml-2 shrink-0">
                            ⌘K
                        </kbd>
                    </div>

                    <div className="flex items-center gap-2 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors relative"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-80 glass-panel rounded-2xl border border-slate-700/50 shadow-2xl z-50 animate-scale-in origin-top-right overflow-hidden">
                                    <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-surface-1/50">
                                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                                        <div className="flex gap-2">
                                            <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary/80 transition-colors font-semibold">Mark all read</button>
                                            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Clear</button>
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-slate-600">
                                                <Bell size={24} className="mx-auto mb-3 opacity-30" />
                                                <p className="text-sm font-medium">All caught up!</p>
                                                <p className="text-xs text-slate-700 mt-1">No new notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-slate-400'}`}>{notification.title}</h4>
                                                        <span className="text-[10px] text-slate-600 ml-2 shrink-0">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{notification.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/settings" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors group">
                            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                        </Link>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto animate-fade-in-up">
                    <Outlet />
                </div>
            </main>

            {/* ═══ MOBILE BOTTOM DOCK ═══ */}
            <div className="md:hidden bottom-dock">
                <div className="flex justify-around items-center max-w-lg mx-auto">
                    {dockItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${isActive
                                        ? 'text-primary'
                                        : 'text-slate-500 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'scale-110' : ''} />
                                <span className="text-[10px] font-semibold">{item.label}</span>
                                {isActive && <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${mobileMenuOpen ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
                        <span className="text-[10px] font-semibold">More</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Layout;
