import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Plus, X, RefreshCw } from 'lucide-react';
import { getStockPrice } from '../services/geminiService';

interface WatchlistItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
}

const Watchlist: React.FC = () => {
    const [items, setItems] = useState<WatchlistItem[]>([
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2980.50, change: 1.2 },
        { symbol: 'TCS', name: 'Tata Consultancy Svcs', price: 4120.00, change: -0.5 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1450.75, change: 0.8 },
    ]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem) return;
        setLoading(true);
        try {
            const data = await getStockPrice(newItem.toUpperCase());
            if (data.price > 0) {
                setItems([...items, {
                    symbol: newItem.toUpperCase(),
                    name: data.name,
                    price: data.price,
                    change: (Math.random() * 4) - 2 // Mock change for demo
                }]);
                setNewItem('');
            }
        } catch (error) {
            console.error("Failed to add stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const remove = (symbol: string) => {
        setItems(items.filter(i => i.symbol !== symbol));
    };

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div key={item.symbol} className="glass-panel p-6 rounded-2xl group hover:border-primary/50 transition-all relative">
                        <button
                            onClick={() => remove(item.symbol)}
                            className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{item.symbol}</h3>
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
                                <p className="text-2xl font-bold text-white">₹{item.price.toLocaleString()}</p>
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
        </div>
    );
};

export default Watchlist;
