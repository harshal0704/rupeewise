import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Coins, Calculator, Radio, ExternalLink } from 'lucide-react';
import { getMarketStatus } from '../services/geminiService';

const InvestmentSimulator: React.FC = () => {
  const [amount, setAmount] = useState(5000);
  const [years, setYears] = useState(10);
  const [returnRate, setReturnRate] = useState(12);
  const [type, setType] = useState<'SIP' | 'Lumpsum'>('SIP');
  const [marketData, setMarketData] = useState<{ text: string, sources: string[] } | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      const data = await getMarketStatus();
      setMarketData(data);
    };
    fetchMarket();
  }, []);

  const data = useMemo(() => {
    const chartData = [];
    let invested = 0;
    let value = type === 'Lumpsum' ? amount : 0;

    if (type === 'Lumpsum') invested = amount;

    for (let i = 0; i <= years; i++) {
      if (i > 0) {
        if (type === 'SIP') {
          const monthlyRate = returnRate / 12 / 100;
          for (let m = 0; m < 12; m++) {
            value = (value + amount) * (1 + monthlyRate);
            invested += amount;
          }
        } else {
          value = value * (1 + returnRate / 100);
        }
      }

      chartData.push({
        year: `Year ${i}`,
        invested: Math.round(invested),
        value: Math.round(value)
      });
    }
    return chartData;
  }, [amount, years, returnRate, type]);

  const totalValue = data[data.length - 1].value;
  const totalInvested = data[data.length - 1].invested;
  const totalGain = totalValue - totalInvested;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-emerald-400" /> Investment Simulator
            </h1>
            <p className="text-slate-400">Visualize how your money grows with compounding power.</p>
          </div>
          {marketData && (
            <div className="bg-indigo-900/30 border border-indigo-800 p-3 rounded-lg text-xs max-w-xs animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Radio size={14} className="text-red-500 animate-pulse" />
                <span className="font-bold text-indigo-300 uppercase tracking-wide">Live Market Context</span>
              </div>
              <p className="text-indigo-200 font-medium">{marketData.text}</p>
              {marketData.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {marketData.sources.slice(0, 2).map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-400 hover:text-indigo-300 underline">
                      Source {i + 1} <ExternalLink size={10} className="ml-1" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="bg-slate-900/50 p-6 rounded-xl shadow-sm border border-slate-700 space-y-6 h-fit">
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setType('SIP')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'SIP' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              SIP
            </button>
            <button
              onClick={() => setType('Lumpsum')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'Lumpsum' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Lumpsum
            </button>
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
              <span>{type === 'SIP' ? 'Monthly Investment' : 'Total Investment'}</span>
              <span className="text-indigo-600">₹{amount.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min={type === 'SIP' ? 500 : 5000}
              max={type === 'SIP' ? 100000 : 5000000}
              step={type === 'SIP' ? 500 : 5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
              <span>Time Period</span>
              <span className="text-indigo-600">{years} Years</span>
            </label>
            <input
              type="range"
              min="1"
              max="40"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
              <span>Expected Annual Return</span>
              <span className="text-indigo-600">{returnRate}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={returnRate}
              onChange={(e) => setReturnRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Invested Amount</span>
              <span className="font-semibold text-white">₹{totalInvested.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Est. Returns</span>
              <span className="font-semibold text-emerald-400">+₹{totalGain.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-dashed border-slate-700">
              <span className="text-lg font-bold text-white">Total Value</span>
              <span className="text-2xl font-bold text-indigo-400">₹{totalValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-xl shadow-sm border border-slate-700 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">Wealth Projection</h3>
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#9ca3af" tick={{ fill: '#4b5563' }} />
                <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} stroke="#9ca3af" tick={{ fill: '#4b5563' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name="Total Value"
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke="#94a3b8"
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                  name="Invested Amount"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSimulator;
