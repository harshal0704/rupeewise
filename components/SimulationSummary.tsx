import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, ShieldAlert, BarChart3, 
  Activity, Zap, PieChart, Info, CalendarSync 
} from 'lucide-react';
import { MarkdownRenderer } from '../services/markdownRenderer';

interface SummaryState {
  stock: string;
  strategy: string;
  metrics: {
    finalValue: string;
    cagr: string;
    maxDrawdown: string;
    sharpe: string;
  };
  analysis: string;
}

const SimulationSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SummaryState;

  if (!state || !state.metrics) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-surface-2 rounded-3xl flex items-center justify-center mb-6 border border-surface-3 shadow-inner">
          <Activity size={32} className="text-zinc-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No Simulation Data Found</h2>
        <p className="text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
          It looks like you arrived here without running a backtest first. Return to the Sandbox to run a simulation.
        </p>
        <button 
          onClick={() => navigate('/invest')}
          className="px-8 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary-glow transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
        >
          <ArrowLeft size={18} /> Return to Sandbox
        </button>
      </div>
    );
  }

  const { stock, strategy, metrics, analysis } = state;

  const getStrategyName = (id: string) => {
    switch (id) {
      case 'buy_hold': return 'Buy & Hold (Benchmark)';
      case 'sma_crossover': return 'SMA 50/200 Crossover';
      case 'rsi_mean_reversion': return 'RSI Mean Reversion';
      case 'ema_trend_following': return 'EMA Trend Following';
      default: return id.replace(/_/g, ' ').toUpperCase();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto px-4 sm:px-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-surface-3 pb-6 gap-4 mt-4">
        <div>
          <button 
            onClick={() => navigate('/invest')}
            className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:text-primary-glow transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Simulator
          </button>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
             <BarChart3 className="text-primary" size={28} /> Strategy Overview
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
             Detailed Analysis for {stock}
          </p>
        </div>
        
        <div className="bg-surface-1 border border-surface-3 p-4 rounded-2xl flex items-center gap-6 shadow-inner">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asset</p>
              <p className="text-lg font-black text-white">{stock}</p>
            </div>
            <div className="w-[1px] h-8 bg-surface-3"></div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Strategy Applied</p>
              <p className="text-sm font-black text-primary">{getStrategyName(strategy)}</p>
            </div>
        </div>
      </header>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Final Capital', val: `₹${metrics.finalValue}`, col: 'text-white', icon: <PieChart size={16} className="text-primary" /> },
          { label: 'CAGR (Growth)', val: `${metrics.cagr}%`, col: 'text-emerald-400', icon: <TrendingUp size={16} className="text-emerald-400" /> },
          { label: 'Max Drawdown', val: `-${metrics.maxDrawdown}%`, col: 'text-error', icon: <ShieldAlert size={16} className="text-error" /> },
          { label: 'Sharpe Ratio', val: metrics.sharpe, col: 'text-amber-400', icon: <Activity size={16} className="text-amber-400" /> },
        ].map((m, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border-surface-3 flex flex-col justify-between group hover:border-surface-4 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{m.label}</p>
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-surface-3 group-hover:bg-surface-3 transition-colors">
                {m.icon}
              </div>
            </div>
            <p className={`text-2xl font-black tracking-tighter ${m.col}`}>{m.val}</p>
          </div>
        ))}
      </div>

      {/* AI ANALYSIS */}
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-surface-1 to-zinc-950/50 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
        
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 mb-8 relative z-10">
          <Zap size={20} className="text-primary fill-primary/20" /> 
          AI Wealth Insight
        </h3>
        
        <div className="prose prose-invert prose-emerald max-w-none relative z-10 text-zinc-300 font-medium leading-loose prose-h3:text-white prose-h3:tracking-tight prose-h3:text-xl prose-strong:text-emerald-400 prose-li:marker:text-primary">
          <MarkdownRenderer content={analysis} />
        </div>
        
        <div className="mt-10 pt-6 border-t border-surface-3 flex items-start gap-4 text-xs text-zinc-500 font-medium">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>
                This analysis is generated by AI based on historical market data and backtest performance. Past performance is not indicative of future results. For informational and educational purposes only.
            </p>
        </div>
      </div>

    </div>
  );
};

export default SimulationSummary;
