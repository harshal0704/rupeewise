import React, { useState } from 'react';
import { TaxRegime } from '../types';
import { explainTaxLiablity } from '../services/geminiService';
import { FileText, Bot, HelpCircle, Calculator, ChevronRight, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const TaxSimplifier: React.FC = () => {
  const [income, setIncome] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [regime, setRegime] = useState<TaxRegime>(TaxRegime.NEW);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!income) return;
    setLoading(true);
    setExplanation(null);
    try {
      const result = await explainTaxLiablity(income, deductions, regime);
      setExplanation(result);
    } catch (error) {
      console.error("Tax calculation error:", error);
      setExplanation("Sorry, I couldn't calculate the tax right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 tracking-tight">
            AI Tax Simplifier
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stop guessing. Let our advanced AI analyze your income and explain your tax liability in plain English.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl group-hover:bg-indigo-200 transition-colors"></div>

              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
                  <Calculator className="mr-3 text-indigo-600" /> Your Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Gross Income (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        value={income || ''}
                        onChange={(e) => setIncome(parseFloat(e.target.value))}
                        placeholder="e.g. 12,00,000"
                        className="w-full pl-8 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Deductions (₹)
                      <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">80C, 80D, HRA</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        value={deductions || ''}
                        onChange={(e) => setDeductions(parseFloat(e.target.value))}
                        disabled={regime === TaxRegime.NEW}
                        placeholder={regime === TaxRegime.NEW ? "Not applicable in New Regime" : "e.g. 1,50,000"}
                        className={`w-full pl-8 pr-4 py-3.5 border rounded-xl outline-none transition-all font-medium ${regime === TaxRegime.NEW
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-50 border-gray-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-gray-900'
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Tax Regime</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setRegime(TaxRegime.NEW)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 ${regime === TaxRegime.NEW
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
                          }`}
                      >
                        <span className="font-bold text-lg">New Regime</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-white px-2 py-0.5 rounded-full border border-indigo-100 text-indigo-600">Default</span>
                      </button>
                      <button
                        onClick={() => setRegime(TaxRegime.OLD)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 ${regime === TaxRegime.OLD
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'
                          }`}
                      >
                        <span className="font-bold text-lg">Old Regime</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">With Deductions</span>
                      </button>
                    </div>
                    {regime === TaxRegime.NEW && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <p>Most deductions (like 80C, HRA) are <span className="font-bold">not allowed</span> in the New Regime. The tax rates are lower to compensate.</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleExplain}
                  disabled={!income || loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center group/btn"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={20} /> Calculating...
                    </>
                  ) : (
                    <>
                      Calculate & Explain <ChevronRight className="ml-2 group-hover/btn:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7">
            <div className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 h-full min-h-[500px] transition-all duration-500 ${explanation ? 'ring-4 ring-indigo-50/50' : ''}`}>
              {!explanation && !loading && (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center text-gray-400">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Bot size={48} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Ready to Analyze</h3>
                  <p className="max-w-xs mx-auto">Enter your income details on the left and I'll generate a personalized tax breakdown for you.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center p-10">
                  <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <Bot size={32} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Crunching Numbers...</h3>
                  <p className="text-gray-500 animate-pulse">Consulting the latest tax laws</p>
                </div>
              )}

              {explanation && (
                <div className="p-8 animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <Bot size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Tax Analysis</h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <CheckCircle size={14} className="text-emerald-500" /> Generated based on FY 2024-25
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-lg prose-indigo max-w-none text-gray-700">
                    <div className="whitespace-pre-line leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      {explanation}
                    </div>
                  </div>

                  <div className="mt-8 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm">
                    <HelpCircle size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="font-semibold mb-1">Disclaimer</p>
                      <p className="opacity-90">This is an AI-generated estimate for educational purposes only. Tax laws can be complex and subject to change. Please consult a qualified Chartered Accountant (CA) before filing your official returns.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxSimplifier;
