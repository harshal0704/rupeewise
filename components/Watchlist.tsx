
import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Plus, X, RefreshCw, ArrowRight, ExternalLink, MoreHorizontal, AlertCircle } from 'lucide-react';
import { finnhub } from '../services/finnhub';
import { supabase } from '../services/supabaseClient';
import { screenerService } from '../services/screenerService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface WatchlistItem {
    id?: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
}

const Watchlist: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Flip Card State
    const [flippedId, setFlippedId] = useState<string | null>(null);
    const [insights, setInsights] = useState<{ [key: string]: any }>({});
    const [insightLoading, setInsightLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWatchlist();
        }
    }, [user]);

    const fetchWatchlist = async () => {
        try {
            const { data, error } = await supabase
                .from('watchlist')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                // Fetch individually from Finnhub (Free tier logic)
                const promises = data.map(async (item) => {
                    const quote = await finnhub.getQuote(item.symbol);
                    return {
                        id: item.id,
                        symbol: item.symbol,
                        name: item.name,
                        price: quote ? quote.c : 0,
                        change: quote ? quote.dp : 0, // dp is percent change in Finnhub
                    };
                });

                const mergedItems = await Promise.all(promises);
                setItems(mergedItems);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error("Error fetching watchlist:", error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem || !user) return;
        setLoading(true);
        try {
            const symbol = newItem.toUpperCase();
            // Basic check if already exists
            if (items.some(i => i.symbol === symbol)) {
                alert("Symbol already in watchlist");
                setLoading(false);
                return;
            }

            const quote = await finnhub.getQuote(symbol);

            if (quote && quote.c > 0) {
                const { error } = await supabase
                    .from('watchlist')
                    .insert([{
                        user_id: user.id,
                        symbol: symbol,
                        name: symbol, // Finnhub quote doesn't actally have name, rely on user input/symbol
                        price: quote.c,
                        change: quote.dp
                    }]);

                if (error) throw error;
                await fetchWatchlist();
                setNewItem('');
            } else {
                alert("Invalid Symbol or API Issue");
            }
        } catch (error) {
            console.error("Failed to add stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const remove = async (symbol: string) => {
        try {
            const { error } = await supabase
                .from('watchlist')
                .delete()
                .eq('symbol', symbol);

            if (error) throw error;
            setItems(items.filter(i => i.symbol !== symbol));
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const handleFlip = async (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (flippedId === symbol) {
            setFlippedId(null);
            return;
        }

        setFlippedId(symbol);

        // Fetch insights if not already present
        if (!insights[symbol]) {
            setInsightLoading(true);
            try {
                const data = await screenerService.analyzeStock(symbol);
                setInsights(prev => ({ ...prev, [symbol]: data }));
            } catch (error) {
                console.error("Insight fetch failed:", error);
            } finally {
                setInsightLoading(false);
            }
        }
    };

    const handleCardClick = (symbol: string) => {
        if (flippedId !== symbol) {
            navigate('/market', { state: { ticker: symbol } });
        }
    };

    if (initialLoading) return <div className="p-8 text-center text-slate-400">Loading watchlist...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Star className="text-yellow-400 fill-yellow-400" /> Watchlist
                    </h1>
                    <p className="text-slate-400">Track your favorite assets in real-time.</p>
                </div>
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add Symbol (e.g. INFY)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-primary w-48"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="p-2 bg-primary text-white rounded-xl hover:bg-primary-glow disabled:opacity-50 transition-all"
                    >
                        {loading ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={20} />}
                    </button>
                </form>
            </header>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                    <Star size={48} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">Watchlist is Empty</h3>
                    <p className="text-slate-400 mt-2">Add symbols to track their performance.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.symbol}
                            onClick={() => handleCardClick(item.symbol)}
                            className="relative h-64 perspective-1000 group cursor-pointer"
                        >
                            <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${flippedId === item.symbol ? 'rotate-y-180' : ''}`}>

                                {/* FRONT FACE */}
                                <div className="absolute inset-0 backface-hidden glass-panel p-6 rounded-2xl border border-slate-700/50 hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                {item.symbol}
                                                <ExternalLink size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />
                                            </h3>
                                            <p className="text-xs text-slate-400">{item.name}</p>
                                        </div>
                                        <button
                                            onClick={(e) => handleFlip(item.symbol, e)}
                                            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors z-20"
                                            title="View Screen Insights"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-end justify-between mt-auto">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Current Price</p>
                                            <p className="text-2xl font-bold text-white">₹{item.price?.toLocaleString()}</p>
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {item.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            {Math.abs(item.change).toFixed(2)}%
                                        </div>
                                    </div>

                                    {/* Mini Chart Decoration */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-b-2xl overflow-hidden">
                                        <div className={`h-full ${item.change >= 0 ? 'bg-green-500' : 'bg-red-500'} transition-all`} style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                                    </div>
                                </div>

                                {/* BACK FACE */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel p-6 rounded-2xl border border-primary/30 bg-slate-900/95 flex flex-col">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                                        <h3 className="font-bold text-white text-sm">Screener Insights</h3>
                                        <button
                                            onClick={(e) => handleFlip(item.symbol, e)}
                                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                                        >
                                            <X size={14} /> Close
                                        </button>
                                    </div>

                                    {insightLoading && !insights[item.symbol] ? (
                                        <div className="flex-1 flex items-center justify-center flex-col gap-2">
                                            <RefreshCw className="animate-spin text-primary" size={24} />
                                            <p className="text-xs text-slate-500">Analyzing fundamentals...</p>
                                        </div>
                                    ) : insights[item.symbol] ? (
                                        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                                                    <p className="text-[10px] text-slate-400">P/E Ratio</p>
                                                    <p className="text-sm font-bold text-white">
                                                        {insights[item.symbol]?.ratios?.find((r: any) => r.label.includes('P/E'))?.value || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                                                    <p className="text-[10px] text-slate-400">ROE</p>
                                                    <p className="text-sm font-bold text-green-400">
                                                        {insights[item.symbol]?.ratios?.find((r: any) => r.label.includes('ROE'))?.value || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                                                    <TrendingUp size={10} /> PROS
                                                </p>
                                                <ul className="text-[10px] text-slate-300 list-disc ml-3 space-y-0.5">
                                                    {insights[item.symbol].pros.slice(0, 2).map((p: string, i: number) => (
                                                        <li key={i}>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="mt-auto pt-3">
                                                <a
                                                    href={screenerService.getScreenerUrl(item.symbol)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    View on Screener.in <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-center p-4">
                                            <div className="space-y-2">
                                                <AlertCircle className="text-red-400 mx-auto" size={24} />
                                                <p className="text-xs text-slate-400">Could not load insights.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Watchlist;