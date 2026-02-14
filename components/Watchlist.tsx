import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Plus, X, RefreshCw, ArrowRight } from 'lucide-react';
import { getStockPrice } from '../services/geminiService'; // Keeping for backup or fallback
import { marketstack } from '../services/marketstack';
import { supabase } from '../services/supabaseClient';
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
                // 1. Get symbols
                const symbols = data.map(item => item.symbol);

                // 2. Fetch live prices from Marketstack
                const quotes = await marketstack.getRealTimePrice(symbols);

                // 3. Merge data
                const mergedItems = data.map(item => {
                    const quote = quotes.find(q => q.symbol === item.symbol);
                    return {
                        id: item.id,
                        symbol: item.symbol,
                        name: item.name,
                        price: quote ? quote.price : 0,
                        change: quote ? quote.changePercent : 0,
                    };
                });
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
            const [quote] = await marketstack.getRealTimePrice([newItem.toUpperCase()]);

            if (quote && quote.price > 0) {
                const { error } = await supabase
                    .from('watchlist')
                    .insert([{
                        user_id: user.id,
                        symbol: quote.symbol,
                        name: quote.symbol, // Marketstack free EOD doesn't always give name, fallback to symbol
                        price: quote.price,
                        change: quote.changePercent
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

    const handleItemClick = (symbol: string) => {
        navigate('/market', { state: { ticker: symbol } });
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
                            onClick={() => handleItemClick(item.symbol)}
                            className="glass-panel p-6 rounded-2xl group hover:border-primary/50 transition-all relative cursor-pointer"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); remove(item.symbol); }}
                                className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {item.symbol}
                                        <ArrowRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-xs text-slate-400">{item.name}</p>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    {Math.abs(item.change).toFixed(2)}%
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Current Price</p>
                                    <p className="text-2xl font-bold text-white">₹{item.price?.toLocaleString()}</p>
                                </div>
                                <div className="h-10 w-24">
                                    {/* Mini Sparkline Placeholder */}
                                    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                                        <path
                                            d={`M0 20 Q 25 ${20 - item.change * 5} 50 20 T 100 ${20 - item.change * 5}`}
                                            fill="none"
                                            stroke={item.change >= 0 ? '#4ade80' : '#f87171'}
                                            strokeWidth="2"
                                        />
                                    </svg>
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
