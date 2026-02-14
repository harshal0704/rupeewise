import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Briefcase, TrendingUp, DollarSign, PieChart as PieIcon, Bot, RefreshCw, Calculator, Plus, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { analyzePortfolio } from '../services/geminiService';
import { marketstack } from '../services/marketstack';

const Portfolio: React.FC = () => {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [analyzing, setAnalyzing] = useState(false);

    // Add Holding State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newHolding, setNewHolding] = useState({
        symbol: '',
        name: '',
        quantity: '',
        avg_price: '',
        type: 'Stock'
    });
    const [addLoading, setAddLoading] = useState(false);

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
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                // Get valid symbols for marketstack
                const symbols = data.filter(h => h.type === 'Stock' || h.type === 'Mutual Fund').map(h => h.symbol);

                // Fetch live prices
                const quotes = await marketstack.getRealTimePrice(symbols);

                const processed = data.map(h => {
                    const quote = quotes.find(q => q.symbol === h.symbol);
                    const currentPrice = quote ? quote.price : h.avg_price;
                    return {
                        ...h,
                        currentPrice,
                        currentValue: h.quantity * currentPrice,
                        investedValue: h.quantity * h.avg_price,
                        color: getTypeColor(h.type)
                    };
                });
                setHoldings(processed);
            } else {
                setHoldings([]);
            }
        } catch (error) {
            console.error("Error fetching holdings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHolding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAddLoading(true);

        try {
            // Optional: Fetch name/details if not provided or to validate
            // For now, trust user input or simple validation

            const { error } = await supabase
                .from('portfolio_holdings')
                .insert([{
                    user_id: user.id,
                    symbol: newHolding.symbol.toUpperCase(),
                    name: newHolding.name || newHolding.symbol.toUpperCase(),
                    quantity: parseFloat(newHolding.quantity),
                    avg_price: parseFloat(newHolding.avg_price),
                    type: newHolding.type
                }]);

            if (error) throw error;

            await fetchHoldings();
            setIsAddModalOpen(false);
            setNewHolding({ symbol: '', name: '', quantity: '', avg_price: '', type: 'Stock' });
        } catch (error) {
            console.error("Error adding holding:", error);
            alert("Failed to add holding. Please check inputs.");
        } finally {
            setAddLoading(false);
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
            result[h.type] = (result[h.type] || 0) + h.currentValue;
        });
        return Object.entries(result).map(([name, value]) => ({
            name,
            value,
            color: getTypeColor(name)
        }));
    }, [holdings]);

    const totalCurrentValue = holdings.reduce((acc, curr) => acc + curr.currentValue, 0);
    const totalInvestedValue = holdings.reduce((acc, curr) => acc + curr.investedValue, 0);
    const totalReturn = totalCurrentValue - totalInvestedValue;
    const totalReturnPercent = totalInvestedValue > 0 ? (totalReturn / totalInvestedValue) * 100 : 0;

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
        <div className="space-y-8 animate-fade-in pb-20 relative">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-primary" /> Portfolio Analysis
                    </h1>
                    <p className="text-slate-400">Deep dive into your asset allocation and performance.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Asset
                    </button>
                    <button
                        onClick={handleAiAnalyze}
                        disabled={analyzing || holdings.length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {analyzing ? <RefreshCw className="animate-spin" size={18} /> : <Bot size={18} />}
                        AI Audit
                    </button>
                </div>
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
                    <p className="text-slate-400 mt-2">Add assets to differntiate your portfolio.</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-6 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-glow transition-all"
                    >
                        Add Your First Asset
                    </button>
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
                                            <p className="text-xs text-slate-500">{((asset.value / totalCurrentValue) * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                            <p className="text-indigo-200 text-sm font-medium mb-1">Total Portfolio Value</p>
                            <h2 className="text-4xl font-bold mb-2">₹{totalCurrentValue.toLocaleString()}</h2>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${totalReturn >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                                </span>
                                <span className="text-indigo-200 text-xs">Total Return</span>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl">
                            <h3 className="text-lg font-bold text-white mb-4">Holdings</h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {holdings.map((h, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-800/50 rounded-xl transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white">{h.symbol}</h4>
                                            <p className="text-xs text-slate-400">{h.quantity} units @ ₹{h.avg_price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white">₹{h.currentValue?.toLocaleString()}</p>
                                            <p className={`text-xs ${h.currentValue >= h.investedValue ? 'text-green-400' : 'text-red-400'}`}>
                                                {((h.currentValue - h.investedValue) / h.investedValue * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Asset Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Add Asset</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddHolding} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Asset Type</label>
                                <select
                                    value={newHolding.type}
                                    onChange={(e) => setNewHolding({ ...newHolding, type: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                >
                                    <option value="Stock">Stock</option>
                                    <option value="Mutual Fund">Mutual Fund</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Crypto">Crypto</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Symbol</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. RELIANCE"
                                        value={newHolding.symbol}
                                        onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Name (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Reliance Ind."
                                        value={newHolding.name}
                                        onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={newHolding.quantity}
                                        onChange={(e) => setNewHolding({ ...newHolding, quantity: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Avg Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="₹0.00"
                                        value={newHolding.avg_price}
                                        onChange={(e) => setNewHolding({ ...newHolding, avg_price: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={addLoading}
                                className="w-full py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 mt-4 disabled:opacity-50"
                            >
                                {addLoading ? 'Adding...' : 'Add to Portfolio'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;
