import React, { useState, useRef, useMemo } from 'react';
import { Transaction } from '../types';
import { Plus, Search, Smartphone, CreditCard, Banknote, Upload, FileText, X, Check, Calendar, Tag, ArrowUpCircle, ArrowDownCircle, RefreshCw, IndianRupee, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { parseBankStatement } from '../services/geminiService';

interface ExpenseBookProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => Promise<void>;
}

// Category color map
const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Travel: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Utility: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  Shopping: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  Health: 'bg-red-500/15 text-red-400 border-red-500/20',
  Entertainment: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Rent: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  Income: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Transfer: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  Other: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

const ExpenseBook: React.FC<ExpenseBookProps> = ({ transactions, addTransaction }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [method, setMethod] = useState<'UPI' | 'Card' | 'Cash' | 'NetBanking' | 'Other'>('UPI');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Summary stats
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t =>
      t.merchant?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.paymentMethod?.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  // Local categorizer
  const localCategorize = (m: string): string => {
    const lower = m.toLowerCase();
    if (/swiggy|zomato|restaurant|food|cafe|biryani|pizza|burger|kitchen|dine|dominos|mcdonalds/i.test(lower)) return 'Food';
    if (/uber|ola|metro|fuel|petrol|diesel|rapido|bus|train|irctc|flight|makemytrip/i.test(lower)) return 'Travel';
    if (/electric|water|gas|wifi|broadband|jio|airtel|vi|tata|bescom|bill/i.test(lower)) return 'Utility';
    if (/amazon|flipkart|myntra|shop|ajio|meesho|nykaa|store|mall|market/i.test(lower)) return 'Shopping';
    if (/hospital|pharma|medicine|doctor|apollo|medplus|health|clinic/i.test(lower)) return 'Health';
    if (/netflix|spotify|movie|game|hotstar|prime|disney|inox|pvr|youtube/i.test(lower)) return 'Entertainment';
    if (/rent|lease|maintenance|society|housing/i.test(lower)) return 'Rent';
    if (/salary|income|freelance|payment received|credit/i.test(lower)) return 'Income';
    if (/transfer|upi|neft|rtgs|imps|sent|received/i.test(lower)) return 'Transfer';
    return 'Other';
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const category = type === 'credit' ? 'Income' : localCategorize(merchant);
      const newTransaction = {
        date: entryDate,
        merchant,
        amount: parseFloat(amount),
        category: category,
        type: type,
        paymentMethod: method,
      } as any;

      await addTransaction(newTransaction);
      setAmount('');
      setMerchant('');
    } catch (error) {
      console.error("Manual entry failed:", error);
      alert("Failed to save transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setPreviewTransactions([]);
    }
  };

  const processStatement = async () => {
    if (!uploadFile) return;
    setIsProcessingFile(true);
    try {
      const result = await parseBankStatement(uploadFile);
      setPreviewTransactions(result);
    } catch (error: any) {
      console.error("Statement processing failed:", error);
      alert(error?.message || "AI could not read this file. Please ensure it's a clear statement image.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const confirmUpload = async () => {
    setIsSubmitting(true);
    let addedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    try {
      for (const t of previewTransactions) {
        const merchantSafe = t.merchant || 'Unknown';
        const isDuplicate = transactions.some(
          existing =>
            existing.date === t.date &&
            Math.abs(existing.amount - t.amount) < 0.01 &&
            (existing.merchant || '').toLowerCase().includes(merchantSafe.toLowerCase().substring(0, 5))
        );

        if (isDuplicate) {
          duplicateCount++;
        } else {
          try {
            await addTransaction(t);
            addedCount++;
          } catch (err) {
            console.error("Failed to add extracted transaction:", t, err);
            errorCount++;
          }
        }
      }

      let message = `Import complete: ${addedCount} added.`;
      if (duplicateCount > 0) message += ` ${duplicateCount} duplicates skipped.`;
      if (errorCount > 0) message += ` ${errorCount} failed to save.`;

      alert(message);
      setPreviewTransactions([]);
      setUploadFile(null);
      setActiveTab('manual');
    } catch (err) {
      console.error("Upload process error:", err);
      alert("An unexpected error occurred during import.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* ═══ SUMMARY STATS ═══ */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-[20px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Income</span>
          </div>
          <p className="text-base sm:text-xl md:text-2xl font-black text-emerald-400 tracking-tight">
            ₹{stats.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-[20px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expense</span>
          </div>
          <p className="text-base sm:text-xl md:text-2xl font-black text-red-400 tracking-tight">
            ₹{stats.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-[20px] pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-primary" />
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Balance</span>
          </div>
          <p className={`text-base sm:text-xl md:text-2xl font-black tracking-tight ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.balance >= 0 ? '+' : ''}₹{stats.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ═══ INPUT COLUMN ═══ */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border-surface-3 lg:sticky lg:top-6 bg-surface-1/50 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Entry Desk</h2>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Add or Import Data</p>
              </div>
            </div>

            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-5 sm:mb-6">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'manual' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Manual
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'upload' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                Scan PDF
              </button>
            </div>

            {activeTab === 'manual' ? (
              <form onSubmit={handleManualSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setType('debit')}
                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${type === 'debit' ? 'bg-red-500 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('credit')}
                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${type === 'credit' ? 'bg-emerald-500 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    Income
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-zinc-500" size={16} />
                      <input
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-primary outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">Amount (INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 sm:top-3 text-zinc-500 font-black">₹</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-black text-lg focus:border-primary outline-none transition-all placeholder:text-zinc-800"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1">Recipient / Source</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-3 text-zinc-500" size={16} />
                      <input
                        type="text"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-primary outline-none transition-all placeholder:text-zinc-800"
                        placeholder="e.g. Swiggy, Salary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Payment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'UPI', icon: <Smartphone size={14} /> },
                        { id: 'Card', icon: <CreditCard size={14} /> },
                        { id: 'Cash', icon: <Banknote size={14} /> }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id as any)}
                          className={`py-2 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1 border transition-all ${method === m.id ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                        >
                          {m.icon}
                          <span>{m.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-glow text-white font-black uppercase tracking-widest py-3 sm:py-4 rounded-2xl shadow-xl shadow-primary/10 transition-all flex justify-center items-center gap-2 group active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <><Plus size={18} strokeWidth={3} className="group-hover:scale-125 transition-transform" /> Commit Record</>}
                </button>
              </form>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                <div
                  className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${uploadFile ? 'border-amber-500/50 bg-amber-500/5' : 'border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                  {uploadFile ? (
                    <div className="animate-scale-in">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 border border-amber-500/30">
                        <FileText size={28} />
                      </div>
                      <p className="text-sm font-black text-white truncate max-w-[200px]">{uploadFile.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                        className="mt-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 underline"
                      >
                        Clear File
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-700 mb-4 border border-zinc-800 group-hover:text-amber-500/50 transition-colors">
                        <Upload size={28} />
                      </div>
                      <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Drop Statement</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase mt-2 leading-relaxed">PDF or Images<br />AI auto-extract</p>
                    </>
                  )}
                </div>

                {uploadFile && previewTransactions.length === 0 && (
                  <button
                    onClick={processStatement}
                    disabled={isProcessingFile}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-white font-black uppercase tracking-widest py-3 sm:py-4 rounded-2xl shadow-xl shadow-amber-900/20 transition-all flex justify-center items-center gap-2 text-xs sm:text-sm"
                  >
                    {isProcessingFile ? <><RefreshCw className="animate-spin" size={18} /> Scanning...</> : <><Search size={18} /> AI Scan</>}
                  </button>
                )}

                {previewTransactions.length > 0 && (
                  <div className="space-y-3 sm:space-y-4 animate-fade-in-up">
                    <div className="bg-emerald-500/10 text-emerald-400 p-3 sm:p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center border border-emerald-500/20">
                      <Check size={16} className="mr-2" strokeWidth={3} />
                      {previewTransactions.length} entries found
                    </div>
                    <div className="max-h-[200px] sm:max-h-[250px] overflow-y-auto custom-scrollbar border border-zinc-800 rounded-2xl divide-y divide-zinc-900 bg-zinc-950/50">
                      {previewTransactions.map((t, i) => (
                        <div key={i} className="p-3 sm:p-4 text-xs flex justify-between items-center group hover:bg-zinc-900 transition-colors">
                          <div>
                            <p className="font-black text-white uppercase tracking-tight truncate max-w-[120px]">{t.merchant}</p>
                            <p className="text-[9px] text-zinc-600 font-bold">{t.date}</p>
                          </div>
                          <span className={`font-black ${t.type === 'credit' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                            {t.type === 'credit' ? '+' : ''}₹{t.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPreviewTransactions([]); setUploadFile(null); }}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 sm:py-3 border border-zinc-800 rounded-xl text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all"
                      >
                        Discard
                      </button>
                      <button
                        onClick={confirmUpload}
                        disabled={isSubmitting}
                        className="flex-[2] py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : 'Save All'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ HISTORY COLUMN ═══ */}
        <div className="lg:col-span-2">
          <div className="bg-surface-1/30 rounded-2xl sm:rounded-[2.5rem] border border-surface-3 overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-8 border-b border-surface-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-surface-1/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter italic">Ledger Timeline</h2>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">{filteredTransactions.length} Records</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 sm:left-4 top-3 sm:top-3.5 text-zinc-600 group-focus-within:text-primary transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-inner w-full sm:w-56 md:w-64 transition-all"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-950/50 text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] border-b border-zinc-900">
                    <th className="px-6 lg:px-8 py-4 lg:py-5">Date</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5">Entity</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5">Category</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5">Via</th>
                    <th className="px-6 lg:px-8 py-4 lg:py-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <Banknote size={50} strokeWidth={1} />
                          <p className="font-black uppercase tracking-[0.4em] text-xs">No Records Found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice().reverse().map((t) => (
                      <tr key={t.id} className="group hover:bg-white/5 transition-all duration-300">
                        <td className="px-6 lg:px-8 py-5 lg:py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white tracking-tighter">
                              {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                              {new Date(t.date).getFullYear()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5 lg:py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${t.type === 'debit' ? 'border-zinc-800 text-zinc-500' : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'}`}>
                              {t.type === 'debit' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                            </div>
                            <span className="text-sm font-black text-zinc-200 group-hover:text-white transition-colors">{t.merchant}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5 lg:py-6">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-5 lg:py-6">
                          <div className="flex items-center gap-2 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                            {t.paymentMethod === 'UPI' && <Smartphone size={12} />}
                            {t.paymentMethod === 'Card' && <CreditCard size={12} />}
                            {t.paymentMethod === 'Cash' && <Banknote size={12} />}
                            <span className="text-[10px] font-bold uppercase tracking-widest">{t.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5 lg:py-6 text-right">
                          <span className={`text-sm font-black tracking-tighter ${t.type === 'debit' ? 'text-white' : 'text-emerald-400'}`}>
                            {t.type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-900/50">
              {filteredTransactions.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <Banknote size={40} strokeWidth={1} />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">No Records</p>
                  </div>
                </div>
              ) : (
                filteredTransactions.slice().reverse().map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${t.type === 'debit' ? 'border-zinc-800 bg-zinc-900 text-zinc-500' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500'}`}>
                      {t.type === 'debit' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate">{t.merchant}</p>
                        <span className={`text-sm font-black tracking-tight shrink-0 ${t.type === 'debit' ? 'text-white' : 'text-emerald-400'}`}>
                          {t.type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Other}`}>
                          {t.category}
                        </span>
                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                          {t.paymentMethod === 'UPI' && <Smartphone size={10} />}
                          {t.paymentMethod === 'Card' && <CreditCard size={10} />}
                          {t.paymentMethod === 'Cash' && <Banknote size={10} />}
                          {t.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseBook;
