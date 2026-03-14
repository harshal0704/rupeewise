import React, { useState, useEffect, useRef } from 'react';
import { Activity, Star, TrendingUp, TrendingDown, Plus, X, RefreshCw, ArrowRight, ExternalLink, MoreHorizontal, AlertCircle, Search, LineChart as LineChartIcon, Shield, PieChart } from 'lucide-react';
import { finnhub } from '../services/finnhub';
import { supabase } from '../services/supabaseClient';
import { msnFinance, MSNQuote } from '../services/msnFinance';
import { eodhdService } from '../services/eodhdService';
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
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Indices State
    const [indices, setIndices] = useState<MSNQuote[]>([]);

    useEffect(() => {
        if (user) {
            fetchWatchlist();
            fetchIndices();
        }
    }, [user]);

    // Handle outside click for search dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search logic
    useEffect(() => {
        const fetchResults = async () => {
            if (newItem.length < 2) {
                setSearchResults([]);
                setShowDropdown(false);
                return;
            }
            setIsSearching(true);
            const results = await finnhub.searchSymbol(newItem);
            setSearchResults(results.slice(0, 10)); // limit 10
            setIsSearching(false);
            setShowDropdown(true);
        };

        const timeoutId = setTimeout(fetchResults, 400);
        return () => clearTimeout(timeoutId);
    }, [newItem]);

    const fetchIndices = async () => {
        const data = await msnFinance.getMajorIndices();
        setIndices(data);
    };

    const fetchWatchlist = async () => {
        try {
            const { data, error } = await supabase
                .from('watchlist')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                // Fetch individually from EODHD
                const promises = data.map(async (item) => {
                    const quote = await eodhdService.getLivePrice(item.symbol);
                    return {
                        id: item.id,
                        symbol: item.symbol,
                        name: item.name,
                        price: quote ? quote.price : 0,
                        change: quote ? quote.change_p : 0,
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

    const handleAdd = async (symbol: string, companyName: string) => {
        if (!symbol || !user) return;
        setLoading(true);
        try {
            const sym = symbol.toUpperCase();
            // Basic check if already exists
            if (items.some(i => i.symbol === sym)) {
                alert("Symbol already in tracking list");
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('watchlist')
                .insert([{
                    user_id: user.id,
                    symbol: sym,
                    name: companyName || sym
                }]);

            if (error) throw error;
            await fetchWatchlist();
            setNewItem('');
            setShowDropdown(false);
        } catch (error) {
            console.error("Failed to add stock:", error);
            alert("Failed to add stock. Please verify symbol.");
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

    const handleSelectStock = (symbol: string) => {
        navigate(`/stock/${symbol}`);
    };

    const handleOpenMarketHub = (symbol: string) => {
        navigate('/market', { state: { ticker: symbol } });
    };

    if (initialLoading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw size={32} className="animate-spin text-primary" />
                <p className="text-zinc-400 font-medium tracking-widest uppercase text-xs">Loading Market Data...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in pb-20 md:pb-0">
            {/* Main Pulse Area */}
            <div className="flex-1 flex flex-col transition-all duration-500 overflow-y-auto custom-scrollbar pr-2 w-full">
                <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-8 mt-2">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                                <Activity size={20} />
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Market Pulse</h1>
                        </div>
                        <p className="text-zinc-400 font-medium">Real-time tracking and deep fundamental analysis.</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full lg:w-96" ref={searchRef}>
                        <div className="flex relative items-center">
                            <Search className="absolute left-4 text-zinc-400" size={18} />
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                                placeholder="Search company (e.g. Apple, Reliance)"
                                className="w-full bg-surface-1 border border-surface-3 rounded-2xl pl-12 pr-12 py-3.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-semibold shadow-inner"
                            />
                            <button
                                onClick={() => handleAdd(newItem, newItem)}
                                disabled={loading || !newItem}
                                className="absolute right-2 p-2 bg-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white disabled:opacity-50 transition-colors"
                            >
                                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                            </button>
                        </div>

                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-[110%] left-0 w-full bg-surface-1 border border-surface-3 rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl">
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {searchResults.map((res: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="p-3 hover:bg-surface-2 cursor-pointer border-b border-surface-3/50 last:border-none flex justify-between items-center group transition-colors"
                                            onClick={() => handleAdd(res.symbol, res.description)}
                                        >
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-white text-sm truncate">{res.symbol}</p>
                                                <p className="text-[11px] text-zinc-400 truncate">{res.description}</p>
                                            </div>
                                            <div className="text-[10px] text-primary/50 font-bold group-hover:text-primary transition-colors border border-primary/20 bg-primary/5 px-2 py-1 rounded tracking-wider uppercase">
                                                {res.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Major Indices Marquee */}
                {indices.length > 0 && (
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {indices.map((idx, i) => (
                            <div key={i} className="glass-panel p-4 rounded-2xl border border-surface-3 flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-surface-3/50 rounded-full blur-[20px] group-hover:bg-primary/10 transition-colors" />
                                <span className="text-xs font-bold text-zinc-400 tracking-wider uppercase mb-1">{idx.displayName}</span>
                                <div className="flex justify-between items-end relative z-10">
                                    <span className="text-xl font-black text-white tracking-tight">
                                        ₹{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                    <div className={`flex items-center gap-1 text-sm font-bold ${idx.change >= 0 ? 'text-success' : 'text-error'} bg-surface-0/50 px-2 py-1 rounded-lg`}>
                                        {idx.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {Math.abs(idx.changePercent).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-surface-3 rounded-[2rem] bg-surface-1/30">
                        <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mb-6 shadow-inner border border-surface-3">
                            <Activity size={32} className="text-zinc-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Your Pulse is Empty</h3>
                        <p className="text-zinc-400 max-w-sm">Search and add companies or indices to start tracking their live performance and fundamentals.</p>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                        {items.map((item) => {
                            return (
                                <div
                                    key={item.symbol}
                                    onClick={() => handleSelectStock(item.symbol)}
                                    className="glass-panel p-5 rounded-3xl border transition-all duration-300 cursor-pointer group flex flex-col h-full bg-surface-1/80 border-surface-3 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] hover:bg-surface-2 hover:-translate-y-1"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="pr-4">
                                            <h3 className="text-lg font-black text-white shrink-0 tracking-tight flex items-center gap-2 group-hover:text-primary transition-colors">
                                                {item.symbol}
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenMarketHub(item.symbol); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-surface-3 rounded-lg text-zinc-400 hover:text-white" title="Open in Sandbox">
                                                    <LineChartIcon size={14} />
                                                </button>
                                            </h3>
                                            <p className="text-[11px] text-zinc-400 font-medium truncate group-hover:text-zinc-300 transition-colors mt-0.5">{item.name}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); remove(item.symbol); }}
                                            className="p-1.5 text-zinc-500 hover:text-error hover:bg-error/10 rounded-lg transition-colors border border-transparent hover:border-error/20"
                                            title="Remove"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-end justify-between mt-auto">
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 group-hover:text-zinc-400">Current</p>
                                            <p className="text-2xl font-black text-white tracking-tight">₹{item.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className={`flex items-center gap-1 lg:gap-1.5 text-sm lg:text-base font-black px-3 py-1.5 rounded-xl border transition-colors ${item.change >= 0 ? 'text-success bg-success/10 border-success/20' : 'text-error bg-error/10 border-error/20'}`}>
                                            {item.change >= 0 ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
                                            {Math.abs(item.change).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watchlist;
