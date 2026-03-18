import React, { useState, useEffect, useRef } from 'react';
import { TaxRegime, ITRDocument, Invoice } from '../types';
import { explainTaxLiablity, parseITRDocument, parseInvoice, calculateTaxEstimate, getTaxOptimizationAdvice } from '../services/geminiService';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from '../services/markdownRenderer';
import {
  FileText, Bot, HelpCircle, Calculator, ChevronRight, RefreshCw, CheckCircle, AlertTriangle,
  Upload, FileSearch, Receipt, TrendingUp, Archive, Trash2, Eye, ChevronDown,
  IndianRupee, BarChart3, Shield, Zap, Clock, Check, X, Building2,
  Briefcase, Home, Coins, PiggyBank, Heart, GraduationCap, Gift, Landmark, Star,
  Download, PieChart, Info, Lightbulb, TrendingDown, Award
} from 'lucide-react';

// ─── Tab Type ───
type CATab = 'calculator' | 'optimizer' | 'calendar' | 'itr' | 'invoices' | 'meter';

// ─── Format Indian Currency ───
const formatINR = (n: number) => n ? `₹${n.toLocaleString('en-IN')}` : '₹0';

const TaxSimplifier: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CATab>('calculator');

  // ─── Calculator State ───
  const [fy, setFy] = useState<'2024-25' | '2025-26'>('2024-25');

  // Draft income/deductions — only committed to real state on Calculate click
  const emptyIncome = { salary: 0, business: 0, capitalGains: { stcg: 0, ltcg: 0, stcgDebt: 0, ltcgDebt: 0 }, houseProperty: 0, other: 0 };
  const emptyDeductions = { section80C: 0, section80D: 0, section80E: 0, section80G: 0, hra: 0, lta: 0, nps80CCD: 0, homeLoanInterest24B: 0, savingsInterest80TTA: 0, standardDeduction: 50000 };

  const [draftIncome, setDraftIncome] = useState(emptyIncome);
  const [draftDeductions, setDraftDeductions] = useState(emptyDeductions);
  // Committed state — what was last used to calculate
  const [income, setIncome] = useState(emptyIncome);
  const [deductions, setDeductions] = useState(emptyDeductions);
  const [isDirty, setIsDirty] = useState(false); // true when draft !== committed

  const [taxResult, setTaxResult] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // ─── Optimizer State ───
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [optimizerLoading, setOptimizerLoading] = useState(false);

  // ─── ITR State ───
  const [itrDocs, setItrDocs] = useState<ITRDocument[]>([]);
  const [itrLoading, setItrLoading] = useState(false);
  const [itrUploading, setItrUploading] = useState(false);
  const [itrFile, setItrFile] = useState<File | null>(null);
  const [itrAY, setItrAY] = useState('2024-25');
  const [expandedITR, setExpandedITR] = useState<string | null>(null);
  const itrFileRef = useRef<HTMLInputElement>(null);

  // ─── Invoice State ───
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invUploading, setInvUploading] = useState(false);
  const [invFile, setInvFile] = useState<File | null>(null);
  const [invPreview, setInvPreview] = useState<any>(null);
  const invFileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Data ───
  useEffect(() => {
    if (activeTab === 'itr') fetchITRDocs();
    if (activeTab === 'invoices') fetchInvoices();
  }, [activeTab]);

  // ─── Load Saved Tax Records ───
  useEffect(() => {
    const loadRecords = async () => {
      setRecordsLoading(true);
      try {
        const record = await api.taxRecords.get(fy);
        if (record) {
          setDraftIncome(record.income);
          setDraftDeductions(record.deductions);
          setIncome(record.income);
          setDeductions(record.deductions);
          setIsDirty(false);
        } else {
          setDraftIncome(emptyIncome);
          setDraftDeductions(emptyDeductions);
          setIncome(emptyIncome);
          setDeductions(emptyDeductions);
          setIsDirty(false);
        }
        setTaxResult(null); // Clear result on year change
      } catch (e) {
        console.error("Failed to load tax records", e);
      }
      setRecordsLoading(false);
    };
    if (user) loadRecords();
  }, [fy, user]);

  const fetchITRDocs = async () => {
    setItrLoading(true);
    try { const docs = await api.itrDocuments.getAll(); setItrDocs(docs); } catch (e) { console.error(e); }
    setItrLoading(false);
  };

  const fetchInvoices = async () => {
    setInvLoading(true);
    try { const inv = await api.invoices.getAll(); setInvoices(inv); } catch (e) { console.error(e); }
    setInvLoading(false);
  };

  // ─── Tax Calculator ───
  const handleCalculate = async () => {
    // Commit draft values to real state first
    setIncome(draftIncome);
    setDeductions(draftDeductions);
    setIsDirty(false);
    // Calculate using draft values directly (state update is async)
    const result = calculateTaxEstimate(draftIncome, draftDeductions, fy);
    setTaxResult(result);
    setAiExplanation(null);

    // Save progress to Supabase
    try {
      if (user) {
        await api.taxRecords.upsert(fy, draftIncome, draftDeductions);
      }
    } catch (e) {
      console.error("Failed to save tax records", e);
    }
  };

  const handleOptimize = async () => {
    // Commit draft first if dirty
    const currentIncome = isDirty ? draftIncome : income;
    const currentDeductions = isDirty ? draftDeductions : deductions;
    const currentResult = isDirty ? calculateTaxEstimate(draftIncome, draftDeductions, fy) : taxResult;
    if (isDirty) {
      setIncome(currentIncome);
      setDeductions(currentDeductions);
      setIsDirty(false);
      setTaxResult(currentResult);
    }
    setOptimizerLoading(true);
    try {
      // Flatten capitalGains object to a single number as the service expects
      const flatIncome = {
        salary: currentIncome.salary,
        business: currentIncome.business,
        capitalGains: currentIncome.capitalGains.stcg + currentIncome.capitalGains.ltcg +
                      currentIncome.capitalGains.stcgDebt + currentIncome.capitalGains.ltcgDebt,
        houseProperty: currentIncome.houseProperty,
        other: currentIncome.other,
      };
      const result = await getTaxOptimizationAdvice(flatIncome, currentDeductions, currentResult?.recommended || 'New');
      // Normalize response — service may return array or object with suggestions key
      if (Array.isArray(result)) {
        setSuggestions(result);
      } else if (result && Array.isArray((result as any).suggestions)) {
        setSuggestions((result as any).suggestions);
      } else {
        setSuggestions([]);
      }
      setActiveTab('optimizer');
    } catch (e) {
      console.error('Optimizer error:', e);
      setSuggestions([]);
    }
    setOptimizerLoading(false);
  };

  const handleAIExplain = async () => {
    if (!taxResult) return;
    setCalcLoading(true);
    setAiExplanation(null);
    try {
      const grossIncome = income.salary + income.business + income.houseProperty + income.other + 
                          income.capitalGains.stcg + income.capitalGains.ltcg + 
                          income.capitalGains.stcgDebt + income.capitalGains.ltcgDebt;
      const totalDed = Object.values(deductions).reduce((a, b) => a + b, 0);
      const result = await explainTaxLiablity(grossIncome, totalDed, taxResult.recommended === 'New' ? TaxRegime.NEW : TaxRegime.OLD);
      setAiExplanation(result);
    } catch (e) { setAiExplanation("Sorry, couldn't generate explanation."); }
    setCalcLoading(false);
  };

  // ─── ITR Upload ───
  const handleITRUpload = async () => {
    if (!itrFile) return;
    setItrUploading(true);
    try {
      const parsed = await parseITRDocument(itrFile);
      const ay = parsed?.assessment_year || itrAY;
      const fy = parsed?.financial_year || '';

      await api.itrDocuments.upload({
        fileName: itrFile.name,
        fileSize: itrFile.size,
        fileType: itrFile.type,
        assessmentYear: ay,
        financialYear: fy,
        extractedData: parsed || {},
        aiSummary: parsed?.summary || '',
      });
      setItrFile(null);
      await fetchITRDocs();
    } catch (e) { console.error("ITR upload failed:", e); alert("Failed to process ITR. Please try again."); }
    setItrUploading(false);
  };

  const deleteITR = async (id: string) => {
    if (!confirm("Delete this ITR document?")) return;
    try { await api.itrDocuments.delete(id); setItrDocs(p => p.filter(d => d.id !== id)); } catch (e) { console.error(e); }
  };

  // ─── Invoice Upload ───
  const handleInvoiceScan = async () => {
    if (!invFile) return;
    setInvUploading(true);
    try {
      const parsed = await parseInvoice(invFile);
      setInvPreview({ ...parsed, fileName: invFile.name, fileType: invFile.type });
    } catch (e) { console.error("Invoice scan failed:", e); alert("Failed to scan invoice."); }
    setInvUploading(false);
  };

  const confirmInvoice = async () => {
    if (!invPreview) return;
    setInvUploading(true);
    try {
      await api.invoices.add({
        fileName: invPreview.fileName,
        fileType: invPreview.fileType,
        vendorName: invPreview.vendor_name,
        invoiceNumber: invPreview.invoice_number,
        invoiceDate: invPreview.invoice_date,
        dueDate: invPreview.due_date,
        subtotal: invPreview.subtotal,
        taxAmount: invPreview.tax_amount,
        totalAmount: invPreview.total_amount,
        gstNumber: invPreview.gst_number,
        lineItems: invPreview.line_items || [],
        category: invPreview.category,
        expenseType: invPreview.expense_type || 'Business',
        journalEntry: invPreview.journal_entry,
      });
      setInvPreview(null);
      setInvFile(null);
      await fetchInvoices();
    } catch (e) { console.error(e); alert("Failed to save invoice."); }
    setInvUploading(false);
  };

  const approveInvoice = async (id: string) => {
    try { await api.invoices.updateStatus(id, 'Approved'); setInvoices(p => p.map(i => i.id === id ? { ...i, status: 'Approved' as const } : i)); } catch (e) { console.error(e); }
  };

  // ─── Live Tax Meter — derived from taxResult ───
  const meterResult = taxResult || null;

  // ─── Tab Buttons ───
  const tabs: { id: CATab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'calculator', label: 'Tax Calculator', icon: <Calculator size={18} />, color: 'from-amber-500 to-yellow-500' },
    { id: 'optimizer', label: 'AI Optimizer', icon: <Bot size={18} />, color: 'from-fuchsia-500 to-purple-500' },
    { id: 'calendar', label: 'Tax Calendar', icon: <Clock size={18} />, color: 'from-indigo-500 to-blue-500' },
    { id: 'itr', label: 'ITR Vault', icon: <Archive size={18} />, color: 'from-blue-500 to-cyan-500' },
    { id: 'invoices', label: 'Invoice Scanner', icon: <Receipt size={18} />, color: 'from-emerald-500 to-green-500' },
    { id: 'meter', label: 'Tax Meter', icon: <Zap size={18} />, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* ═══ HEADER ═══ */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3 bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20">
            <Shield size={14} /> AI Chartered Accountant
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 mb-3 tracking-tight">
            Tax Advisor
          </h1>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto">
            Your intelligent tax advisor — calculate taxes, store ITRs, scan invoices, and get real-time tax estimates with citations.
          </p>
        </header>

        {/* ═══ TAB BAR ═══ */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg shadow-amber-500/10`
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 1: TAX CALCULATOR                        */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Financial Year Selector */}
              <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-zinc-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-zinc-400 flex items-center">
                    <Clock className="mr-2 text-zinc-500" size={16} /> Financial Year
                  </h2>
                  <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex">
                    {(['2024-25', '2025-26'] as const).map(year => (
                      <button
                        key={year}
                        onClick={() => setFy(year)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${fy === year ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        FY {year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Income Sources */}
              <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-zinc-700">
                <h2 className="text-lg font-bold text-white flex items-center mb-5">
                  <IndianRupee className="mr-2 text-emerald-400" size={20} /> Income Sources
                </h2>
                <div className="space-y-3">
                  {[
                    { key: 'salary', label: 'Salary Income', icon: <Briefcase size={14} />, help: 'Your annual basic salary + allowances before any exemptions.' },
                    { key: 'business', label: 'Business / Profession', icon: <Building2 size={14} />, help: 'Net profit from your business or freelancing/professional work.' },
                    { key: 'houseProperty', label: 'House Property', icon: <Home size={14} />, help: 'Rental income received. For home loan interest on self-occupied property, enter it as a negative value (e.g. -200000) or under Section 24(B).' },
                    { key: 'other', label: 'Other Sources', icon: <Coins size={14} />, help: 'Interest from savings, FDs, dividends, or any other income.' },
                  ].map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">{field.icon}</div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1 group relative w-max">
                          {field.label}
                          {field.help && (
                            <>
                              <Info size={12} className="text-zinc-600 hover:text-amber-400 transition-colors cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-800 text-zinc-300 text-[10px] normal-case tracking-normal p-2 rounded-lg border border-zinc-700 shadow-xl z-20">
                                {field.help}
                              </div>
                            </>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-zinc-500 text-sm font-bold">₹</span>
                          <input
                            type="number"
                            value={(draftIncome as any)[field.key] || ''}
                            onChange={(e) => { setDraftIncome(p => ({ ...p, [field.key]: parseFloat(e.target.value) || 0 })); setIsDirty(true); }}
                            className="w-full pl-7 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-amber-500 outline-none transition-all placeholder:text-zinc-800"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Capital Gains Sub-fields */}
                  <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950/50 space-y-3">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <TrendingUp size={12} /> Capital Gains breakdown
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1 group relative w-max">
                          STCG (Equity) - 15/20%
                          <Info size={10} className="text-zinc-600 hover:text-amber-400 transition-colors cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-800 text-zinc-300 text-[10px] normal-case tracking-normal p-2 rounded-lg border border-zinc-700 shadow-xl z-20">
                            Short-Term Capital Gains. Profits from selling stocks or equity mutual funds held for less than 12 months.
                          </div>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-zinc-500 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            value={draftIncome.capitalGains.stcg || ''}
                            onChange={(e) => { setDraftIncome(p => ({ ...p, capitalGains: { ...p.capitalGains, stcg: parseFloat(e.target.value) || 0 } })); setIsDirty(true); }}
                            className="w-full pl-6 pr-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold text-xs focus:border-amber-500 outline-none transition-all placeholder:text-zinc-700"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1 group relative w-max">
                          LTCG (Equity) - 10/12.5%
                          <Info size={10} className="text-zinc-600 hover:text-amber-400 transition-colors cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-zinc-800 text-zinc-300 text-[10px] normal-case tracking-normal p-2 rounded-lg border border-zinc-700 shadow-xl z-20">
                            Long-Term Capital Gains. Profits from selling stocks or equity mutual funds held for more than 12 months.
                          </div>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-zinc-500 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            value={draftIncome.capitalGains.ltcg || ''}
                            onChange={(e) => { setDraftIncome(p => ({ ...p, capitalGains: { ...p.capitalGains, ltcg: parseFloat(e.target.value) || 0 } })); setIsDirty(true); }}
                            className="w-full pl-6 pr-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-bold text-xs focus:border-amber-500 outline-none transition-all placeholder:text-zinc-700"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-emerald-900/20 rounded-xl border border-emerald-800/30 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Gross Total Income</span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    {formatINR(
                      draftIncome.salary + draftIncome.business + draftIncome.houseProperty + draftIncome.other +
                      draftIncome.capitalGains.stcg + draftIncome.capitalGains.ltcg +
                      draftIncome.capitalGains.stcgDebt + draftIncome.capitalGains.ltcgDebt
                    )}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-zinc-700">
                <h2 className="text-lg font-bold text-white flex items-center mb-5">
                  <PiggyBank className="mr-2 text-blue-400" size={20} /> Deductions (Old Regime)
                </h2>
                <div className="space-y-3">
                  {[
                    { key: 'section80C', label: 'Section 80C', sub: 'PPF, ELSS, LIC — Max ₹1.5L', icon: <PiggyBank size={14} />, help: 'Investments in EPF, PPF, ELSS (Tax saving mutual funds), Life Insurance premiums, or principal repayment of home loan.' },
                    { key: 'section80D', label: 'Section 80D', sub: 'Health Insurance — Max ₹75K', icon: <Heart size={14} />, help: 'Premiums paid for medical/health insurance for self, spouse, dependent children (up to ₹25k) and parents (up to ₹50k if senior citizens).' },
                    { key: 'homeLoanInterest24B', label: 'Section 24(B)', sub: 'Home Loan Interest — Max ₹2L', icon: <Home size={14} />, help: 'Interest paid on home loan for a self-occupied property. Max deduction is ₹2 Lakhs.' },
                    { key: 'section80E', label: 'Section 80E', sub: 'Education Loan Interest', icon: <GraduationCap size={14} />, help: 'Interest paid on higher education loan for self, spouse, or children. No upper limit on the deduction amount.' },
                    { key: 'nps80CCD', label: '80CCD(1B)', sub: 'NPS — Additional ₹50K', icon: <Landmark size={14} />, help: 'Additional deduction for investment in National Pension System (NPS) Tier 1 account, over and above the 80C limit.' },
                    { key: 'savingsInterest80TTA', label: '80TTA/TTB', sub: 'Savings Interest — Max ₹10K/50K', icon: <Coins size={14} />, help: 'Deduction on interest earned from savings bank accounts (up to ₹10k under 80TTA, or ₹50k for senior citizens under 80TTB). Excludes FD interest.' },
                    { key: 'section80G', label: 'Section 80G', sub: 'Donations', icon: <Gift size={14} />, help: 'Donations made to prescribed charitable institutions or relief funds. Subject to qualifying limits.' },
                    { key: 'hra', label: 'HRA Exemption', sub: 'House Rent Allowance', icon: <Building2 size={14} />, help: 'Exemption for rent paid. Calculated based on Basic Salary, actual HRA received, and rent paid. Useful if you live in a rented house.' },
                    { key: 'standardDeduction', label: 'Standard Deduction', sub: `${fy === '2025-26' ? '₹75,000 (New Regime only)' : '₹50,000 (New & Old)'}`, icon: <Star size={14} />, help: 'A flat deduction available to all salaried employees and pensioners. Automatically applied, no proof required.' },
                  ].map(field => (
                    <div key={field.key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">{field.icon}</div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 relative group w-max">
                          {field.label}
                          {field.help && (
                            <>
                              <Info size={12} className="text-zinc-600 hover:text-blue-400 transition-colors cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 bg-zinc-800 text-zinc-300 text-[10px] normal-case tracking-normal p-2 rounded-lg border border-zinc-700 shadow-xl z-20">
                                {field.help}
                              </div>
                            </>
                          )}
                        </label>
                        <span className="text-[9px] text-zinc-600">{field.sub}</span>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2.5 text-zinc-500 text-sm font-bold">₹</span>
                          <input
                            type="number"
                            value={(draftDeductions as any)[field.key] || ''}
                            onChange={(e) => { setDraftDeductions(p => ({ ...p, [field.key]: parseFloat(e.target.value) || 0 })); setIsDirty(true); }}
                            className="w-full pl-7 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 outline-none transition-all placeholder:text-zinc-800"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-900/20 rounded-xl border border-blue-800/30 flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Total Deductions</span>
                  <span className="text-lg font-extrabold text-blue-400">{formatINR(Object.values(draftDeductions).reduce((a, b) => a + b, 0))}</span>
                </div>
              </div>

              {/* Dirty Indicator */}
              {isDirty && taxResult && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 text-xs font-bold text-amber-400">
                  <Info size={14} />
                  Income or deductions changed — click <span className="underline">Calculate Tax</span> to update results.
                </div>
              )}
              {/* Calculate Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCalculate}
                  className={`flex-[2] font-bold py-4 rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 text-white ${
                    isDirty
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse'
                      : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700'
                  }`}
                >
                  <Calculator size={18} /> Calculate Tax
                </button>
                <button
                  onClick={handleOptimize}
                  disabled={calcLoading || optimizerLoading}
                  className="flex-[1] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {optimizerLoading ? <RefreshCw className="animate-spin" size={18} /> : <Bot size={18} />} Optimize
                </button>
              </div>
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-7 space-y-6">
              {!taxResult && !aiExplanation && (
                <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-zinc-700 p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                  <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Calculator size={48} className="text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-400 mb-2">Enter Your Details</h3>
                  <p className="text-zinc-500 max-w-sm">Fill in your income sources and deductions, then click "Calculate Tax" for a comprehensive comparison.</p>
                </div>
              )}

              {taxResult && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Regime Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* New Regime */}
                    <div className={`bg-zinc-900/90 rounded-3xl p-6 border-2 transition-all ${taxResult.recommended === 'New' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">New Regime</h3>
                        {taxResult.recommended === 'New' && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <Star size={10} /> Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold text-white mb-1">{formatINR(taxResult.newRegime.totalTax)}</p>
                      <p className="text-xs text-zinc-500 mb-4">Effective Rate: {taxResult.newRegime.effectiveRate}% · Monthly TDS: {formatINR(taxResult.newRegime.monthlyTds)}</p>
                      
                      {taxResult.newRegime.surcharge > 0 && (
                        <div className="text-xs text-rose-400 font-bold mb-1">
                          + Surcharge: {formatINR(taxResult.newRegime.surcharge)}
                        </div>
                      )}
                      {taxResult.newRegime.cess > 0 && (
                        <div className="text-xs text-zinc-500 font-bold mb-3 border-b border-zinc-800 pb-2">
                          + Health & Education Cess (4%): {formatINR(taxResult.newRegime.cess)}
                        </div>
                      )}

                      <div className="space-y-1.5 pt-2">
                        {taxResult.newRegime.slabBreakdown.map((s: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-zinc-400">
                            <span>{s.slab}</span>
                            <span className="font-bold text-zinc-300">{s.rate} → {formatINR(s.tax)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Old Regime */}
                    <div className={`bg-zinc-900/90 rounded-3xl p-6 border-2 transition-all ${taxResult.recommended === 'Old' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-zinc-800'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Old Regime</h3>
                        {taxResult.recommended === 'Old' && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                            <Star size={10} /> Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold text-white mb-1">{formatINR(taxResult.oldRegime.totalTax)}</p>
                      <p className="text-xs text-zinc-500 mb-4">Effective Rate: {taxResult.oldRegime.effectiveRate}% · Monthly TDS: {formatINR(taxResult.oldRegime.monthlyTds)}</p>
                      
                      {taxResult.oldRegime.surcharge > 0 && (
                        <div className="text-xs text-rose-400 font-bold mb-1">
                          + Surcharge: {formatINR(taxResult.oldRegime.surcharge)}
                        </div>
                      )}
                      {taxResult.oldRegime.cess > 0 && (
                        <div className="text-xs text-zinc-500 font-bold mb-3 border-b border-zinc-800 pb-2">
                          + Health & Education Cess (4%): {formatINR(taxResult.oldRegime.cess)}
                        </div>
                      )}

                      <div className="space-y-1.5 pt-2">
                        {taxResult.oldRegime.slabBreakdown.map((s: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-zinc-400">
                            <span>{s.slab}</span>
                            <span className="font-bold text-zinc-300">{s.rate} → {formatINR(s.tax)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Savings Banner */}
                  <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-2xl p-5 border border-emerald-700/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">You Save with {taxResult.recommended} Regime</p>
                      <p className="text-3xl font-extrabold text-emerald-400">{formatINR(taxResult.savings)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Gross Income</p>
                      <p className="text-lg font-bold text-white">{formatINR(taxResult.grossIncome)}</p>
                    </div>
                  </div>

                  {/* Visual Tax Breakdown Chart */}
                  <div className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-xl overflow-hidden mt-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
                      <BarChart3 size={16} className="text-blue-400" /> Tax Breakdown Comparison
                    </h3>
                    
                    <div className="space-y-6">
                      {/* New Regime Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                          <span>New Regime</span>
                          <span className="text-white">{formatINR(taxResult.newRegime.totalTax)}</span>
                        </div>
                        <div className="h-6 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                          {taxResult.newRegime.totalTax > 0 ? (
                            taxResult.newRegime.slabBreakdown.map((s: any, i: number) => {
                              const width = `${(s.tax / taxResult.newRegime.totalTax) * 100}%`;
                              // Distribute vibrant colors for the slabs
                              const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                              return (
                                <div 
                                  key={i} 
                                  className={`h-full ${colors[i % colors.length]} transition-all duration-1000 border-r border-zinc-900 last:border-0 relative group`}
                                  style={{ width }}
                                >
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max bg-zinc-900 border border-zinc-700 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap">
                                    {s.slab}: {formatINR(s.tax)}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full w-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold tracking-widest uppercase">
                              Zero Tax
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Old Regime Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                          <span>Old Regime</span>
                          <span className="text-white">{formatINR(taxResult.oldRegime.totalTax)}</span>
                        </div>
                        <div className="h-6 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                          {taxResult.oldRegime.totalTax > 0 ? (
                            taxResult.oldRegime.slabBreakdown.map((s: any, i: number) => {
                              const width = `${(s.tax / taxResult.oldRegime.totalTax) * 100}%`;
                              const colors = ['bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500', 'bg-amber-500'];
                              return (
                                <div 
                                  key={i} 
                                  className={`h-full ${colors[i % colors.length]} transition-all duration-1000 border-r border-zinc-900 last:border-0 relative group`}
                                  style={{ width }}
                                >
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max bg-zinc-900 border border-zinc-700 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap">
                                    {s.slab}: {formatINR(s.tax)}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full w-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold tracking-widest uppercase">
                              Zero Tax
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Explanation */}
              {(calcLoading || aiExplanation) && (
                <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-zinc-700 overflow-hidden">
                  {calcLoading && (
                    <div className="p-10 flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-4 border-amber-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin" />
                        <Bot size={28} className="absolute inset-0 m-auto text-amber-400 animate-pulse" />
                      </div>
                      <p className="text-zinc-400 animate-pulse text-sm">AI is analyzing your tax situation...</p>
                    </div>
                  )}
                  {aiExplanation && (
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
                        <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-400"><Bot size={22} /></div>
                        <div>
                          <h3 className="text-base font-bold text-white">AI Tax Analysis</h3>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> FY 2024-25 · Powered by AI</p>
                        </div>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                        <MarkdownRenderer content={aiExplanation} />
                      </div>
                      <div className="mt-4 flex items-start gap-2 p-3 bg-amber-900/20 text-amber-200 rounded-xl border border-amber-900/50 text-xs">
                        <HelpCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                        <p>This is AI-generated analysis. Consult a qualified CA before filing. Citations reference sections of the Income Tax Act 1961.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 1.5: AI OPTIMIZER                        */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'optimizer' && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Bot className="text-fuchsia-400" size={28} /> AI Tax Optimizer
                </h2>
                <p className="text-zinc-400 text-sm mt-1">Smart recommendations to legally reduce your tax liability for {fy}.</p>
              </div>
              <button onClick={handleOptimize} disabled={optimizerLoading} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                {optimizerLoading ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />} Re-analyze
              </button>
            </div>

            {optimizerLoading ? (
              <div className="bg-zinc-900/80 rounded-3xl p-16 flex flex-col items-center justify-center border border-zinc-700 shadow-xl">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-fuchsia-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-fuchsia-600 rounded-full border-t-transparent animate-spin" />
                  <Bot size={34} className="absolute inset-0 m-auto text-fuchsia-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analyzing your financial profile</h3>
                <p className="text-zinc-500 max-w-md text-center">Our AI is scanning the {fy} tax code to find the most efficient deduction strategies for your specific income distribution...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((sug, idx) => (
                  <div key={idx} className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-700 shadow-xl hover:border-fuchsia-500/50 transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20">
                        {sug.action === 'invest' ? <TrendingUp size={20} /> : sug.action === 'restructure' ? <RefreshCw size={20} /> : <Shield size={20} />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                        Section {sug.section}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">{sug.title}</h3>
                    <p className="text-sm text-zinc-400 mb-6 flex-1 line-clamp-3 leading-relaxed">{sug.description}</p>
                    
                    <div className="mt-auto bg-zinc-950 rounded-2xl p-4 border border-zinc-800/50">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <PiggyBank size={12} /> Potential Tax Saving
                      </p>
                      <p className="text-2xl font-black text-white">{formatINR(sug.potentialTaxSaved)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900/80 rounded-3xl p-16 flex flex-col items-center justify-center text-center border border-zinc-700">
                <Shield size={64} className="text-zinc-800 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Ready to Optimize</h3>
                <p className="text-zinc-500 max-w-md mb-8">Calculate your tax first on the Calculator tab, then click Optimize for personalized tax-saving strategies.</p>
                <button onClick={() => setActiveTab('calculator')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
                  Go to Calculator
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 2: TAX CALENDAR                          */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Clock className="text-indigo-400" size={28} /> Tax Deadlines
                </h2>
                <p className="text-zinc-400 text-sm mt-1">Never miss a due date. Stay compliant and avoid penalties.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Advance Tax (Q1)', date: '15 June', desc: 'Pay 15% of estimated total tax liability', status: 'upcoming', icon: <Clock size={20} /> },
                { title: 'Advance Tax (Q2)', date: '15 September', desc: 'Pay 45% of estimated total tax liability', status: 'upcoming', icon: <Clock size={20} /> },
                { title: 'Advance Tax (Q3)', date: '15 December', desc: 'Pay 75% of estimated total tax liability', status: 'upcoming', icon: <Clock size={20} /> },
                { title: 'Advance Tax (Q4)', date: '15 March', desc: 'Pay 100% of estimated total tax liability', status: 'urgent', icon: <AlertTriangle size={20} /> },
                { title: 'ITR Filing Deadline', date: '31 July', desc: 'Last date to file ITR for Individuals (Non-Audit)', status: 'upcoming', icon: <Archive size={20} /> },
                { title: 'Belated ITR Filing', date: '31 December', desc: 'Last date for belated/revised return with penalty', status: 'upcoming', icon: <AlertTriangle size={20} /> },
              ].map((deadline, idx) => (
                <div key={idx} className={`bg-zinc-900/90 rounded-3xl p-6 border shadow-xl relative overflow-hidden transition-all ${deadline.status === 'urgent' ? 'border-amber-500/50 hover:border-amber-500' : 'border-zinc-800 hover:border-indigo-500/50'}`}>
                  {deadline.status === 'urgent' && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-amber-600/30">
                      Upcoming Soon
                    </div>
                  )}
                  
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${deadline.status === 'urgent' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                    {deadline.icon}
                  </div>
                  
                  <p className="text-2xl font-black text-white mb-1">{deadline.date}</p>
                  <h3 className="text-base font-bold text-zinc-300 mb-2">{deadline.title}</h3>
                  <p className="text-xs text-zinc-500">{deadline.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/30 flex items-start gap-4">
              <div className="bg-indigo-500/20 p-3 rounded-full shrink-0">
                <FileSearch className="text-indigo-400" size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Do you need to pay Advance Tax?</h4>
                <p className="text-sm text-zinc-400">If your estimated tax liability for the financial year is ₹10,000 or more, you must pay advance tax. Calculate your liability in the Tax Calculator tab first.</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 3: ITR VAULT                             */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'itr' && (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700 shadow-xl">
              <h2 className="text-xl font-bold text-white flex items-center mb-6">
                <Upload className="mr-3 text-blue-400" size={22} /> Upload ITR Document
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Assessment Year</label>
                  <select
                    value={itrAY}
                    onChange={(e) => setItrAY(e.target.value)}
                    className="w-full py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-bold text-sm focus:border-blue-500 outline-none"
                  >
                    {['2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21'].map(ay => (
                      <option key={ay} value={ay}>{ay}</option>
                    ))}
                  </select>
                </div>
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                    itrFile ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 hover:border-blue-500/30'
                  }`}
                  onClick={() => itrFileRef.current?.click()}
                >
                  <input type="file" ref={itrFileRef} className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && setItrFile(e.target.files[0])} />
                  {itrFile ? (
                    <div className="animate-scale-in">
                      <FileText className="mx-auto mb-2 text-blue-400" size={28} />
                      <p className="text-xs font-bold text-white truncate max-w-[180px]">{itrFile.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{(itrFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-2 text-zinc-600 group-hover:text-blue-500/50" size={28} />
                      <p className="text-xs font-bold text-zinc-500">Drop ITR PDF / Image</p>
                    </>
                  )}
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleITRUpload}
                    disabled={!itrFile || itrUploading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-40 flex justify-center items-center gap-2"
                  >
                    {itrUploading ? <><RefreshCw className="animate-spin" size={16} /> Processing...</> : <><FileSearch size={16} /> Upload & Extract</>}
                  </button>
                </div>
              </div>
            </div>

            {/* ITR History */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-700 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <Archive className="mr-3 text-blue-400" size={20} /> ITR History
                </h2>
                <span className="text-xs text-zinc-500 font-bold">{itrDocs.length} documents</span>
              </div>
              {itrLoading ? (
                <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-blue-400 mb-3" size={24} /><p className="text-zinc-500 text-sm">Loading...</p></div>
              ) : itrDocs.length === 0 ? (
                <div className="p-12 text-center">
                  <Archive size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-medium">No ITR documents uploaded yet</p>
                  <p className="text-zinc-600 text-sm mt-1">Upload your first ITR to start building your tax history</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {itrDocs.map(doc => (
                    <div key={doc.id} className="p-5 hover:bg-zinc-800/30 transition-all">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedITR(expandedITR === doc.id ? null : doc.id)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <FileText size={22} />
                          </div>
                          <div>
                            <p className="font-bold text-white">AY {doc.assessmentYear}</p>
                            <p className="text-xs text-zinc-500">{doc.fileName} · {doc.filingStatus}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {((doc.extractedData as any)?.taxable_income != null || doc.extractedData?.taxableIncome != null) && (
                            <span className="text-sm font-bold text-zinc-300">{formatINR((doc.extractedData as any)?.taxable_income || doc.extractedData?.taxableIncome || 0)}</span>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteITR(doc.id); }} className="p-2 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                          <ChevronDown size={16} className={`text-zinc-500 transition-transform ${expandedITR === doc.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {expandedITR === doc.id && doc.extractedData && (
                        <div className="mt-4 pt-4 border-t border-zinc-800 animate-fade-in-up">
                          {doc.aiSummary && (
                            <div className="mb-4 p-3 bg-blue-900/20 rounded-xl border border-blue-800/30 text-sm text-blue-200">{doc.aiSummary}</div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: 'Gross Income', value: (doc.extractedData as any)?.gross_income || doc.extractedData?.grossIncome },
                              { label: 'Taxable Income', value: (doc.extractedData as any)?.taxable_income || doc.extractedData?.taxableIncome },
                              { label: 'Tax Paid', value: (doc.extractedData as any)?.tax_paid || doc.extractedData?.taxPaid },
                              { label: 'Refund', value: (doc.extractedData as any)?.refund_amount || doc.extractedData?.refundAmount },
                            ].map((item, i) => (
                              <div key={i} className="bg-zinc-950 rounded-xl p-3 border border-zinc-800">
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{item.label}</p>
                                <p className="text-base font-extrabold text-white mt-1">{item.value != null ? formatINR(item.value) : '—'}</p>
                              </div>
                            ))}
                          </div>
                          {doc.extractedData.regime && (
                            <div className="mt-3 flex gap-3 flex-wrap">
                              <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">Regime: {doc.extractedData.regime}</span>
                              {((doc.extractedData as any)?.form_type || doc.extractedData?.formType) && <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">{(doc.extractedData as any)?.form_type || doc.extractedData?.formType}</span>}
                              {((doc.extractedData as any)?.filing_date || doc.extractedData?.filingDate) && <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">Filed: {(doc.extractedData as any)?.filing_date || doc.extractedData?.filingDate}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 4: INVOICE SCANNER                       */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'invoices' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Receipt className="text-emerald-400" size={28} /> AI Invoice Scanner
                </h2>
                <p className="text-zinc-400 text-sm mt-1">Upload business expenses to automatically extract GST and categorize for tax filing.</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>

            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-700 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Receipt size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Scanned</p>
                  <p className="text-2xl font-extrabold text-white">{invoices.length}</p>
                </div>
              </div>
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-700 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Expenses</p>
                  <p className="text-2xl font-extrabold text-white">{formatINR(invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0))}</p>
                </div>
              </div>
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-700 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <PieChart size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total GST Paid</p>
                  <p className="text-2xl font-extrabold text-white">{formatINR(invoices.reduce((acc, inv) => acc + (inv.taxAmount || 0), 0))}</p>
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Upload */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-zinc-700">
                <h2 className="text-lg font-bold text-white flex items-center mb-5">
                  <Receipt className="mr-2 text-emerald-400" size={20} /> Scan Invoice
                </h2>
                <div
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                    invFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-emerald-500/30'
                  }`}
                  onClick={() => invFileRef.current?.click()}
                >
                  <input type="file" ref={invFileRef} className="hidden" accept="image/*,.pdf" onChange={(e) => { if (e.target.files?.[0]) { setInvFile(e.target.files[0]); setInvPreview(null); } }} />
                  {invFile ? (
                    <div className="animate-scale-in">
                      <Receipt className="mx-auto mb-3 text-emerald-400" size={36} />
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{invFile.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{(invFile.size / 1024).toFixed(0)} KB</p>
                      <button onClick={(e) => { e.stopPropagation(); setInvFile(null); setInvPreview(null); }} className="mt-3 text-[10px] font-bold text-red-500 hover:text-red-400 underline">Clear</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-3 text-zinc-600 group-hover:text-emerald-500/50" size={36} />
                      <p className="text-xs font-bold text-zinc-400">Drop Invoice PDF / Photo</p>
                      <p className="text-[9px] text-zinc-600 mt-1">AI will auto-extract all fields</p>
                    </>
                  )}
                </div>
                {invFile && !invPreview && (
                  <button
                    onClick={handleInvoiceScan}
                    disabled={invUploading}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2"
                  >
                    {invUploading ? <><RefreshCw className="animate-spin" size={16} /> Scanning...</> : <><FileSearch size={16} /> Extract with AI</>}
                  </button>
                )}

                {/* Invoice Preview */}
                {invPreview && (
                  <div className="mt-6 space-y-4 animate-fade-in-up">
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle size={14} /> Fields Extracted Successfully
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Vendor', value: invPreview.vendor_name },
                        { label: 'Invoice #', value: invPreview.invoice_number },
                        { label: 'Date', value: invPreview.invoice_date },
                        { label: 'Subtotal', value: invPreview.subtotal ? formatINR(invPreview.subtotal) : '—' },
                        { label: 'GST/Tax', value: invPreview.tax_amount ? formatINR(invPreview.tax_amount) : '—' },
                        { label: 'Total', value: invPreview.total_amount ? formatINR(invPreview.total_amount) : '—' },
                        { label: 'GSTIN', value: invPreview.gst_number || '—' },
                        { label: 'Category', value: invPreview.category },
                      ].map((field, i) => (
                        <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-800/50">
                          <span className="text-zinc-500 text-xs font-bold">{field.label}</span>
                          <span className="text-white font-bold">{field.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                    {invPreview.journal_entry && (
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Journal Entry</p>
                        <p className="text-xs font-mono text-emerald-300 whitespace-pre-wrap">{invPreview.journal_entry}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => { setInvPreview(null); setInvFile(null); }} className="flex-1 py-3 border border-zinc-800 rounded-xl text-zinc-500 text-xs font-bold hover:bg-zinc-900 transition-all">Discard</button>
                      <button
                        onClick={confirmInvoice}
                        disabled={invUploading}
                        className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 px-6"
                      >
                        {invUploading ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />} Save Invoice
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Invoice History */}
            <div className="lg:col-span-7">
              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center"><Receipt className="mr-2 text-emerald-400" size={18} /> Invoice Ledger</h2>
                  <span className="text-xs text-zinc-500 font-bold">{invoices.length} invoices</span>
                </div>
                {invLoading ? (
                  <div className="p-12 text-center"><RefreshCw className="animate-spin mx-auto text-emerald-400 mb-3" size={24} /></div>
                ) : invoices.length === 0 ? (
                  <div className="p-12 text-center">
                    <Receipt size={48} className="mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-500 font-medium">No invoices scanned yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Upload an invoice to auto-extract details</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {invoices.map(inv => (
                      <div key={inv.id} className="p-4 hover:bg-zinc-800/30 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                            inv.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            inv.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {inv.status === 'Approved' ? <Check size={16} /> : inv.status === 'Rejected' ? <X size={16} /> : <Clock size={16} />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{inv.vendorName || inv.fileName}</p>
                            <p className="text-[10px] text-zinc-500">{inv.invoiceDate || 'No date'} · {inv.category || 'Uncategorized'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold text-white">{inv.totalAmount ? formatINR(inv.totalAmount) : '—'}</span>
                          {inv.status === 'Draft' && (
                            <button onClick={() => approveInvoice(inv.id)} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">Approve</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 4: LIVE TAX METER                        */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === 'meter' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {!meterResult ? (
              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-16 border border-zinc-700 shadow-xl flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-purple-500/20">
                  <Zap size={40} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Tax Data Yet</h3>
                <p className="text-zinc-500 max-w-md mb-6">Enter your income & deductions in the Calculator tab and click <span className="font-bold text-amber-400">Calculate Tax</span> to see your live tax meter.</p>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all hover:from-amber-700 hover:to-yellow-700"
                >
                  <Calculator size={18} /> Go to Calculator
                </button>
              </div>
            ) : (
              <>
                {/* Tax Gauge */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700 shadow-xl text-center">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Zap className="text-purple-400" size={22} /> Real-Time Tax Estimator
                  </h2>
                  <p className="text-sm text-zinc-500 mb-8">Based on your income & deductions entered in the Calculator tab</p>

                  <div className="relative w-48 h-48 mx-auto mb-8">
                    <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(39,39,42)" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke="url(#taxGauge)" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(1, (parseFloat(meterResult.newRegime.effectiveRate) || 0) / 35))}`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="taxGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-extrabold text-white">{meterResult.newRegime.effectiveRate}%</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Effective Rate</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Gross Income', value: formatINR(meterResult.grossIncome), color: 'text-white' },
                      { label: 'Tax (New)', value: formatINR(meterResult.newRegime.totalTax), color: 'text-purple-400' },
                      { label: 'Tax (Old)', value: formatINR(meterResult.oldRegime.totalTax), color: 'text-blue-400' },
                      { label: 'You Save', value: formatINR(meterResult.savings), color: 'text-emerald-400' },
                    ].map((item, i) => (
                      <div key={i} className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className={`text-xl font-extrabold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {meterResult.grossIncome > 0 && (
                    <div className="mt-6 p-4 bg-purple-900/20 rounded-2xl border border-purple-800/30 text-sm text-purple-200">
                      <p className="font-bold mb-1">💡 AI Recommendation</p>
                      <p>Based on your inputs, the <span className="font-extrabold text-purple-300">{meterResult.recommended} Regime</span> saves you <span className="font-extrabold text-emerald-400">{formatINR(meterResult.savings)}</span> compared to the other regime. Monthly TDS should be approximately <span className="font-bold">{formatINR(meterResult.recommended === 'New' ? meterResult.newRegime.monthlyTds : meterResult.oldRegime.monthlyTds)}</span>.</p>
                    </div>
                  )}
                </div>

                {/* Monthly TDS Breakdown */}
                {meterResult.grossIncome > 0 && (
                  <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700 shadow-xl">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart3 size={18} className="text-purple-400" /> Monthly TDS Projection
                    </h3>
                    <div className="grid grid-cols-12 gap-1 h-32">
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthlyTax = meterResult.recommended === 'New' ? meterResult.newRegime.monthlyTds : meterResult.oldRegime.monthlyTds;
                        const maxHeight = monthlyTax;
                        const variation = 0.8 + Math.random() * 0.4;
                        const barHeight = Math.max(5, (monthlyTax * variation / Math.max(maxHeight * 1.3, 1)) * 100);
                        return (
                          <div key={i} className="flex flex-col items-center justify-end h-full">
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-purple-600 to-pink-500 transition-all duration-500 hover:from-purple-500 hover:to-pink-400 cursor-pointer group relative"
                              style={{ height: `${barHeight}%` }}
                              title={`Month ${i + 1}: ~${formatINR(Math.round(monthlyTax * variation))}`}
                            />
                            <span className="text-[8px] text-zinc-600 font-bold mt-1">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explain with AI */}
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-700 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Bot size={18} className="text-amber-400" /> AI Tax Explainer
                    </h3>
                    <button
                      onClick={handleAIExplain}
                      disabled={calcLoading}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all border border-amber-500/30"
                    >
                      {calcLoading ? <RefreshCw className="animate-spin" size={14} /> : <Lightbulb size={14} />}
                      {calcLoading ? 'Analyzing...' : 'Explain my Tax'}
                    </button>
                  </div>
                  {aiExplanation && (
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                      <MarkdownRenderer content={aiExplanation} />
                    </div>
                  )}
                  {!aiExplanation && !calcLoading && (
                    <p className="text-zinc-600 text-sm">Click the button above to get a plain-English explanation of your tax calculation.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxSimplifier;
