import React, { useState } from 'react';
import { simulateLifeScenario, getStockPrice } from '../services/geminiService';
import { Play, RotateCcw, CheckCircle, XCircle, Search, TrendingUp, Info, Briefcase, PlusCircle, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PortfolioItem, TradeCharges } from '../types';

const SimulationSandbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'virtual-trade' | 'life-scenarios'>('virtual-trade');

  // Life Scenario State
  const [scenario, setScenario] = useState('');
  const [scenarioResult, setScenarioResult] = useState<{ analysis: string; feasible: boolean } | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Virtual Trading State
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedStock, setSearchedStock] = useState<{symbol: string, price: number, name: string} | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeQty, setTradeQty] = useState(1);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Tax Logic Constants (Delivery Equity)
  const calculateCharges = (price: number, qty: number): TradeCharges => {
    const turnover = price * qty;
    const brokerage = Math.min(20, turnover * 0.0005); // Flat 20 or 0.05%
    const stt = turnover * 0.001; // 0.1% STT on Delivery
    const exchangeCharges = turnover * 0.0000325; // NSE 0.00325%
    const sebiCharges = turnover * 0.000001; // ₹10/crore
    const stampDuty = turnover * 0.00015; // 0.015% (Buy only, applying generally here)
    const gst = (brokerage + exchangeCharges + sebiCharges) * 0.18; // 18% GST on charges
    
    const totalTax = brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty;
    
    return {
      brokerage, stt, exchangeCharges, gst, sebiCharges, stampDuty,
      totalTax,
      totalAmount: turnover + totalTax
    };
  };

  const handleScenarioSimulate = async () => {
    if (!scenario) return;
    setScenarioLoading(true);
    setScenarioResult(null);
    const res = await simulateLifeScenario(scenario);
    setScenarioResult(res);
    setScenarioLoading(false);
  };

  const handleStockSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoadingPrice(true);
    const data = await getStockPrice(searchQuery);
    if (data.price > 0) {
      setSearchedStock({ symbol: searchQuery.toUpperCase(), price: data.price, name: data.name });
      setTradeModalOpen(true);
    }
    setLoadingPrice(false);
  };

  const executeTrade = () => {
    if (!searchedStock) return;
    
    const charges = calculateCharges(searchedStock.price, tradeQty);
    const investAmt = charges.totalAmount;

    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      symbol: searchedStock.symbol,
      name: searchedStock.name,
      quantity: tradeQty,
      avgPrice: searchedStock.price, // Simplifying: treating tax as sunk cost, avg price is execution price
      currentPrice: searchedStock.price,
      investedValue: investAmt, // Tracking total cash out
      currentValue: searchedStock.price * tradeQty,
      pnl: (searchedStock.price * tradeQty) - investAmt, // Immediate loss due to taxes
      pnlPercent: (((searchedStock.price * tradeQty) - investAmt) / investAmt) * 100
    };

    setPortfolio([...portfolio, newItem]);
    setTradeModalOpen(false);
    setSearchedStock(null);
    setSearchQuery('');
    setTradeQty(1);
  };

  const chargesPreview = searchedStock ? calculateCharges(searchedStock.price, tradeQty) : null;
  const totalPortfolioValue = portfolio.reduce((acc, i) => acc + i.currentValue, 0);
  const totalInvested = portfolio.reduce((acc, i) => acc + i.investedValue, 0);
  const totalPnL = totalPortfolioValue - totalInvested;

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Top Navigation for Sandbox */}
       <div className="bg-white p-2 rounded-xl border border-gray-200 inline-flex shadow-sm mb-4">
          <button
            onClick={() => setActiveTab('virtual-trade')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'virtual-trade' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Briefcase size={16} /> Virtual Portfolio
          </button>
          <button
            onClick={() => setActiveTab('life-scenarios')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'life-scenarios' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Play size={16} /> Life Scenarios
          </button>
       </div>

       {activeTab === 'virtual-trade' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio Dashboard */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                 <div>
                   <p className="text-gray-400 text-sm font-medium mb-1">Total Portfolio Value</p>
                   <h2 className="text-3xl font-bold">₹{totalPortfolioValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h2>
                 </div>
                 <div className="text-right">
                   <p className="text-gray-400 text-sm font-medium mb-1">Total P&L</p>
                   <div className={`text-xl font-bold flex items-center justify-end ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                      {totalPnL >= 0 ? <ArrowUpRight size={20} className="ml-1"/> : <ArrowDownRight size={20} className="ml-1"/>}
                   </div>
                 </div>
              </div>

              {/* Holdings List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Wallet size={18} className="text-indigo-600"/> Your Holdings</h3>
                </div>
                {portfolio.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Briefcase size={48} className="mb-4 opacity-20" />
                    <p>Your portfolio is empty.</p>
                    <p className="text-sm">Search and buy stocks to start.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {portfolio.map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                         <div>
                            <h4 className="font-bold text-gray-900">{item.symbol}</h4>
                            <p className="text-xs text-gray-500">{item.quantity} shares • Avg. ₹{item.avgPrice.toFixed(2)}</p>
                         </div>
                         <div className="text-right">
                            <p className="font-semibold text-gray-900">₹{item.currentValue.toFixed(2)}</p>
                            <p className={`text-xs font-medium ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.pnl >= 0 ? '+' : ''}{item.pnl.toFixed(2)} ({item.pnlPercent.toFixed(2)}%)
                            </p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Trading Sidebar */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Search size={18} className="mr-2 text-indigo-600"/> Buy Stocks</h3>
                  <form onSubmit={handleStockSearch} className="relative">
                    <input 
                      type="text" 
                      placeholder="Search (e.g. TATAMOTORS)" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" disabled={loadingPrice} className="absolute right-2 top-2 p-1 text-indigo-600 hover:bg-indigo-50 rounded-md">
                      {loadingPrice ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> : <Search size={20}/>}
                    </button>
                  </form>
                  <p className="text-xs text-gray-500 mt-2">Prices fetched live via Gemini Search.</p>
               </div>
               
               {/* Quick Tips */}
               <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-900">
                 <h4 className="font-bold flex items-center mb-2"><Info size={16} className="mr-2"/> Did you know?</h4>
                 <p className="text-sm leading-relaxed opacity-80">
                   When you buy delivery shares in India, you pay STT (0.1%), Stamp Duty (0.015%), and Exchange charges apart from Brokerage!
                 </p>
               </div>
            </div>
         </div>
       )}

       {/* Buy Modal */}
       {tradeModalOpen && searchedStock && chargesPreview && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">Buy {searchedStock.symbol}</h3>
                    <p className="text-sm text-gray-500">NSE • {searchedStock.name}</p>
                  </div>
                  <button onClick={() => setTradeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
               </div>
               
               <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-gray-600 font-medium">Current Price</span>
                     <span className="text-xl font-bold text-indigo-700">₹{searchedStock.price.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center">
                       <button onClick={() => setTradeQty(Math.max(1, tradeQty-1))} className="w-10 h-10 rounded-l-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600">-</button>
                       <input 
                        type="number" 
                        value={tradeQty} 
                        onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 h-10 border-t border-b border-gray-300 text-center font-bold text-gray-800 focus:outline-none"
                       />
                       <button onClick={() => setTradeQty(tradeQty+1)} className="w-10 h-10 rounded-r-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600">+</button>
                    </div>
                  </div>

                  {/* Charges Breakdown (Groww style) */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 border border-dashed border-gray-200">
                     <div className="flex justify-between text-gray-600">
                        <span>Trade Value</span>
                        <span>₹{(searchedStock.price * tradeQty).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1">Taxes & Charges <Info size={12} className="text-gray-400"/></span>
                        <span className="text-red-500">+ ₹{chargesPreview.totalTax.toFixed(2)}</span>
                     </div>
                     <div className="pl-4 text-xs text-gray-400 space-y-1 border-l-2 border-gray-200 my-1">
                        <div className="flex justify-between"><span>Brokerage</span><span>₹{chargesPreview.brokerage.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>STT (0.1%)</span><span>₹{chargesPreview.stt.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Stamp Duty</span><span>₹{chargesPreview.stampDuty.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Exch. & GST</span><span>₹{(chargesPreview.exchangeCharges + chargesPreview.gst).toFixed(2)}</span></div>
                     </div>
                     <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                        <span>Total Required</span>
                        <span>₹{chargesPreview.totalAmount.toFixed(2)}</span>
                     </div>
                  </div>

                  <button 
                    onClick={executeTrade}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all transform active:scale-[0.98]"
                  >
                    Buy {searchedStock.symbol}
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* Life Scenarios Tab Content */}
       {activeTab === 'life-scenarios' && (
         <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <header className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">Scenario Simulator</h2>
              <p className="text-gray-600">Validate your big financial decisions.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Describe your scenario
              </label>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="e.g. I want to save for a destination wedding in Goa in 2 years..."
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleScenarioSimulate}
                  disabled={!scenario || scenarioLoading}
                  className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-70"
                >
                  {scenarioLoading ? (
                    <span className="flex items-center">
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analysing...
                    </span>
                  ) : (
                    <>
                      <Play size={18} className="mr-2" /> Run Simulation
                    </>
                  )}
                </button>
              </div>
            </div>

            {scenarioResult && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 animate-fade-in">
                <div className={`p-4 ${scenarioResult.feasible ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'} flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    {scenarioResult.feasible ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : (
                      <XCircle className="text-red-600" size={24} />
                    )}
                    <span className={`font-bold text-lg ${scenarioResult.feasible ? 'text-green-800' : 'text-red-800'}`}>
                      {scenarioResult.feasible ? 'Goal Seems Achievable' : 'Goal Needs Adjustment'}
                    </span>
                  </div>
                  <button onClick={() => {setScenarioResult(null); setScenario('');}} className="text-gray-500 hover:text-gray-700">
                    <RotateCcw size={18} />
                  </button>
                </div>
                <div className="p-6 prose prose-indigo max-w-none text-gray-700">
                  <div className="whitespace-pre-line">{scenarioResult.analysis}</div>
                </div>
              </div>
            )}
         </div>
       )}
    </div>
  );
};

export default SimulationSandbox;
