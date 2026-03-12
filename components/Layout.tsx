import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
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
        className={`flex items-center gap-3 px-3 py-3 rounded-xl mx-2 transition-all duration-300 group relative ${active
            ? 'bg-primary/10 text-primary font-bold shadow-[inset_0_0_20px_rgba(var(--primary),0.05)] border border-primary/20'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text-main border border-transparent hover:border-surface-3'
            }`}
        title={collapsed ? label : undefined}
    >
        {/* Glow Accent Bar */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-6 rounded-r-full bg-primary shadow-[0_0_12px_var(--primary-glow)]" />
        )}
        <Icon size={20} className={`shrink-0 transition-transform duration-300 ${active ? 'text-primary scale-110' : 'group-hover:scale-110 text-text-muted group-hover:text-text-main'}`} />
        {!collapsed && <span className="text-sm truncate">{label}</span>}
    </Link>
);

// ─── Section Label ───
const SectionLabel: React.FC<{ label: string; collapsed?: boolean }> = ({ label, collapsed }) => {
    if (collapsed) return <div className="mx-3 my-3 border-t border-surface-3" />;
    return (
        <div className="px-5 pt-5 pb-2">
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-[0.15em]">{label}</span>
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
        <div className="flex min-h-screen font-sans text-text-main overflow-hidden relative bg-surface-0 transition-colors duration-500">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none transition-colors duration-500" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />

            {/* ═══ SIDEBAR — Desktop ═══ */}
            <aside className={`hidden md:flex flex-col glass-panel m-4 rounded-[1.5rem] border-surface-3 fixed h-[calc(100vh-2rem)] z-20 transition-all duration-300 shadow-2xl ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}>
                {/* Logo */}
                <div className={`p-6 flex items-center border-b border-surface-2 ${collapsed ? 'justify-center' : 'gap-3'} shrink-0`}>
                    <Logo size={32} hideText={collapsed} />
                </div>

                {/* Nav */}
                <nav className="flex-1 py-3 overflow-y-auto w-full" style={{ scrollbarWidth: 'none' }}>
                    {navSections.map((section) => (
                        <div key={section.label} className="mb-2">
                            <SectionLabel label={section.label} collapsed={collapsed} />
                            <div className="space-y-1">
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
                    className="mx-4 mb-4 p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-2 transition-all flex items-center justify-center border border-transparent hover:border-surface-3 shadow-sm bg-surface-1 shrink-0"
                >
                    {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                </button>

                {/* User Profile */}
                <div className="p-4 border-t border-surface-2 bg-surface-1/50 rounded-b-[1.5rem] shrink-0">
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-surface-2 transition-all group cursor-pointer border border-transparent hover:border-surface-3 shadow-sm`}>
                        <div className="relative shrink-0">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1e1f22&color=d4a853&size=40`}
                                alt="User"
                                className="w-10 h-10 rounded-full border-2 border-surface-3 group-hover:border-primary/50 transition-colors shadow-md"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-surface-1 shadow-[0_0_8px_var(--success)]" />
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">{user?.name || user?.user_metadata?.full_name || 'User'}</p>
                                    <p className="text-[11px] text-text-secondary truncate font-medium">{user?.email?.split('@')[0]}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-text-muted hover:text-error transition-colors p-2 hover:bg-error/10 rounded-lg" title="Sign Out">
                                    <LogOut size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ═══ MOBILE HEADER ═══ */}
            <div className="md:hidden fixed w-full glass-panel z-30 border-b border-surface-3 px-4 py-3 flex justify-between items-center shadow-lg pt-[max(env(safe-area-inset-top),12px)]">
                <div className="flex items-center gap-2">
                    <Logo size={28} />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2.5 text-text-secondary hover:text-text-main hover:bg-surface-2 rounded-xl transition-all relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error border-2 border-surface-0 rounded-full animate-pulse" />}
                    </button>
                    <Link to="/settings" className="p-2.5 text-text-secondary hover:text-text-main hover:bg-surface-2 rounded-xl transition-all">
                        <Settings size={20} />
                    </Link>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-surface-0/95 backdrop-blur-2xl z-40 pt-24 animate-fade-in overflow-y-auto pb-32">
                    <nav className="flex flex-col p-4 space-y-2">
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
                        <button onClick={logout} className="flex items-center justify-center gap-3 px-4 py-4 text-error mt-8 border border-error/30 rounded-xl hover:bg-error/10 mx-2 font-bold shadow-lg shadow-error/10 transition-all bg-surface-1">
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <main className={`flex-1 transition-all duration-300 min-h-screen ${collapsed ? 'md:ml-[100px]' : 'md:ml-[300px]'} p-4 md:p-6 pt-24 md:pt-6 pb-28 md:pb-6`}>

                {/* Top Header (Desktop) */}
                <header className="hidden md:flex items-center justify-between mb-8 glass-panel px-6 py-4 rounded-[1.5rem] sticky top-6 z-10 border-surface-3 shadow-xl backdrop-blur-2xl">
                    <div className="flex items-center text-text-secondary w-96 bg-surface-1/80 rounded-xl px-4 py-3 border border-surface-3 focus-within:border-primary/50 focus-within:text-primsary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner relative group">
                        <Search size={18} className="mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search features, stocks..."
                            className="bg-transparent border-none outline-none text-sm w-full text-text-main placeholder-text-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <kbd className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-text-muted bg-surface-2 rounded-md border border-surface-3 ml-2 shrink-0 group-focus-within:border-primary/30 transition-colors tracking-widest shadow-sm">
                            ⌘K
                        </kbd>
                    </div>

                    <div className="flex items-center gap-3 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-3 text-text-secondary hover:text-text-main hover:bg-surface-2 rounded-xl transition-all relative border border-transparent hover:border-surface-3 shadow-sm bg-surface-1"
                            >
                                <Bell size={20} className={unreadCount > 0 ? 'text-text-main' : ''} />
                                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-error border-2 border-surface-1 rounded-full shadow-[0_0_8px_var(--error)] animate-pulse" />}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-16 w-80 glass-panel rounded-3xl border border-surface-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-50 animate-scale-in origin-top-right overflow-hidden bg-surface-1">
                                    <div className="p-5 border-b border-surface-3 flex justify-between items-center bg-surface-2/50 backdrop-blur-md">
                                        <h3 className="font-bold text-text-main text-sm flex items-center gap-2">
                                            <Bell size={16} className="text-primary" /> Notifications
                                        </h3>
                                        <div className="flex gap-3">
                                            <button onClick={markAllAsRead} className="text-[11px] text-primary hover:text-primary-glow transition-colors font-bold uppercase tracking-wider">Mark Read</button>
                                            <button onClick={clearAll} className="text-[11px] text-text-muted hover:text-error transition-colors uppercase tracking-wider font-bold">Clear</button>
                                        </div>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'none' }}>
                                        {notifications.length === 0 ? (
                                            <div className="p-10 text-center text-text-muted flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 border border-surface-3 shadow-inner">
                                                    <Bell size={24} className="opacity-40" />
                                                </div>
                                                <p className="text-sm font-bold text-text-secondary">All caught up!</p>
                                                <p className="text-xs mt-1">No new notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-5 border-b border-surface-3/50 hover:bg-surface-2 transition-colors cursor-pointer group ${!notification.read ? 'bg-primary/5' : ''}`}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <h4 className={`text-sm font-bold transition-colors ${!notification.read ? 'text-text-main' : 'text-text-secondary group-hover:text-text-main'}`}>{notification.title}</h4>
                                                        <span className="text-[10px] font-medium text-text-muted ml-2 shrink-0 bg-surface-2 px-1.5 py-0.5 rounded-md border border-surface-3">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors line-clamp-2">{notification.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link to="/settings" className="p-3 text-text-secondary hover:text-text-main hover:bg-surface-2 rounded-xl transition-all group border border-transparent hover:border-surface-3 shadow-sm bg-surface-1">
                            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                        </Link>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto animate-fade-in-up">
                    <Outlet />
                </div>
            </main>

            {/* ═══ MOBILE BOTTOM DOCK ═══ */}
            <div className="md:hidden bottom-dock bg-surface-1/90 backdrop-blur-3xl border-t border-surface-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex justify-around items-center max-w-lg mx-auto py-1">
                    {dockItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all duration-300 relative ${isActive
                                    ? 'text-primary'
                                    : 'text-text-secondary hover:text-text-main hover:bg-surface-2'
                                    }`}
                            >
                                <item.icon size={22} className={isActive ? 'scale-110' : ''} />
                                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)] animate-scale-in" />
                                )}
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all duration-300 ${mobileMenuOpen ? 'text-primary' : 'text-text-secondary hover:text-text-main hover:bg-surface-2'}`}
                    >
                        {mobileMenuOpen ? <X size={22} className="scale-110" /> : <MoreHorizontal size={22} />}
                        <span className="text-[10px] font-bold tracking-wide">Menu</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Layout;
