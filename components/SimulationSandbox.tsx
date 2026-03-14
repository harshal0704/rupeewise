import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { analyzeBacktestResults } from '../services/geminiService';
import { yahooFinance } from '../services/yahooFinance';
import { finnhub } from '../services/finnhub';
import { MarkdownRenderer } from '../services/markdownRenderer';
import { 
  Play, TrendingUp, Search, Activity, RotateCcw, 
  Crosshair, AlertTriangle, Loader2, Globe, IndianRupee, 
  PieChart, Shield, Zap, Target, Gauge, Cpu, Layers,
  Binary, BarChart3, Presentation, Info, Save, Share2, 
  Maximize2, TrendingUp as TrendingUpIcon, Command, Terminal, ShieldAlert
} from 'lucide-react';

type MarketType = 'us' | 'india';

const SimulationSandbox: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'backtest' | 'time-machine' | 'monte-carlo' | 'volatility' | 'how-it-works'>('backtest');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // ── Helper: Normalized Data Fetching ──
  const fetchHistoricalData = async (symbol: string, market: MarketType): Promise<{ dates: string[], prices: number[], raw: any[] } | null> => {
    const yfTicker = market === 'india' 
      ? (symbol.includes('.') ? symbol : `${symbol}.NS`)
      : symbol;
    
    const data = await yahooFinance.getHistoricalData(yfTicker, '5y');
    if (!data || data.length < 20) return null;

    return {
      dates: data.map(d => d.date),
      prices: data.map(d => d.close),
      raw: data
    };
  };

  // ----------------------------------------------------
  // Mode A: Quant Backtester
  // ----------------------------------------------------
  const [btStock, setBtStock] = useState('RELIANCE');
  const [btMarket, setBtMarket] = useState<MarketType>('india');
  const [btStrategy, setBtStrategy] = useState('sma_crossover');
  const [btLoading, setBtLoading] = useState(false);
  const [btResult, setBtResult] = useState<any>(null);
  const [btError, setBtError] = useState('');

  // Autocomplete state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setShowDropdown(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
        if (btStock.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        const results = await finnhub.searchSymbol(btStock);
        setSearchResults(results.slice(0, 10));
        setIsSearching(false);
        setShowDropdown(true);
    };

    const timeoutId = setTimeout(fetchResults, 400);
    return () => clearTimeout(timeoutId);
  }, [btStock]);

  const calculateSMA = (prices: number[], period: number) => {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) sma.push(null);
      else {
        const slice = prices.slice(i - period + 1, i + 1);
        sma.push(slice.reduce((a, b) => a + b, 0) / period);
      }
    }
    return sma;
  };

  const calculateEMA = (prices: number[], period: number) => {
    const ema = [];
    const k = 2 / (period + 1);
    let prevEma = prices[0];
    for (let i = 0; i < prices.length; i++) {
      const currentEma = prices[i] * k + prevEma * (1 - k);
      ema.push(currentEma);
      prevEma = currentEma;
    }
    return ema;
  };

  const calculateRSI = (prices: number[], periods: number = 14) => {
    const rsi = new Array(prices.length).fill(null);
    if (prices.length < periods + 1) return rsi;
    
    let gains = 0, losses = 0;
    for (let i = 1; i <= periods; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    
    let avgGain = gains / periods;
    let avgLoss = losses / periods;
    rsi[periods] = 100 - (100 / (1 + (avgGain / (avgLoss || 1))));

    for (let i = periods + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (periods - 1) + gain) / periods;
      avgLoss = (avgLoss * (periods - 1) + loss) / periods;
      rsi[i] = 100 - (100 / (1 + (avgGain / (avgLoss || 1))));
    }
    return rsi;
  };

  const handleBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtLoading(true);
    setBtError('');

    try {
      const data = await fetchHistoricalData(btStock.toUpperCase(), btMarket);
      if (!data) {
        setBtError('Ticker not found. Try RELIANCE or AAPL.');
        setBtLoading(false);
        return;
      }

      const { prices, dates } = data;
      const initialCapital = 100000;
      let cash = initialCapital;
      let shares = 0;

      const chartData: any[] = [];
      let peakValue = initialCapital;
      let maxDrawdown = 0;

      const sma50 = calculateSMA(prices, 50);
      const sma200 = calculateSMA(prices, 200);
      const ema20 = calculateEMA(prices, 20);
      const rsi14 = calculateRSI(prices, 14);

      const benchmarkShares = initialCapital / prices[0];

      for (let i = 0; i < prices.length; i++) {
        const p = prices[i];
        
        // Strategy Execution
        if (btStrategy === 'buy_hold') {
          if (i === 0) { shares = Math.floor(cash / p); cash -= shares * p; }
        } else if (btStrategy === 'sma_crossover') {
          if (sma50[i] && sma200[i]) {
            if (sma50[i]! > sma200[i]! && shares === 0) { shares = Math.floor(cash / p); cash -= shares * p; }
            else if (sma50[i]! < sma200[i]! && shares > 0) { cash += shares * p; shares = 0; }
          }
        } else if (btStrategy === 'rsi_mean_reversion') {
          if (rsi14[i]) {
            if (rsi14[i]! < 30 && shares === 0) { shares = Math.floor(cash / p); cash -= shares * p; }
            else if (rsi14[i]! > 70 && shares > 0) { cash += shares * p; shares = 0; }
          }
        } else if (btStrategy === 'ema_trend_following') {
          if (ema20[i]) {
            if (p > ema20[i] && shares === 0) { shares = Math.floor(cash / p); cash -= shares * p; }
            else if (p < ema20[i] && shares > 0) { cash += shares * p; shares = 0; }
          }
        }

        const portfolioValue = cash + (shares * p);
        const benchmarkValue = benchmarkShares * p;
        if (portfolioValue > peakValue) peakValue = portfolioValue;
        const dd = ((peakValue - portfolioValue) / peakValue) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;

        if (i % 5 === 0 || i === prices.length - 1) {
          chartData.push({
            date: dates[i],
            Portfolio: Math.round(portfolioValue),
            Benchmark: Math.round(benchmarkValue)
          });
        }
      }

      const finalValue = Math.round(cash + (shares * prices[prices.length - 1]));
      const years = prices.length / 252;
      const cagr = ((Math.pow(finalValue / initialCapital, 1 / years)) - 1) * 100;
      const excessReturn = cagr - 6; // vs risk-free
      const sharpe = (excessReturn / (maxDrawdown * 0.5 || 1)).toFixed(2);

      const metrics = {
        finalValue: finalValue.toLocaleString('en-IN'),
        cagr: cagr.toFixed(2),
        maxDrawdown: maxDrawdown.toFixed(2),
        sharpe
      };

      const aiMarkdown = await analyzeBacktestResults(btStock, btStrategy, metrics);
      setBtResult({ chartData, metrics, analysis: aiMarkdown });
    } catch (err) {
      setBtError("Backtest Engine failed. Please try another symbol.");
    } finally {
      setBtLoading(false);
    }
  };

  // ----------------------------------------------------
  // Mode B: Monte Carlo (FIXED)
  // ----------------------------------------------------
  const [mcStock, setMcStock] = useState('TCS');
  const [mcLoading, setMcLoading] = useState(false);
  const [mcData, setMcData] = useState<any[]>([]);

  const runMonteCarlo = async () => {
    setMcLoading(true);
    const data = await fetchHistoricalData(mcStock.toUpperCase(), 'india');
    if (data) {
      const returns = [];
      for(let i=1; i<data.prices.length; i++) {
        returns.push((data.prices[i] - data.prices[i-1]) / data.prices[i-1]);
      }
      
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const stdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length);
      
      const simulations = 10;
      const steps = 60; // 60 days projection
      const allPaths = [];

      for(let s=0; s<simulations; s++) {
        let currentVal = 100;
        const path = [{ step: 0, val: 100 }];
        for(let i=1; i<=steps; i++) {
          // Box-Muller transform for normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const rand = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const dailyReturn = mean + stdDev * rand;
          currentVal *= (1 + dailyReturn);
          path.push({ step: i, val: Math.round(currentVal) });
        }
        allPaths.push(path);
      }

      // Merge paths for chart
      const chart = [];
      for(let i=0; i<=steps; i++) {
        const entry: any = { step: i };
        allPaths.forEach((p, idx) => entry[`sim${idx}`] = p[i].val);
        chart.push(entry);
      }
      setMcData(chart);
    }
    setMcLoading(false);
  };

  // ----------------------------------------------------
  // Mode C: Volatility Lab
  // ----------------------------------------------------
  const [volTicker, setVolTicker] = useState('RELIANCE');
  const [volData, setVolData] = useState<any[]>([]);
  const [volLoading, setVolLoading] = useState(false);

  const runVolAnalysis = async () => {
    setVolLoading(true);
    const data = await fetchHistoricalData(volTicker.toUpperCase(), 'india');
    if (data) {
      const returns = [];
      for(let i=1; i<data.prices.length; i++) {
        returns.push(((data.prices[i] - data.prices[i-1]) / data.prices[i-1]) * 100);
      }
      const bins: {[key: number]: number} = {};
      returns.forEach(r => {
        const bin = Math.round(r * 2) / 2; // 0.5% resolution
        bins[bin] = (bins[bin] || 0) + 1;
      });
      const chart = Object.entries(bins).map(([bin, count]) => ({ bin: Number(bin), count })).sort((a,b) => a.bin - b.bin);
      setVolData(chart);
    }
    setVolLoading(false);
  };

  // ----------------------------------------------------
  // Mode D: Time Machine
  // ----------------------------------------------------
  const [tmSymbol, setTmSymbol] = useState('AAPL');
  const [tmMarket, setTmMarket] = useState<MarketType>('us');
  const [tmStarted, setTmStarted] = useState(false);
  const [tmStep, setTmStep] = useState(0);
  const [tmChart, setTmChart] = useState<{ day: string, price: number }[]>([]);
  const [tmCash, setTmCash] = useState(100000);
  const [tmShares, setTmShares] = useState(0);
  const [tmCurrentPrice, setTmCurrentPrice] = useState(0);
  const [tmLoading, setTmLoading] = useState(false);
  const [tmError, setTmError] = useState('');

  const startTimeMachine = async () => {
    setTmLoading(true); setTmError('');
    const res = await fetchHistoricalData(tmSymbol.toUpperCase(), tmMarket);
    if (!res || res.prices.length < 100) {
      setTmError("Insufficient historical data.");
      setTmLoading(false); return;
    }
    const data = res.prices.map((p, i) => ({ day: `D${i+1}`, price: p }));
    setTmChart(data); setTmStep(20); setTmCurrentPrice(data[19].price);
    setTmCash(100000); setTmShares(0); setTmStarted(true); setTmLoading(false);
  };

  const tmNext = () => { if(tmStep < tmChart.length) { setTmCurrentPrice(tmChart[tmStep].price); setTmStep(tmStep + 1); } };
  const tmBuy = () => { const qty = Math.floor(tmCash / tmCurrentPrice); if(qty > 0) { setTmShares(tmShares + qty); setTmCash(tmCash - (qty * tmCurrentPrice)); } tmNext(); };
  const tmSell = () => { if(tmShares > 0) { setTmCash(tmCash + (tmShares * tmCurrentPrice)); setTmShares(0); } tmNext(); };

  // ── Global Toggles ──
  const MarketToggle = ({ m, sm }: { m: MarketType, sm: (m: MarketType) => void }) => (
    <div className="flex bg-surface-2 p-1 rounded-2xl border border-surface-3">
      <button onClick={() => sm('india')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${m === 'india' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-white'}`}>INDIAN NSE/BSE</button>
      <button onClick={() => sm('us')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${m === 'us' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-white'}`}>US EQUITIES</button>
    </div>
  );

  if (booting) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Cpu className="text-primary animate-spin" size={48} />
        <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs">Initializing Quant Core...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ═══ HEADER ═══ */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b border-surface-3 pb-8 gap-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Quant Sandbox</h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Institutional-Grade Multi-Asset Simulator</p>
            </div>
        </div>
        
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'backtest', icon: <Layers size={14} />, label: 'Backtest' },
            { id: 'monte-carlo', icon: <Zap size={14} />, label: 'Monte Carlo' },
            { id: 'volatility', icon: <BarChart3 size={14} />, label: 'Volatility' },
            { id: 'time-machine', icon: <RotateCcw size={14} />, label: 'Challenge' },
            { id: 'how-it-works', icon: <Info size={14} />, label: 'How It Works' },
          ].map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-surface-3 bg-surface-1/50">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Command size={16} className="text-primary" /> Configuration
            </h2>

            {activeTab === 'backtest' && (
              <form onSubmit={handleBacktest} className="space-y-6">
                <MarketToggle m={btMarket} sm={setBtMarket} />
                <div className="space-y-4">
                  <div className="relative" ref={searchRef}>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Alpha Symbol</label>
                    <input 
                       type="text" 
                       value={btStock} 
                       onChange={e => setBtStock(e.target.value.toUpperCase())} 
                       onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
                       className="w-full bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl text-lg font-black text-white outline-none focus:border-primary transition-all" 
                       placeholder="RELIANCE" 
                    />
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute top-[100%] left-0 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[250px] overflow-y-auto">
                            {searchResults.map((res: any, idx: number) => (
                                <div 
                                    key={idx} 
                                    className="p-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 last:border-none flex justify-between items-center group"
                                    onClick={() => {
                                        setBtStock(res.symbol);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-white text-xs truncate">{res.symbol}</p>
                                        <p className="text-[9px] text-zinc-500 truncate">{res.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Quant Strategy</label>
                    <select value={btStrategy} onChange={e => setBtStrategy(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer">
                      <option value="buy_hold">Buy & Hold (Benchmark)</option>
                      <option value="sma_crossover">SMA 50/200 Crossover</option>
                      <option value="rsi_mean_reversion">RSI Mean Reversion</option>
                      <option value="ema_trend_following">EMA Trend Following</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={btLoading} className="w-full bg-primary hover:bg-primary-glow text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group">
                  {btLoading ? <Loader2 className="animate-spin" size={18} /> : <><Play size={16} fill="currentColor" /> Run Simulation</>}
                </button>
                {btError && <p className="text-error text-[10px] font-bold text-center mt-2">{btError}</p>}
              </form>
            )}

            {activeTab === 'monte-carlo' && (
              <div className="space-y-6">
                 <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Ticker Symbol</label>
                    <input type="text" value={mcStock} onChange={e => setMcStock(e.target.value.toUpperCase())} className="w-full bg-transparent text-xl font-black text-white outline-none" />
                  </div>
                  <button onClick={runMonteCarlo} disabled={mcLoading} className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-zinc-200 transition-all">
                    Project Future
                  </button>
              </div>
            )}

            {activeTab === 'volatility' && (
              <div className="space-y-6">
                 <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Indian Ticker</label>
                    <input type="text" value={volTicker} onChange={e => setVolTicker(e.target.value.toUpperCase())} className="w-full bg-transparent text-xl font-black text-white outline-none" placeholder="INFY" />
                  </div>
                  <button onClick={runVolAnalysis} disabled={volLoading} className="w-full bg-zinc-100 text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-all">
                    Generate Profile
                  </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="lg:col-span-3 space-y-6">
          
          {activeTab === 'backtest' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cumulative CAGR', val: btResult ? `${btResult.metrics.cagr}%` : '--', col: 'text-primary' },
                  { label: 'Max Drawdown', val: btResult ? `-${btResult.metrics.maxDrawdown}%` : '--', col: 'text-error' },
                  { label: 'Sharpe Ratio', val: btResult ? btResult.metrics.sharpe : '--', col: 'text-white' },
                  { label: 'Capital', val: btResult ? `₹${btResult.metrics.finalValue}` : '--', col: 'text-white' },
                ].map((m, i) => (
                  <div key={i} className="glass-panel p-5 rounded-3xl border-surface-3 flex flex-col">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                    <p className={`text-xl font-black tracking-tighter ${m.col}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-8 rounded-[2rem] border-surface-3 h-[450px] relative bg-zinc-950/20">
                <div className="absolute top-6 left-8 flex items-center gap-2">
                    <TrendingUpIcon size={14} className="text-primary" />
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Equity Growth Chart</h3>
                </div>
                {btResult ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={btResult.chartData} margin={{ top: 60, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#27272a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#27272a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#27272a" tick={{ fontSize: 10, fontWeight: 'black' }} tickFormatter={v => `₹${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid #27272a', fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="Benchmark" stroke="#71717a" strokeWidth={2} fill="url(#bGrad)" strokeDasharray="6 6" name="Market Benchmark" />
                      <Area type="monotone" dataKey="Portfolio" stroke="#10b981" strokeWidth={4} fill="url(#pGrad)" name="Alpha Strategy" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <Activity size={60} className="mb-4" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">Core Idle</p>
                  </div>
                )}
              </div>

              {btResult?.analysis && (
                <div className="glass-panel p-8 rounded-[2rem] border-surface-3 animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[50px] rounded-full -mr-10 -mt-10" />
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-3">
                        <Zap size={16} fill="currentColor" /> Strategic Review Preview
                    </h3>
                    <button 
                        onClick={() => navigate('/simulation-summary', { 
                            state: { stock: btStock, strategy: btStrategy, metrics: btResult.metrics, analysis: btResult.analysis } 
                        })}
                        className="text-[10px] font-black uppercase tracking-widest text-black bg-primary px-4 py-2 rounded-lg hover:bg-primary-glow transition-all"
                    >
                        View Full Summary
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none text-zinc-400 text-sm font-medium line-clamp-4 relative z-10">
                    <MarkdownRenderer content={btResult.analysis} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'monte-carlo' && (
            <div className="space-y-6">
              <div className="glass-panel p-8 rounded-[2rem] border-surface-3 h-[500px] relative bg-zinc-950/20">
                <div className="absolute top-6 left-8">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Monte Carlo Simulation (10 Paths)</h3>
                </div>
                {mcData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mcData} margin={{ top: 60, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                      <XAxis dataKey="step" stroke="#27272a" tick={{ fontSize: 9 }} label={{ value: 'Trading Days', position: 'bottom', fill: '#52525b', fontSize: 9 }} />
                      <YAxis stroke="#27272a" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', fontSize: '10px' }} />
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Line key={i} type="monotone" dataKey={`sim${i}`} stroke={`hsl(${i * 36}, 70%, 50%)`} strokeWidth={1.5} dot={false} opacity={0.6} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <Zap size={60} className="mb-4" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">Run Monte Carlo to project paths</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'volatility' && (
            <div className="space-y-6">
              <div className="glass-panel p-8 rounded-[2rem] border-surface-3 h-[500px]">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-10">Return Distribution (Normal Distribution)</h3>
                {volData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                      <XAxis dataKey="bin" stroke="#27272a" tick={{ fontSize: 9 }} label={{ value: 'Daily Change %', position: 'bottom', fill: '#52525b', fontSize: 9 }} />
                      <YAxis stroke="#27272a" tick={{ fontSize: 9 }} />
                      <Tooltip cursor={{fill: '#27272a'}} contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #27272a', fontSize: '10px' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <BarChart3 size={60} className="mb-4" />
                    <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">Awaiting Analysis...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'time-machine' && (
            <div className="glass-panel rounded-[2rem] border-surface-3 overflow-hidden h-[600px] flex flex-col bg-zinc-950/20">
              {!tmStarted ? (
                <div className="m-auto text-center max-w-sm p-10 animate-fade-in">
                  <RotateCcw size={48} className="text-primary mx-auto mb-6" />
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">The Tape Challenge</h2>
                  <p className="text-zinc-500 text-xs font-bold mb-10 uppercase tracking-widest">Trade through history with ₹1,00,000</p>
                  
                  <div className="space-y-6">
                    <MarketToggle m={tmMarket} sm={setTmMarket} />
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                       <input type="text" value={tmSymbol} onChange={e => setTmSymbol(e.target.value.toUpperCase())} className="w-full bg-transparent text-center text-xl font-black text-white outline-none" />
                    </div>
                    {tmError && <p className="text-error text-[10px] font-black uppercase">{tmError}</p>}
                    <button onClick={startTimeMachine} disabled={tmLoading} className="w-full bg-primary text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-primary-glow transition-all">
                      {tmLoading ? "Loading Tape..." : "Start Challenge"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full p-8">
                  <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                    <div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Session Active</p>
                      <h3 className="text-xl font-black text-white">{tmSymbol} <span className="text-primary ml-2">₹{tmCurrentPrice.toLocaleString()}</span></h3>
                    </div>
                    <div className="flex gap-6">
                       <div className="text-right">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Net Worth</p>
                          <p className="text-lg font-black text-white">₹{(tmCash + tmShares*tmCurrentPrice).toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Cash</p>
                          <p className="text-lg font-black text-emerald-500">₹{tmCash.toLocaleString()}</p>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 mb-8">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tmChart.slice(0, tmStep)}>
                           <XAxis dataKey="day" hide />
                           <YAxis hide domain={['auto', 'auto']} />
                           <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} fill="#10b98105" isAnimationActive={false} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="flex gap-4">
                     <button onClick={tmBuy} className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all">Buy</button>
                     <button onClick={tmNext} className="flex-1 py-4 bg-zinc-800 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-700 transition-all">Hold</button>
                     <button onClick={tmSell} className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all">Sell All</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'how-it-works' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-surface-3 bg-gradient-to-br from-surface-1 to-zinc-950/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                
                <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic flex items-center gap-3 relative z-10">
                   <Info className="text-primary" size={28} /> Quant Dictionary
                </h2>
                <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-10 relative z-10">
                   Understand the institutional metrics used in the simulator
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-surface-2/50 border border-surface-3 p-6 rounded-2xl hover:border-primary/30 transition-colors group">
                    <h4 className="text-lg font-black text-white mb-2 group-hover:text-primary transition-colors flex items-center gap-2"><TrendingUp size={16} /> CAGR</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">Compound Annual Growth Rate. It represents the smoothed annualized yield of your investment, ignoring the volatility along the way. Think of it as the steady interest rate you'd need to go from your start value to your final value.</p>
                  </div>
                  
                  <div className="bg-surface-2/50 border border-surface-3 p-6 rounded-2xl hover:border-error/30 transition-colors group">
                    <h4 className="text-lg font-black text-white mb-2 group-hover:text-error transition-colors flex items-center gap-2"><ShieldAlert size={16} /> Max Drawdown</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">The largest peak-to-trough drop in your portfolio's value during the backtest timeframe. It measures the worst possible "pain" an investor would have felt buying at the top and watching it fall to the bottom.</p>
                  </div>

                  <div className="bg-surface-2/50 border border-surface-3 p-6 rounded-2xl hover:border-amber-400/30 transition-colors group">
                    <h4 className="text-lg font-black text-white mb-2 group-hover:text-amber-400 transition-colors flex items-center gap-2"><Activity size={16} /> Sharpe Ratio</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">A measure of risk-adjusted return. It tells you if the returns are due to smart investing or just taking on huge risks. A Sharpe ratio over 1.0 is considered good, meaning the returns justify the volatility.</p>
                  </div>

                  <div className="bg-surface-2/50 border border-surface-3 p-6 rounded-2xl hover:border-emerald-400/30 transition-colors group">
                    <h4 className="text-lg font-black text-white mb-2 group-hover:text-emerald-400 transition-colors flex items-center gap-2"><Layers size={16} /> SMA & EMA</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">Simple Moving Average (SMA) smooths out price data over a period. Exponential Moving Average (EMA) does the same but gives more weight to recent prices, making it react faster to trend changes. Used to identify trend directions.</p>
                  </div>

                  <div className="bg-surface-2/50 border border-surface-3 p-6 rounded-2xl hover:border-blue-400/30 transition-colors group">
                    <h4 className="text-lg font-black text-white mb-2 group-hover:text-blue-400 transition-colors flex items-center gap-2"><Zap size={16} /> Monte Carlo</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">A statistical simulation that runs thousands of randomized, projected future paths based on the asset's historical mean return and standard deviation (volatility). Helps visualize probability bands of future performance.</p>
                  </div>
                  
                  <div className="bg-surface-2/50 border border-surface-3 p-6 rounded-2xl hover:border-purple-400/30 transition-colors group">
                    <h4 className="text-lg font-black text-white mb-2 group-hover:text-purple-400 transition-colors flex items-center gap-2"><Crosshair size={16} /> RSI</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">Relative Strength Index. A momentum oscillator measuring the speed and change of price movements between 0 and 100. Usually, {'>'}70 indicates "overbought" (due for a drop), and {'<'}30 indicates "oversold" (due for a bounce).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default SimulationSandbox;
