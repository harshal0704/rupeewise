import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink, TrendingUp, TrendingDown, PieChart, Shield, Activity, LineChart as LineChartIcon, ActivitySquare } from 'lucide-react';
import { screenerService } from '../services/screenerService';
import { msnFinance, MSNQuote } from '../services/msnFinance';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

const StockDetails: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [insightLoading, setInsightLoading] = useState(true);
    const [insights, setInsights] = useState<any>(null);
    const [quote, setQuote] = useState<MSNQuote | null>(null);

    useEffect(() => {
        if (!symbol) return;
        
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const quoteData = await msnFinance.getQuotes([symbol]);
                if (quoteData && quoteData.length > 0) {
                    setQuote(quoteData[0]);
                }
            } catch (err) {
                console.error("Quote fetch error", err);
            } finally {
                setLoading(false);
            }

            setInsightLoading(true);
            try {
                const aiData = await screenerService.analyzeStock(symbol);
                setInsights(aiData);
            } catch (err) {
                console.error("Insights fetch error", err);
            } finally {
                setInsightLoading(false);
            }
        };

        fetchDetails();
    }, [symbol]);

    if (!symbol) return null;

    const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
    const screenerUrl = `https://www.screener.in/company/${cleanSymbol}/`;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in overflow-y-auto custom-scrollbar pb-20">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-8 mt-2 sticky top-0 bg-surface-0/90 backdrop-blur-md z-30 py-4 border-b border-surface-3">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-3 rounded-full hover:bg-surface-2 transition-colors bg-surface-1 border border-surface-3 text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">{symbol}</h1>
                            <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest">
                                AI Analysis
                            </div>
                        </div>
                        {quote ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-white">₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                <span className={`flex items-center text-sm font-bold ${quote.change >= 0 ? 'text-success' : 'text-error'}`}>
                                    {quote.change >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                                    {Math.abs(quote.changePercent).toFixed(2)}%
                                </span>
                            </div>
                        ) : loading ? (
                            <p className="text-zinc-500 animate-pulse text-sm">Loading live data...</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => navigate('/invest', { state: { ticker: symbol } })} className="px-6 py-3 bg-surface-2 hover:bg-surface-3 transition-colors border border-surface-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white shadow-sm group">
                        <LineChartIcon size={16} className="text-primary group-hover:scale-110 transition-transform" /> Alpha Terminal
                    </button>
                    <a href={screenerUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-primary hover:bg-primary-glow transition-all rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        Open in Screener.in <ExternalLink size={14} className="text-white/80" />
                    </a>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Chart & Quick Stats */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Advanced Chart */}
                    <div className="glass-panel rounded-[2.5rem] border border-surface-3 shadow-2xl relative bg-[#131722] overflow-hidden h-[600px] flex flex-col">
                        <div className="p-5 border-b border-surface-3 bg-[#1e222d] flex justify-between items-center">
                            <h3 className="text-white font-black flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                                <ActivitySquare size={18} className="text-primary" /> Live Technical Analysis
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Real-time Data</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <AdvancedRealTimeChart
                                symbol={(() => {
                                    let s = symbol.toUpperCase();
                                    if (s.endsWith('.NS')) s = s.replace('.NS', '');
                                    if (s.endsWith('.BO')) s = s.replace('.BO', '');
                                    if (s.includes(':')) return s;
                                    
                                    const isUS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'].includes(s);
                                    if (isUS) return `NASDAQ:${s}`;
                                    
                                    // Default Indian stocks to BSE to ensure widget loads correctly, since NSE is often blocked
                                    return `BSE:${s}`;
                                })()}
                                theme="dark"
                                autosize
                                hide_legend={false}
                                hide_side_toolbar={false}
                                allow_symbol_change={false}
                                details={true}
                                calendar={true}
                                container_id="tradingview_stock_details"
                            />
                        </div>
                    </div>

                    {/* AI Fundamentals Overview */}
                    <div className="glass-panel p-10 rounded-[2.5rem] border border-surface-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                        <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-widest mb-8">
                            <Activity size={24} className="text-primary" /> Executive Intelligence Summary
                        </h3>
                        {insightLoading ? (
                            <div className="flex items-center gap-3 text-zinc-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                                <RefreshCw size={20} className="animate-spin text-primary" /> Synthesizing Market Intelligence...
                            </div>
                        ) : insights?.summary ? (
                            <div className="relative">
                                <p className="text-white text-2xl leading-relaxed font-black tracking-tight drop-shadow-sm">
                                    {insights.summary}
                                </p>
                                <div className="mt-6 flex gap-4">
                                    <div className="h-1 w-20 bg-primary rounded-full" />
                                    <div className="h-1 w-10 bg-surface-3 rounded-full" />
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-500 italic">Financial intelligence not available for this ticker.</p>
                        )}
                    </div>
                </div>

                {/* Right Column - Deep Dive Analytics */}
                <div className="space-y-6">
                    {insightLoading ? (
                        <div className="glass-panel p-12 rounded-3xl border border-surface-3 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 border-4 border-surface-3 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <RefreshCw size={32} className="text-primary m-6 opacity-0" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Running Deep Dive</h3>
                            <p className="text-sm text-zinc-400 max-w-[200px]">Analyzing financials, valuations, and market sentiment...</p>
                        </div>
                    ) : insights ? (
                        <>
                            {/* Key Metrics Grid */}
                            <div className="glass-panel p-6 rounded-3xl border border-surface-3 space-y-4">
                                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-widest mb-2">
                                    <PieChart size={18} className="text-primary" /> Valuation Metrics
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {insights.ratios?.slice(0, 6).map((r: any, idx: number) => (
                                        <div key={idx} className="bg-surface-2 p-4 rounded-2xl border border-surface-3 hover:border-primary/30 transition-colors">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5">{r.label}</p>
                                            <p className="text-lg font-black text-white tracking-tight">{r.value || 'N/A'}</p>
                                        </div>
                                    ))}
                                    {(!insights.ratios || insights.ratios.length === 0) && (
                                        <p className="text-sm text-zinc-500 col-span-2 py-4">Metrics not available for this entity.</p>
                                    )}
                                </div>
                            </div>

                            {/* Pros */}
                            <div className="bg-success/5 border border-success/20 p-6 rounded-3xl relative overflow-hidden shadow-[inset_0_0_40px_rgba(16,185,129,0.05)]">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-success/10 rounded-full blur-[50px] -mr-20 -mt-20 pointer-events-none" />
                                <h3 className="text-sm font-black text-success flex items-center gap-2 uppercase tracking-widest mb-4 relative z-10">
                                    <TrendingUp size={18} strokeWidth={3} /> Strengths & Tailwinds
                                </h3>
                                <ul className="text-zinc-300 space-y-3 relative z-10 font-medium text-sm">
                                    {insights.pros?.length > 0 ? insights.pros.map((p: string, i: number) => (
                                        <li key={i} className="flex gap-3 leading-relaxed">
                                            <span className="text-success mt-0.5 select-none text-lg leading-none">•</span> 
                                            <span>{p}</span>
                                        </li>
                                    )) : <li className="text-zinc-500">No significant strengths flagged.</li>}
                                </ul>
                            </div>

                            {/* Cons */}
                            <div className="bg-error/5 border border-error/20 p-6 rounded-3xl relative overflow-hidden shadow-[inset_0_0_40px_rgba(239,68,68,0.05)]">
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-error/10 rounded-full blur-[50px] -mr-20 -mb-20 pointer-events-none" />
                                <h3 className="text-sm font-black text-error flex items-center gap-2 uppercase tracking-widest mb-4 relative z-10">
                                    <Shield size={18} strokeWidth={3} /> Weaknesses & Risks
                                </h3>
                                <ul className="text-zinc-300 space-y-3 relative z-10 font-medium text-sm">
                                    {insights.cons?.length > 0 ? insights.cons.map((p: string, i: number) => (
                                        <li key={i} className="flex gap-3 leading-relaxed">
                                            <span className="text-error mt-0.5 select-none text-lg leading-none">!</span> 
                                            <span>{p}</span>
                                        </li>
                                    )) : <li className="text-zinc-500">No significant risks flagged.</li>}
                                </ul>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default StockDetails;