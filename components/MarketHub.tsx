import React, { useState, useEffect } from 'react';
import { runStockSimulation, screenStocks, getHistoricalComparison } from '../services/geminiService';
import { finnhub, NewsItem } from '../services/finnhub';
import { newsService, UnifiedNewsItem } from '../services/newsService';
import { MarkdownRenderer } from '../services/markdownRenderer';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { LineChart as LineChartIcon, Bot, Search, GitCompare, Plus, X, Newspaper, RefreshCw, CheckCircle, Activity, ChevronRight, ExternalLink } from 'lucide-react';
import { TradingViewChart } from './TradingViewChart';
import { TickerTape } from './TickerTape';
import { eodhdService } from '../services/eodhdService';
import { api } from '../services/api';

const MarketHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'screener' | 'compare' | 'news'>('stocks');

    // Analysis State
    const [ticker, setTicker] = useState('AAPL');
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
    const [news, setNews] = useState<UnifiedNewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [newsCategory, setNewsCategory] = useState('general');

    // Order State
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [orderPrice, setOrderPrice] = useState<string>('');
    const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
    const [orderLoading, setOrderLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true);
            try {
                const cat = activeTab === 'news' ? newsCategory : 'general';
                const data = await newsService.getAggregatedNews(cat);
                setNews(data.slice(0, 30));
            } catch (error) {
                console.error("News fetch error:", error);
            } finally {
                setNewsLoading(false);
            }
        };

        fetchNews();
    }, [ticker, activeTab, newsCategory]);

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

    const handleTrade = async () => {
        if (!user || !ticker) return;
        setOrderLoading(true);
        try {
            // 1. Fetch current price if not set
            let price = parseFloat(orderPrice);
            if (!price || isNaN(price)) {
                // Fetch real-time price via EODHD
                const quote = await eodhdService.getLivePrice(ticker);
                price = quote?.price || 0;
            }

            if (price <= 0) {
                alert("Could not fetch valid price. Please enter manually.");
                setOrderLoading(false);
                return;
            }

            if (orderType === 'buy') {
                // Insert into Portfolio
                const { error } = await supabase.from('portfolio_holdings').insert([{
                    user_id: user.id,
                    symbol: ticker,
                    name: ticker,
                    quantity: orderQuantity,
                    avg_price: price,
                    type: activeTab === 'crypto' ? 'Crypto' : 'Stock'
                }]);

                if (error) throw error;
                alert(`Successfully bought ${orderQuantity} shares of ${ticker} at ₹${price}`);
            } else {
                // Sell logic - verify holdings and book profit
                const { data: holdings, error: fetchError } = await supabase
                    .from('portfolio_holdings')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('symbol', ticker);

                if (fetchError) throw fetchError;

                if (!holdings || holdings.length === 0) {
                    alert("You do not own this asset in your portfolio.");
                    setOrderLoading(false);
                    return;
                }

                const totalQty = holdings.reduce((sum: number, h: any) => sum + h.quantity, 0);
                if (totalQty < orderQuantity) {
                    alert(`Insufficient quantity. You only own ${totalQty} shares.`);
                    setOrderLoading(false);
                    return;
                }

                let totalInvested = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.avg_price), 0);
                let avgCostBasis = totalInvested / totalQty;
                let profit = (price - avgCostBasis) * orderQuantity;

                let remainingToSell = orderQuantity;
                for (const h of holdings) {
                    if (remainingToSell <= 0) break;

                    if (h.quantity <= remainingToSell) {
                        await supabase.from('portfolio_holdings').delete().eq('id', h.id);
                        remainingToSell -= h.quantity;
                    } else {
                        await supabase.from('portfolio_holdings').update({ quantity: h.quantity - remainingToSell }).eq('id', h.id);
                        remainingToSell = 0;
                    }
                }

                await api.transactions.add({
                    id: '',
                    merchant: `Sold ${orderQuantity} ${ticker} (${profit >= 0 ? 'Profit' : 'Loss'})`,
                    amount: Math.abs(profit),
                    type: profit >= 0 ? 'credit' : 'debit',
                    category: 'Investment',
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Cash'
                });

                alert(`Successfully sold ${orderQuantity} shares. Booked a ${profit >= 0 ? 'profit' : 'loss'} of ₹${Math.abs(profit).toFixed(2)} in transaction history!`);
            }

            setOrderQuantity(1);
            setOrderPrice('');

        } catch (error: any) {
            console.error("Trade Error:", error);
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
                <p className="text-zinc-400 mb-6">Advanced Trading Simulator & Analysis</p>

                {/* Ticker Tape */}
                <div className="rounded-xl overflow-hidden border border-zinc-700/50 shadow-lg">
                    <TickerTape />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-700/50 overflow-x-auto gap-6 mt-6">
                {['stocks', 'crypto', 'screener', 'news'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 px-2 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === tab
                            ? 'border-primary text-primary'
                            : 'border-transparent text-zinc-400 hover:text-white'
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
                                    <TradingViewChart symbol={activeTab === 'crypto' ? "BITSTAMP:BTCUSD" : ticker.endsWith('.NS') ? `NSE:${ticker.replace('.NS', '')}` : ticker.endsWith('.BO') ? `BSE:${ticker.replace('.BO', '')}` : ticker.includes(':') ? ticker : `NSE:${ticker}`} />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="glass-panel p-6 rounded-3xl flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                        className="bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-xl outline-none focus:border-primary w-32 font-bold"
                                        placeholder="SYMBOL"
                                    />
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-xl outline-none focus:border-primary"
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
                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                                        <MarkdownRenderer content={result.analysis} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar: Trading & News */}
                        <div className="space-y-6">
                            {/* Trading Panel */}
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="text-lg font-bold text-white mb-4">Place Order</h3>
                                <div className="flex gap-2 mb-4 p-1 bg-zinc-800 rounded-xl">
                                    <button
                                        onClick={() => setOrderType('buy')}
                                        className={`flex-1 py-2 rounded-lg font-bold transition-colors ${orderType === 'buy' ? 'bg-green-500/20 text-green-400' : 'text-zinc-400 hover:bg-zinc-700'}`}>Buy</button>
                                    <button
                                        onClick={() => setOrderType('sell')}
                                        className={`flex-1 py-2 rounded-lg font-bold transition-colors ${orderType === 'sell' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:bg-zinc-700'}`}>Sell</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 font-semibold uppercase">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={orderQuantity}
                                            onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 font-semibold uppercase">Price Limit (₹)</label>
                                        <input
                                            type="number"
                                            value={orderPrice}
                                            onChange={(e) => setOrderPrice(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary mt-1"
                                            placeholder="Market Price"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-zinc-700/50 flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Margin Required</span>
                                        <span className="text-white font-bold">
                                            {orderPrice && orderQuantity > 0
                                                ? `₹${(parseFloat(orderPrice) * orderQuantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                : 'Enter price'}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleTrade}
                                        disabled={orderLoading || !ticker}
                                        className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${orderType === 'buy' ? 'bg-green-600 hover:bg-green-500 shadow-green-600/20' : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'}`}
                                    >
                                        {orderLoading ? <RefreshCw className="animate-spin" /> : orderType === 'buy' ? "Execute Buy Trade" : "Execute Sell Trade"}
                                    </button>
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
                            <p className="text-zinc-400 mb-8">Find hidden gems using natural language. Try "High growth IT stocks with low debt".</p>

                            <form onSubmit={handleScreenerSearch} className="relative max-w-xl mx-auto">
                                <input
                                    type="text"
                                    value={screenerQuery}
                                    onChange={(e) => setScreenerQuery(e.target.value)}
                                    placeholder="Describe your strategy..."
                                    className="w-full pl-6 pr-14 py-4 rounded-full bg-zinc-900 border border-zinc-700 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                                                <p className="text-xs text-zinc-400">{item.name}</p>
                                            </div>
                                            <span className="bg-zinc-800 text-white text-xs font-bold px-3 py-1 rounded-lg border border-zinc-700">
                                                {item.price}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-300 leading-relaxed border-t border-zinc-700/50 pt-4">
                                            {item.reasoning}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* News Tab */}
                {activeTab === 'news' && (
                    <div className="lg:col-span-3">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                                    <Newspaper size={32} className="text-primary" />
                                    {newsCategory === 'general' ? 'Market Wide Pulse' :
                                        newsCategory === 'crypto' ? 'Digital Asset Intelligence' :
                                            newsCategory === 'forex' ? 'Global Currency Desk' :
                                                newsCategory === 'merger' ? 'M&A & Deal Flow' :
                                                    newsCategory.charAt(0).toUpperCase() + newsCategory.slice(1) + ' Briefing'}
                                </h2>
                                <p className="text-zinc-500 font-medium mt-1">Aggregated insights from 12+ premium financial providers</p>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[
                                    { id: 'general', label: 'Market Wide' },
                                    { id: 'crypto', label: 'Crypto' },
                                    { id: 'forex', label: 'Forex' },
                                    { id: 'merger', label: 'M&A' },
                                    { id: 'technology', label: 'Tech' },
                                    { id: 'business', label: 'Business' },
                                    { id: 'economy', label: 'Economy' }
                                ].map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setNewsCategory(cat.id)}
                                        className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${newsCategory === cat.id
                                                ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]'
                                                : 'bg-surface-2 text-zinc-500 border-surface-3 hover:border-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {newsLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="glass-panel p-0 overflow-hidden rounded-3xl border border-surface-3 h-[420px] animate-pulse">
                                        <div className="w-full h-48 bg-surface-3" />
                                        <div className="p-6 space-y-4">
                                            <div className="h-4 bg-surface-3 rounded w-1/4" />
                                            <div className="h-6 bg-surface-3 rounded w-full" />
                                            <div className="h-6 bg-surface-3 rounded w-3/4" />
                                            <div className="h-20 bg-surface-3 rounded w-full" />
                                        </div>
                                    </div>
                                ))
                            ) : news.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center glass-panel rounded-[3rem] border-surface-3">
                                    <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mb-6">
                                        <RefreshCw size={32} className="text-zinc-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Headlines Found</h3>
                                    <p className="text-zinc-500 max-w-sm">We couldn't aggregate news for this category. Try switching to Market Wide for the latest updates.</p>
                                </div>
                            ) : (
                                news.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group cursor-pointer glass-panel !bg-surface-1/40 hover:!bg-surface-2/60 p-0 overflow-hidden rounded-[2rem] border border-surface-3 transition-all hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col h-[480px] relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {item.image ? (
                                            <div className="w-full h-48 overflow-hidden relative shrink-0">
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent z-10" />
                                                <img
                                                    src={item.image}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 bg-surface-2 flex flex-col gap-2 items-center justify-center text-zinc-700 border-b border-surface-3 shrink-0">
                                                <Activity size={48} className="opacity-20" />
                                                <span className="text-[10px] uppercase font-black tracking-[0.2em]">{item.source}</span>
                                            </div>
                                        )}

                                        <div className="p-6 flex flex-col flex-1 relative z-10">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[9px] font-black text-white bg-primary/90 px-2.5 py-1 rounded-lg shadow-sm tracking-[0.1em] uppercase border border-white/10 group-hover:bg-primary transition-colors">
                                                    {item.source}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                    {new Date(item.datetime * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>

                                            <h3 className="font-black text-white text-lg leading-[1.3] group-hover:text-primary transition-colors mb-3 line-clamp-3 tracking-tight">
                                                {item.headline}
                                            </h3>

                                            <p className="text-sm text-zinc-400 font-medium line-clamp-4 leading-relaxed group-hover:text-zinc-300 transition-colors">
                                                {item.summary}
                                            </p>

                                            <div className="mt-auto pt-4 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-zinc-600 group-hover:text-primary transition-colors flex items-center gap-1">
                                                    READ FULL ARTICLE <ChevronRight size={12} />
                                                </span>
                                                <ExternalLink size={14} className="text-zinc-800 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketHub;
