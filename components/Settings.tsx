import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Database, Trash2, LogOut, Check, X, AlertTriangle, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

// --- Custom Interactive Components ---

// Custom Select / Dropdown
const CustomSelect = ({ value, options, onChange, label, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
            <div
                className="w-full bg-surface-1 border border-surface-3 rounded-2xl px-4 py-3 text-text-main cursor-pointer flex justify-between items-center transition-all hover:border-primary/50"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={16} className="text-text-secondary" />}
                    <span>{options.find((o: any) => o.value === value)?.label || value}</span>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} className="text-text-secondary" />
                </div>
            </div>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10 block" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-1 border border-surface-3 rounded-2xl shadow-2xl z-20 overflow-hidden animate-fade-in-up">
                        {options.map((opt: any) => (
                            <div
                                key={opt.value}
                                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${value === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface-2 hover:text-text-main'}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                <span>{opt.label}</span>
                                {value === opt.value && <Check size={16} />}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Premium Theme Card
const ThemeCard = ({ theme, isActive, onClick }: any) => {
    return (
        <button
            onClick={onClick}
            className={`group relative p-4 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col gap-3 ${isActive
                    ? 'bg-surface-2 border-primary ring-2 ring-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.2)]'
                    : 'bg-surface-1 border-surface-3 hover:border-primary/40 hover:bg-surface-2 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]'
                }`}
        >
            <div className="flex w-full h-12 rounded-xl overflow-hidden shadow-inner border border-surface-3">
                <div className="flex-1" style={{ backgroundColor: theme.colors['--surface-0'] }}></div>
                <div className="flex-1" style={{ backgroundColor: theme.colors['--surface-1'] }}></div>
                <div className="flex-1" style={{ backgroundColor: theme.colors['--primary'] }}></div>
                <div className="flex-1" style={{ backgroundColor: theme.colors['--secondary'] }}></div>
            </div>
            <div className="flex justify-between items-center w-full">
                <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-text-main group-hover:text-primary/80'}`}>
                    {theme.name}
                </span>
                {isActive && (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center animate-scale-in">
                        <Check size={12} className="text-primary" />
                    </div>
                )}
            </div>
        </button>
    );
};


const Settings: React.FC = () => {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const { theme, setTheme, themes } = useTheme();

    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('gemini_model') || 'gemini-2.0-flash-lite-preview-02-05');

    // Preferences (Mock State for now)
    const [currency, setCurrency] = useState('INR');
    const [language, setLanguage] = useState('en');

    const handleExportData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch all user data
            const [txs, portfolio, watchlist] = await Promise.all([
                supabase.from('transactions').select('*').eq('user_id', user.id),
                supabase.from('portfolio_holdings').select('*').eq('user_id', user.id),
                supabase.from('watchlist').select('*').eq('user_id', user.id)
            ]);

            const data = {
                profile,
                transactions: txs.data,
                portfolio: portfolio.data,
                watchlist: watchlist.data,
                exported_at: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rupeewise_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            addNotification("Data Exported", "Your data has been successfully downloaded.", "success");
        } catch (error) {
            console.error("Export failed:", error);
            addNotification("Export Failed", "Could not export data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await Promise.all([
                supabase.from('transactions').delete().eq('user_id', user.id),
                supabase.from('portfolio_holdings').delete().eq('user_id', user.id),
                supabase.from('watchlist').delete().eq('user_id', user.id),
                supabase.from('user_profiles').delete().eq('id', user.id)
            ]);

            addNotification("Account Deleted", "All your data has been permanently removed.", "warning");
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Delete failed:", error);
            addNotification("Delete Failed", "Could not delete account data. Please contact support.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-text-main flex items-center gap-4 tracking-tight">
                    <SettingsIcon className="text-primary" size={36} />
                    Command Center
                </h1>
                <p className="text-text-secondary text-lg mt-2">Manage your profile, fine-tune preferences, and orchestrate your data.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Profile Overview Card */}
                <div className="lg:col-span-4">
                    <div className="glass-panel p-8 rounded-[2rem] sticky top-24 backdrop-blur-2xl border-surface-3">
                        <div className="text-center">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow"></div>
                                <img
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1e1f22&color=d4a853&size=200`}
                                    alt="Avatar"
                                    className="relative w-32 h-32 rounded-full border-4 border-surface-2 shadow-2xl z-10 mx-auto object-cover"
                                />
                                <div className="absolute bottom-1 right-1 w-8 h-8 bg-surface-1 border-2 border-surface-2 rounded-full flex items-center justify-center z-20 cursor-pointer hover:bg-surface-3 transition">
                                    <User size={14} className="text-primary" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-text-main">{user?.name}</h2>
                            <p className="text-text-secondary text-sm mb-4">{user?.email}</p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-full mb-8">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-primary text-xs uppercase font-extrabold tracking-wider">Pro Edition Active</span>
                            </div>

                            <button onClick={logout} className="w-full py-4 rounded-2xl bg-surface-1 hover:bg-surface-2 border border-surface-3 text-error hover:text-error transition-all font-bold flex items-center justify-center gap-2 group">
                                <LogOut size={18} className="transition-transform group-hover:-translate-x-1" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Settings Area */}
                <div className="lg:col-span-8 space-y-8">

                    {/* App Appearance */}
                    <section className="glass-panel p-8 rounded-[2rem]">
                        <h3 className="text-2xl font-bold text-text-main mb-8 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <SettingsIcon size={20} className="text-primary" />
                            </span>
                            Appearance
                        </h3>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-text-secondary mb-4">Color Theme Engine</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {themes.map((t) => (
                                    <ThemeCard
                                        key={t.id}
                                        theme={t}
                                        isActive={theme === t.id}
                                        onClick={() => setTheme(t.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomSelect
                                label="Base Currency"
                                value={currency}
                                onChange={setCurrency}
                                options={[
                                    { value: 'INR', label: 'INR (₹) - Rupee' },
                                    { value: 'USD', label: 'USD ($) - Dollar' },
                                    { value: 'EUR', label: 'EUR (€) - Euro' }
                                ]}
                            />
                            <CustomSelect
                                label="Interface Language"
                                value={language}
                                onChange={setLanguage}
                                options={[
                                    { value: 'en', label: 'English (US)' },
                                    { value: 'hi', label: 'Hindi (हिन्दी)' }
                                ]}
                            />
                        </div>
                    </section>

                    {/* AI Configuration */}
                    <section className="glass-panel p-8 rounded-[2rem]">
                        <h3 className="text-2xl font-bold text-text-main mb-8 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <Database size={20} className="text-secondary" />
                            </span>
                            AI Intelligence Engine
                        </h3>

                        <div className="space-y-8">
                            <CustomSelect
                                label="Execution Provider"
                                value={localStorage.getItem('ai_provider') || 'groq'}
                                onChange={(val: string) => {
                                    localStorage.setItem('ai_provider', val);
                                    if (val === 'groq') {
                                        if (geminiModel.includes('gemini')) setGeminiModel('llama-3.3-70b-versatile');
                                    } else {
                                        if (geminiModel.includes('llama')) setGeminiModel('gemini-2.0-flash-lite-preview-02-05');
                                    }
                                    window.dispatchEvent(new Event('storage'));
                                    addNotification("Engine Switched", `Routing AI requests via ${val.toUpperCase()}.`, "success");
                                }}
                                options={[
                                    { value: 'groq', label: 'Groq Cloud (Blazing Fast Llama-3)' },
                                    { value: 'gemini', label: 'Google Gemini (Standard)' }
                                ]}
                            />

                            {localStorage.getItem('ai_provider') === 'gemini' && (
                                <div className="animate-fade-in-up bg-surface-1 p-6 rounded-2xl border border-surface-3">
                                    <label className="block text-sm font-medium text-text-secondary mb-3">Google API Token</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="password"
                                            placeholder="sk-..."
                                            defaultValue={localStorage.getItem('gemini_api_key') || ''}
                                            onChange={(e) => localStorage.setItem('gemini_api_key', e.target.value)}
                                            className="flex-1 bg-surface-2 border border-surface-3 rounded-xl px-5 py-3 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        />
                                        <button
                                            onClick={() => addNotification("Token Verified", "API Key secured in local ledger.", "success")}
                                            className="px-8 py-3 bg-primary hover:bg-primary/90 text-surface-0 rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20"
                                        >
                                            Verify & Save
                                        </button>
                                    </div>
                                    <p className="text-xs text-text-muted mt-3">
                                        Keys are strictly encrypted locally. Provision one from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google Developer Console</a>.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-3">Model Fingerprint</label>
                                <input
                                    type="text"
                                    value={geminiModel}
                                    onChange={(e) => {
                                        setGeminiModel(e.target.value);
                                        localStorage.setItem('gemini_model', e.target.value);
                                    }}
                                    className="w-full bg-surface-1 border border-surface-3 rounded-xl px-5 py-4 text-text-main focus:border-secondary focus:ring-1 focus:ring-secondary/50 outline-none transition-all font-mono text-sm"
                                />
                                <p className="text-xs text-text-muted mt-3">
                                    Target deployment version. Default: <code className="px-1.5 py-0.5 rounded bg-surface-2 text-primary">llama-3.3-70b-versatile</code>.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Data Vault */}
                    <section className="glass-panel p-8 rounded-[2rem]">
                        <h3 className="text-2xl font-bold text-text-main mb-8 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Database size={20} className="text-accent" />
                            </span>
                            Data Vault
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleExportData}
                                disabled={loading}
                                className="group p-6 bg-surface-1 hover:bg-surface-2 border border-surface-3 hover:border-primary/30 rounded-2xl text-left transition-all flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="font-bold text-text-main mb-1 group-hover:text-primary transition-colors">Export Ledger</h4>
                                    <p className="text-xs text-text-secondary">Download complete history as JSON vault</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-surface-2 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    <Download size={20} className="text-text-muted group-hover:text-primary transition-colors" />
                                </div>
                            </button>

                            <button className="group p-6 bg-surface-1 hover:bg-surface-2 border border-surface-3 hover:border-secondary/30 rounded-2xl text-left transition-all flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-text-main mb-1 group-hover:text-secondary transition-colors">Flush Cache</h4>
                                    <p className="text-xs text-text-secondary">Purge temporary artifacts to free memory</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-surface-2 group-hover:bg-secondary/10 flex items-center justify-center transition-colors">
                                    <RefreshCw size={20} className="text-text-muted group-hover:text-secondary transition-colors" />
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="border border-error/20 bg-error/5 p-8 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-error/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <h3 className="text-2xl font-bold text-error mb-4 flex items-center gap-3 relative z-10">
                            <AlertTriangle size={24} /> Terminate Account
                        </h3>
                        <p className="text-text-secondary mb-6 relative z-10">Executing this protocol will permanently incinerate all associated ledgers, profiles, and transactions across our decentralized infrastructure.</p>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-6 py-3 bg-transparent hover:bg-error text-error hover:text-white border-2 border-error/50 hover:border-error rounded-xl font-bold transition-all relative z-10"
                        >
                            Initiate Termination
                        </button>
                    </section>
                </div>
            </div>

            {/* Modal: Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-surface-0/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel w-full max-w-lg rounded-[2rem] p-8 border border-error/50 animate-scale-in shadow-2xl shadow-error/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-error to-transparent"></div>
                        <div className="text-center mb-8 relative z-10">
                            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <div className="absolute inset-0 border border-error/30 rounded-full animate-ping"></div>
                                <Trash2 size={36} className="text-error" />
                            </div>
                            <h2 className="text-3xl font-black text-text-main mb-3">Confirm Termination Protocol?</h2>
                            <p className="text-text-secondary">
                                This action is irreversible. Your digital imprint will be eradicated from the servers instaneously.
                            </p>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-4 bg-surface-1 hover:bg-surface-2 border border-surface-3 text-text-main font-bold rounded-xl transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="flex-1 py-4 bg-error hover:bg-error/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-error/30 active:scale-95 flex justify-center items-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Execute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
