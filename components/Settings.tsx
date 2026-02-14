import React, { useState } from 'react';
import { User, Settings as SettingsIcon, Database, Trash2, LogOut, Check, X, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

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
    const [language, setLanguage] = useState('English');

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
            // Delete data tables first
            await Promise.all([
                supabase.from('transactions').delete().eq('user_id', user.id),
                supabase.from('portfolio_holdings').delete().eq('user_id', user.id),
                supabase.from('watchlist').delete().eq('user_id', user.id),
                supabase.from('user_profiles').delete().eq('id', user.id)
            ]);

            // Note: Deleting the actual Auth User requires Service Role or User Trigger
            // For client-side, we wipe data and sign out.

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
        <div className="space-y-8 animate-fade-in pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <SettingsIcon className="text-slate-400" /> Settings
                </h1>
                <p className="text-slate-400">Manage your profile, preferences, and data.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation/Sidebar (Optional for larger settings, keeping simplified list for now) */}
                <div className="md:col-span-3 space-y-6">

                    {/* Profile Section */}
                    <section className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-primary" /> Profile
                        </h2>
                        <div className="flex items-center gap-4">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                                alt="Avatar"
                                className="w-16 h-16 rounded-full border-2 border-slate-700"
                            />
                            <div>
                                <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                                <p className="text-slate-400 text-sm">{user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase font-bold rounded-full border border-primary/20">
                                    Pro Plan
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* App Preferences */}
                    <section className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <SettingsIcon size={20} className="text-secondary" /> Preferences
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Default Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-slate-400 mb-3">Color Theme</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {themes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className={`group relative p-3 rounded-xl border transition-all ${theme === t.id
                                                ? 'bg-slate-800 border-primary ring-1 ring-primary'
                                                : 'bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="flex gap-2 mb-2 justify-center">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors['--primary'] }}></div>
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors['--secondary'] }}></div>
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors['--accent'] }}></div>
                                            </div>
                                            <span className={`block text-xs font-medium text-center ${theme === t.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                                {t.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* API Configuration */}
                    <section className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Database size={20} className="text-purple-400" /> API Configuration
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Gemini API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="Enter your Gemini API Key"
                                        defaultValue={localStorage.getItem('gemini_api_key') || ''}
                                        onChange={(e) => localStorage.setItem('gemini_api_key', e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                    />
                                    <button
                                        onClick={() => addNotification("API Key Saved", "Your Gemini API Key has been updated locally.", "success")}
                                        className="px-6 bg-primary hover:bg-primary-glow text-white rounded-xl font-bold transition-all"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Your key is stored locally in your browser. Get one from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Gemini Model Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. gemini-1.5-flash"
                                        value={geminiModel}
                                        onChange={(e) => {
                                            setGeminiModel(e.target.value);
                                            localStorage.setItem('gemini_model', e.target.value);
                                        }}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Enter the model ID (e.g., <code>gemini-2.0-flash-lite-preview-02-05</code>, <code>gemini-1.5-pro</code>).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Data Management */}
                    <section className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Database size={20} className="text-blue-400" /> Data Management
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={handleExportData}
                                disabled={loading}
                                className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <h4 className="font-bold text-white mb-1">Export Data</h4>
                                    <p className="text-xs text-slate-400">Download all your personal data</p>
                                </div>
                                <Download className="text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                            <button className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-colors flex items-center justify-between group">
                                <div>
                                    <h4 className="font-bold text-white mb-1">Clear Cache</h4>
                                    <p className="text-xs text-slate-400">Free up local storage space</p>
                                </div>
                                <RefreshCw className="text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="border border-red-500/30 bg-red-500/5 p-6 rounded-3xl">
                        <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                            <AlertTriangle size={20} /> Danger Zone
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-white mb-1">Delete Account</h4>
                                <p className="text-xs text-slate-400">Permanently remove your account and all data.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-all border border-red-500/50"
                            >
                                Delete Account
                            </button>
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-red-500/50 animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Are you sure?</h2>
                            <p className="text-slate-400">
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                            >
                                {loading ? 'Deleting...' : 'Yes, Delete It'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
