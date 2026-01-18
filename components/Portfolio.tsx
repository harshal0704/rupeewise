import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Briefcase, TrendingUp, DollarSign, PieChart as PieIcon } from 'lucide-react';

const Portfolio: React.FC = () => {
    const assets = [
        { name: 'Stocks', value: 450000, color: '#6366f1' },
        { name: 'Mutual Funds', value: 300000, color: '#06b6d4' },
        { name: 'Gold', value: 100000, color: '#f59e0b' },
        { name: 'Crypto', value: 50000, color: '#d946ef' },
        { name: 'Cash', value: 150000, color: '#10b981' },
    ];

    const totalValue = assets.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="text-primary" /> Portfolio Analysis
                </h1>
                <p className="text-slate-400">Deep dive into your asset allocation and performance.</p>
            </header>

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
                                        data={assets}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {assets.map((entry, index) => (
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
                            {assets.map((asset) => (
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
                        <p className="text-indigo-200 text-sm font-medium mb-1">Total Portfolio Value</p>
                        <h2 className="text-4xl font-bold mb-4">₹{totalValue.toLocaleString()}</h2>
                        <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg">
                            <TrendingUp size={16} className="text-green-300" />
                            <span>+12.4% All Time</span>
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
        </div>
    );
};

export default Portfolio;
