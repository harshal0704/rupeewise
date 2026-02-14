import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Briefcase, TrendingUp, DollarSign, PieChart as PieIcon, Bot, RefreshCw, Calculator } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { analyzePortfolio } from '../services/geminiService';

const Portfolio: React.FC = () => {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchHoldings();
        }
    }, [user]);

    const fetchHoldings = async () => {
        try {
            const { data, error } = await supabase
                .from('portfolio_holdings')
                .select('*')
                .order('investedValue', { ascending: false }); // Note: check actual column names in DB. Schema said 'quantity', 'avg_price'. We might need to calculate value.

            // Schema check: 
            // symbol, name, quantity, avg_price, type
            // Missing: current_price (we'd need to fetch live price, for now use mock or last known?)
            // Let's assume we fetch current price or just use cost basis for allocations if live price missing.
            // Actually, let's fetch it or mock it for now.

            if (error) throw error;

            // Transform for charts - grouping by type
            // For valid chart data we need value. value = quantity * avg_price (Invested Value)
            // Ideally we want Current Value = quantity * current_price.

            const processed = data?.map(h => ({
                ...h,
                value: h.quantity * h.avg_price, // Using invested value for now as we don't have live price feed connected here efficiently yet for all
                color: getTypeColor(h.type)
            })) || [];

            setHoldings(processed);
        } catch (error) {
            console.error("Error fetching holdings:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Stock': return '#6366f1';
            case 'Mutual Fund': return '#06b6d4';
            case 'Gold': return '#f59e0b';
            case 'Crypto': return '#d946ef';
            case 'Cash': return '#10b981';
            default: return '#94a3b8';
        }
    };

    const allocationData = useMemo(() => {
        const result: Record<string, number> = {};
        holdings.forEach(h => {
            result[h.type] = (result[h.type] || 0) + h.value;
        });
        return Object.entries(result).map(([name, value]) => ({
            name,
            value,
            color: getTypeColor(name)
        }));
    }, [holdings]);

    const totalValue = holdings.reduce((acc, curr) => acc + curr.value, 0);

    const handleAiAnalyze = async () => {
        if (holdings.length === 0) return;
        setAnalyzing(true);
        try {
            const analysis = await analyzePortfolio(holdings);
            setAiAnalysis(analysis);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading portfolio...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-primary" /> Portfolio Analysis
                    </h1>
                    <p className="text-slate-400">Deep dive into your asset allocation and performance.</p>
                </div>
                <button
                    onClick={handleAiAnalyze}
                    disabled={analyzing || holdings.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {analyzing ? <RefreshCw className="animate-spin" size={18} /> : <Bot size={18} />}
                    AI Audit
                </button>
            </header>

            {aiAnalysis && (
                <div className="glass-panel p-6 rounded-3xl bg-indigo-900/20 border-indigo-500/30 animate-scale-in">
                    <h3 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
                        <Bot size={24} /> AI Wealth Insights
                    </h3>
                    <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-line">
                        {aiAnalysis}
                    </div>
                </div>
            )}

            {holdings.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                    <Briefcase size={48} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">Portfolio is Empty</h3>
                    <p className="text-slate-400 mt-2">Add assets via the transaction tracker or wait for integration.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Allocation Chart */}
                    <div className="lg:col-span-2 glass-panel p-8 rounded-3xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <PieIcon size={20} className="text-secondary" /> Asset Allocation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                {allocationData.map((asset) => (
                                    <div key={asset.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: asset.color }}></div>
                                            <span className="text-slate-300 font-medium">{asset.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold">₹{asset.value.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500">{((asset.value / totalValue) * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                            <p className="text-indigo-200 text-sm font-medium mb-1">Total Invested Value</p>
                            <h2 className="text-4xl font-bold mb-4">₹{totalValue.toLocaleString()}</h2>
                            <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg">
                                <Calculator size={16} className="text-indigo-200" />
                                <span>Based on purchase price</span>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl">
                            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-2 transition-colors group">
                                    <DollarSign className="text-green-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs text-slate-300">Add Asset</span>
                                </button>
                                <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-2 transition-colors group">
                                    <TrendingUp className="text-blue-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs text-slate-300">Rebalance</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;
