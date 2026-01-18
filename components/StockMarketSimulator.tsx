import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { runStockSimulation, screenStocks, getHistoricalComparison } from '../services/geminiService';
import { LineChart as LineChartIcon, Play, Bot, AlertCircle, Search, TrendingUp, Info, GitCompare, Plus, X } from 'lucide-react';

const StockMarketSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backtest' | 'screener' | 'compare'>('backtest');

  // Backtest State
  const [stock, setStock] = useState('');
  const [strategy, setStrategy] = useState('');
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

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock || !strategy) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await runStockSimulation(stock, strategy, duration);
      if (data) {
        setResult(data);
      } else {
        // Handle case where data is null (API error)
        console.error("Simulation failed to return data");
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenerQuery) return;
    setScreenerLoading(true);
    setScreenerResult(null);
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

  const removeCompareStock = (s: string) => {
    setCompareStocks(compareStocks.filter(st => st !== s));
  };

  const runComparison = async () => {
    if (compareStocks.length < 2) return;
    setCompareLoading(true);
    try {
      const result = await getHistoricalComparison(compareStocks);
      setCompareData(result.chartData || []);
    } catch (error) {
      console.error("Comparison error:", error);
    } finally {
      setCompareLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <LineChartIcon className="text-blue-600" /> Market Lab
        </h1>
        <p className="text-gray-600">Advanced AI tools for backtesting strategies and finding opportunities.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('backtest')}
          className={`pb-4 px-6 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'backtest' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Strategy Backtest
        </button>
        <button
          onClick={() => setActiveTab('screener')}
          className={`pb-4 px-6 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'screener' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          AI Stock Screener <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded ml-2">NEW</span>
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`pb-4 px-6 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'compare' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Stock Comparison
        </button>
      </div>

      {activeTab === 'backtest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Strategy Details</h2>
              <form onSubmit={handleSimulate} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stock / Index Name</label>
                  <input
                    type="text"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g., Reliance, TCS, Nifty 50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Strategy Description</label>
                  <textarea
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="e.g., SIP of ₹5000/month, Buy ₹1L when it falls 5%..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-shadow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="3 Years">3 Years</option>
                    <option value="5 Years">5 Years</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play size={18} className="mr-2" /> Run Backtest
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Graph</h3>
              {!result && !loading && (
                <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
                  <p>Enter details and run test to see the graph</p>
                </div>
              )}
              {loading && (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p className="animate-pulse">Generating simulation data...</p>
                </div>
              )}
              {result?.chartData && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#4b5563', fontSize: 12 }} />
                      <YAxis stroke="#6b7280" tick={{ fill: '#4b5563', fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#1f2937', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Portfolio Value" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="invested" name="Invested Amount" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Bot className="mr-2 text-indigo-600" /> AI Analysis
              </h3>
              {!result && !loading && (
                <p className="text-gray-400 italic">Analysis will appear here after simulation.</p>
              )}
              {loading && (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              )}
              {result?.analysis && (
                <div className="prose prose-sm prose-blue text-gray-700 max-w-none">
                  <div className="whitespace-pre-line leading-relaxed">
                    {result.analysis}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-xs flex items-start border border-yellow-200">
                    <AlertCircle size={14} className="mt-0.5 mr-2 flex-shrink-0" />
                    <span>Note: This is an AI-generated simulation based on historical trends/patterns.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'screener' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 animate-fade-in-up">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-blue-50">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Smart Stock Screener</h2>
              <p className="text-gray-600 mb-6">Ask complex queries like <span className="italic text-gray-800">"Undervalued IT stocks with high ROCE"</span>.</p>
              <form onSubmit={handleScreenerSearch} className="relative">
                <input
                  type="text"
                  value={screenerQuery}
                  onChange={(e) => setScreenerQuery(e.target.value)}
                  placeholder="Describe what you are looking for..."
                  className="w-full pl-6 pr-14 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-lg text-gray-900 transition-all"
                />
                <button
                  type="submit"
                  disabled={!screenerQuery || screenerLoading}
                  className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {screenerLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={24} />}
                </button>
              </form>
            </div>

            {screenerResult && (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                  <h3 className="text-blue-900 font-semibold mb-2 flex items-center">
                    <TrendingUp size={18} className="mr-2" /> Market Outlook
                  </h3>
                  <p className="text-blue-800 leading-relaxed">{screenerResult.summary}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top Picks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {screenerResult.results.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{item.symbol}</h4>
                            <p className="text-xs text-gray-500 font-medium">{item.name}</p>
                          </div>
                          <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">
                            {item.price}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                          {item.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 animate-fade-in-up">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center"><GitCompare className="mr-2 text-indigo-600" /> Compare Performance (Last 1 Year)</h2>

            <div className="flex gap-2 mb-6 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCompareStock()}
                  placeholder="Add stock symbol (e.g. RELIANCE)"
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addCompareStock} className="absolute right-2 top-2 p-1 text-indigo-600 hover:bg-indigo-100 rounded-md">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {compareStocks.map(s => (
                <div key={s} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  {s}
                  <button onClick={() => removeCompareStock(s)} className="ml-2 hover:text-indigo-900"><X size={14} /></button>
                </div>
              ))}
              {compareStocks.length > 0 && (
                <button onClick={runComparison} disabled={compareLoading || compareStocks.length < 2} className="px-4 py-1 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                  {compareLoading ? 'Loading...' : 'Run Comparison'}
                </button>
              )}
            </div>

            <div className="h-[400px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
              {compareLoading ? (
                <div className="text-center text-gray-500 animate-pulse">
                  <TrendingUp className="mx-auto mb-2" size={32} />
                  <p>Generating historical data...</p>
                </div>
              ) : compareData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" label={{ value: 'Performance (Base 100)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }} />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    {compareStocks.map((stock, idx) => (
                      <Line
                        key={stock}
                        type="monotone"
                        dataKey={stock}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={3}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400">Add at least 2 stocks to compare their relative performance.</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Chart shows normalized performance (all stocks start at 100). Data is simulated by AI based on historical trends.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMarketSimulator;
