import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { runStockSimulation, screenStocks, getHistoricalComparison, getMarketStatus } from '../services/geminiService';
import { LineChart as LineChartIcon, Play, Bot, Search, TrendingUp, GitCompare, Plus, X, Newspaper, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

const MarketHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'screener' | 'compare'>('stocks');
    const [marketStatus, setMarketStatus] = useState<{ text: string, sources: string[] } | null>(null);

    // Simulation State
    const [ticker, setTicker] = useState('RELIANCE');
    const [strategy, setStrategy] = useState('SIP');
    const [duration, setDuration] = useState('1 Year');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Screener State
    const [screenerQuery, setScreenerQuery] = useState('');
    const [screenerResult, setScreenerResult] = useState<any>(null);
    const [screenerLoading, setScreenerLoading] = useState(false);

    // Compare State
    const [compareStocks, setCompareStocks] = useState<string[]>([]);
    const [compareInput, setCompareInput] = useState('');
    const [compareData, setCompareData] = useState<any[]>([]);
    const [compareLoading, setCompareLoading] = useState(false);

    useEffect(() => {
        fetchMarketStatus();
    }, []);

    const fetchMarketStatus = async () => {
        const status = await getMarketStatus();
        setMarketStatus(status);
    };

    const handleSimulate = async () => {
        if (!ticker) return;
        setLoading(true);
        try {
            // Simulate "Live" data or Backtest
            const data = await runStockSimulation(ticker, strategy, duration);
            setResult(data);
        } catch (error) {
            console.error("Simulation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScreenerSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!screenerQuery) return;
        setScreenerLoading(true);
        try {
            const data = await screenStocks(screenerQuery);
            setScreenerResult(data);
        } catch (error) {
            console.error("Screener error:", error);
        } finally {
            setScreenerLoading(false);
        }
    };

    const addCompareStock = () => {
        if (compareInput && !compareStocks.includes(compareInput.toUpperCase())) {
            setCompareStocks([...compareStocks, compareInput.toUpperCase()]);
            setCompareInput('');
        }
    };

    const runComparison = async () => {
        if (compareStocks.length < 2) return;
        setCompareLoading(true);
        try {
            const result = await getHistoricalComparison(compareStocks);
            setCompareData(result.chartData || []);
        } catch (error) {
            console.error("Comparison error:", error);
        } finally {
            setCompareLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <LineChartIcon className="text-primary" /> Market Hub
                    </h1>
                    <p className="text-slate-400">Advanced Trading Simulator & Analysis</p>
                </div>

                {/* Market Ticker */}
                <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-slate-300">Market Status:</span>
                    </div>
                    <span className="text-white font-mono">{marketStatus?.text || "Loading..."}</span>
                    <button onClick={fetchMarketStatus} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                        <RefreshCw size={14} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-700/50 overflow-x-auto gap-6">
                {['stocks', 'crypto', 'screener', 'compare'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 px-2 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area (Stocks/Crypto) */}
                {(activeTab === 'stocks' || activeTab === 'crypto') && (
                    <>
                        <div className="lg:col-span-2 space-y-6">
                            {/* Chart Card */}
                            <div className="glass-panel p-6 rounded-3xl min-h-[500px] flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-xl border border-slate-700">
                                            {ticker.substring(0, 1)}
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={ticker}
                                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                                className="bg-transparent text-2xl font-bold text-white outline-none w-32 placeholder-slate-600"
                                                placeholder="SYMBOL"
                                            />
                                            <p className="text-xs text-slate-400">NSE / BSE</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {['1D', '1W', '1M', '1Y', '5Y'].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDuration(d === '1Y' ? '1 Year' : d)}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${(duration === d || (d === '1Y' && duration === '1 Year'))
                                                        ? 'bg-primary text-white'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="flex-1 w-full bg-slate-900/50 rounded-2xl border border-slate-800 relative overflow-hidden">
                                    {loading && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/80 backdrop-blur-sm">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <p className="text-primary font-medium animate-pulse">Simulating Market Data...</p>
                                            </div>
                                        </div>
                                    )}

                                    {!result && !loading && (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                            <div className="text-center">
                                                <LineChartIcon size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>Enter a symbol and click Simulate to view chart</p>
                                                <button
                                                    onClick={handleSimulate}
                                                    className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-glow transition-all"
                                                >
                                                    Simulate {ticker}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {result?.chartData && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={result.chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                                <XAxis dataKey="label" stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 12 }} domain={['auto', 'auto']} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                                    itemStyle={{ color: '#818cf8' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#6366f1"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorPrice)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Analysis Card */}
                            {result?.analysis && (
                                <div className="glass-panel p-6 rounded-3xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Bot size={20} className="text-accent" /> AI Market Analysis
                                    </h3>
                                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                        <div className="whitespace-pre-line leading-relaxed">
                                            {result.analysis}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar: Trading & News */}
                        <div className="space-y-6">
                            {/* Trading Panel */}
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="text-lg font-bold text-white mb-4">Place Order</h3>
                                <div className="flex gap-2 mb-4 p-1 bg-slate-800 rounded-xl">
                                    <button className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 font-bold hover:bg-green-500/30 transition-colors">Buy</button>
                                    <button className="flex-1 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">Sell</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold uppercase">Quantity</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary mt-1" defaultValue="1" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold uppercase">Price Limit (₹)</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary mt-1" placeholder="Market Price" />
                                    </div>

                                    <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Margin Required</span>
                                        <span className="text-white font-bold">₹2,450.00</span>
                                    </div>

                                    <button className="w-full py-4 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
                                        Execute Trade
                                    </button>
                                </div>
                            </div>

                            {/* News Feed */}
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Newspaper size={18} className="text-secondary" /> Market News
                                </h3>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="group cursor-pointer">
                                            <p className="text-sm text-slate-300 group-hover:text-primary transition-colors line-clamp-2 font-medium">
                                                "Sensex crosses 75k mark as foreign investors pump in record funds this quarter."
                                            </p>
                                            <span className="text-xs text-slate-500 mt-1 block">2 hours ago • Economic Times</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Screener Tab */}
                {activeTab === 'screener' && (
                    <div className="lg:col-span-3">
                        <div className="glass-panel p-8 rounded-3xl text-center max-w-3xl mx-auto mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">AI Stock Screener</h2>
                            <p className="text-slate-400 mb-8">Find hidden gems using natural language. Try "High growth IT stocks with low debt".</p>

                            <form onSubmit={handleScreenerSearch} className="relative max-w-xl mx-auto">
                                <input
                                    type="text"
                                    value={screenerQuery}
                                    onChange={(e) => setScreenerQuery(e.target.value)}
                                    placeholder="Describe your strategy..."
                                    className="w-full pl-6 pr-14 py-4 rounded-full bg-slate-900 border border-slate-700 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!screenerQuery || screenerLoading}
                                    className="absolute right-2 top-2 p-2 bg-primary text-white rounded-full hover:bg-primary-glow transition-all disabled:opacity-50"
                                >
                                    {screenerLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={24} />}
                                </button>
                            </form>
                        </div>

                        {screenerResult && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {screenerResult.results.map((item: any, idx: number) => (
                                    <div key={idx} className="glass-panel p-6 rounded-2xl hover:border-primary/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-xl text-white group-hover:text-primary transition-colors">{item.symbol}</h4>
                                                <p className="text-xs text-slate-400">{item.name}</p>
                                            </div>
                                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-lg border border-slate-700">
                                                {item.price}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">
                                            {item.reasoning}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Compare Tab */}
                {activeTab === 'compare' && (
                    <div className="lg:col-span-3 glass-panel p-8 rounded-3xl">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                            <GitCompare className="text-accent" /> Performance Comparison
                        </h2>

                        <div className="flex gap-4 mb-8">
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    value={compareInput}
                                    onChange={(e) => setCompareInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCompareStock()}
                                    placeholder="Add stock symbol (e.g. TCS)"
                                    className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-primary outline-none"
                                />
                                <button onClick={addCompareStock} className="absolute right-2 top-2 p-1.5 bg-slate-800 text-primary rounded-lg hover:bg-slate-700">
                                    <Plus size={18} />
                                </button>
                            </div>
                            <button
                                onClick={runComparison}
                                disabled={compareLoading || compareStocks.length < 2}
                                className="px-6 py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                {compareLoading ? 'Analyzing...' : 'Compare'}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-8">
                            {compareStocks.map(s => (
                                <div key={s} className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center border border-slate-700">
                                    {s}
                                    <button onClick={() => setCompareStocks(compareStocks.filter(st => st !== s))} className="ml-2 text-slate-400 hover:text-red-400"><X size={14} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="h-[500px] w-full bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
                            {compareData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={compareData}>
                                        <defs>
                                            <linearGradient id="color0" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis dataKey="month" stroke="#475569" />
                                        <YAxis stroke="#475569" />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                                        {compareStocks.map((stock, idx) => (
                                            <Area
                                                key={stock}
                                                type="monotone"
                                                dataKey={stock}
                                                stroke={idx === 0 ? '#6366f1' : '#06b6d4'}
                                                fill={`url(#color${idx % 2})`}
                                                strokeWidth={3}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500">
                                    Add stocks to compare their relative performance
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketHub;
