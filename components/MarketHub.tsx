import React, { useState, useEffect } from 'react';
import { runStockSimulation, screenStocks, getHistoricalComparison } from '../services/geminiService';
import { eodhdService, EODHDNewsItem } from '../services/eodhdService';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { LineChart as LineChartIcon, Bot, Search, GitCompare, Plus, X, Newspaper, RefreshCw, CheckCircle } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { TickerTape } from './TickerTape';

const MarketHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'screener' | 'compare'>('stocks');

    // Analysis State
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

    // News State
    const [news, setNews] = useState<EODHDNewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);

    // Order State
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [orderPrice, setOrderPrice] = useState<string>('');
    const [orderLoading, setOrderLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true);
            try {
                // Use EODHD Service
                const data = await eodhdService.getMarketNews(5);
                setNews(data);
            } catch (error) {
                console.error("News fetch error:", error);
            } finally {
                setNewsLoading(false);
            }
        };

        fetchNews();
    }, [ticker, activeTab]);

    const handleAnalyze = async () => {
        if (!ticker) return;
        setLoading(true);
        try {
            // Get AI Analysis
            const data = await runStockSimulation(ticker, strategy, duration);
            setResult(data);
        } catch (error) {
            console.error("Analysis error:", error);
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

    const handleBuy = async () => {
        if (!user || !ticker) return;
        setOrderLoading(true);
        try {
            // 1. Fetch current price if not set
            let price = parseFloat(orderPrice);
            if (!price || isNaN(price)) {
                // Fetch real-time price
                const quote = await eodhdService.getLivePrice(ticker);
                price = quote.price;
            }

            if (price <= 0) {
                alert("Could not fetch valid price. Please enter manually.");
                setOrderLoading(false);
                return;
            }

            // 2. Insert into Portfolio
            const { error } = await supabase.from('portfolio_holdings').insert([{
                user_id: user.id,
                symbol: ticker,
                name: ticker, //Ideally fetch name
                quantity: orderQuantity,
                avg_price: price,
                type: activeTab === 'crypto' ? 'Crypto' : 'Stock'
            }]);

            if (error) throw error;

            alert(`Successfully bought ${orderQuantity} shares of ${ticker} at ₹${price}`);
            setOrderQuantity(1);
            setOrderPrice('');

        } catch (error: any) {
            console.error("Buy Error:", error);
            alert("Failed to place order: " + error.message);
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
                    <LineChartIcon className="text-primary" /> Market Hub
                </h1>
                <p className="text-slate-400 mb-6">Advanced Trading Simulator & Analysis</p>

                {/* Ticker Tape */}
                <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-lg">
                    <TickerTape />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-700/50 overflow-x-auto gap-6 mt-6">
                {['stocks', 'crypto', 'screener'].map((tab) => (
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
                            <div className="glass-panel p-1 rounded-3xl h-[calc(100vh-220px)] min-h-[500px] flex flex-col overflow-hidden bg-[#131722]">
                                <div className="h-full w-full">
                                    <TradingViewChart symbol={activeTab === 'crypto' ? "BITSTAMP:BTCUSD" : `NSE:${ticker}`} />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="glass-panel p-6 rounded-3xl flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                        className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl outline-none focus:border-primary w-32 font-bold"
                                        placeholder="SYMBOL"
                                    />
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl outline-none focus:border-primary"
                                    >
                                        <option value="1 Year">1 Year</option>
                                        <option value="5 Year">5 Years</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-glow transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Bot size={18} />}
                                    Generate AI Analysis
                                </button>
                            </div>

                            {/* Analysis Card */}
                            {result?.analysis && (
                                <div className="glass-panel p-6 rounded-3xl animate-fade-in">
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
                                        <input
                                            type="number"
                                            min="1"
                                            value={orderQuantity}
                                            onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 font-semibold uppercase">Price Limit (₹)</label>
                                        <input
                                            type="number"
                                            value={orderPrice}
                                            onChange={(e) => setOrderPrice(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary mt-1"
                                            placeholder="Market Price"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Margin Required</span>
                                        <span className="text-white font-bold">₹2,450.00</span>
                                    </div>

                                    <button
                                        onClick={handleBuy}
                                        disabled={orderLoading || !ticker}
                                        className="w-full py-4 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {orderLoading ? <RefreshCw className="animate-spin" /> : "Execute Trade"}
                                    </button>
                                </div>
                            </div>

                            {/* News Feed */}
                            <div className="glass-panel p-6 rounded-3xl max-h-[600px] overflow-y-auto custom-scrollbar">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 sticky top-0 bg-[#131722]/95 backdrop-blur-sm py-2 z-10">
                                    <Newspaper size={18} className="text-secondary" />
                                    Market News
                                </h3>
                                <div className="space-y-4">
                                    {newsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : news.length === 0 ? (
                                        <p className="text-slate-500 text-center py-4">No recent news found.</p>
                                    ) : (
                                        news.map((item, idx) => (
                                            <a
                                                key={idx}
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block group cursor-pointer border-b border-slate-800 pb-4 last:border-0"
                                            >
                                                <div className="flex gap-3">
                                                    {/* Image removed as EODHD doesn't always provide it reliably in free tier or formatted nicely */}
                                                    <div>
                                                        <p className="text-sm text-slate-300 group-hover:text-primary transition-colors line-clamp-3 font-medium">
                                                            {item.title}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">EODHD</span>
                                                            <span className="text-[10px] text-slate-600">
                                                                {new Date(item.date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        ))
                                    )}
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
            </div>
        </div>
    );
};

export default MarketHub;
