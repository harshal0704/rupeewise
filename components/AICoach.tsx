import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getCAAdvice } from '../services/geminiService';
import { MarkdownRenderer } from '../services/markdownRenderer';
import { Send, User, Bot, Sparkles, Shield, FileText, Calculator, Receipt, Scale, Landmark, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

// ─── Quick Action Cards ───
const QuickActionCard: React.FC<{ icon: React.ReactNode; label: string; query: string; onSelect: (q: string) => void }> = ({ icon, label, query, onSelect }) => (
  <button
    onClick={() => onSelect(query)}
    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-white hover:border-primary/30 hover:bg-zinc-800 transition-all group shrink-0"
  >
    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">{icon}</div>
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

const AICoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Namaste! I'm your **RupeeWise CA** — a virtual Chartered Accountant powered by AI.\n\nI can help with:\n- 📊 **Tax Planning** — Old vs New Regime, deductions under 80C/80D/80E\n- 📋 **ITR Filing Guidance** — Which ITR form, deadlines, documents\n- 🧾 **GST & Invoicing** — Input credit, GSTIN validation, HSN codes\n- 💡 **Financial Advisory** — Investments, insurance, retirement planning\n\nEvery answer is backed by **specific sections of the Income Tax Act** and relevant laws. Ask me anything!",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [taxContext, setTaxContext] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      const history = await api.chat.getHistory();
      if (history && history.length > 0) {
        setMessages(history);
      }
    };
    fetchHistory();
  }, []);

  // Build tax context from user's data
  useEffect(() => {
    const loadContext = async () => {
      try {
        const transactions = await api.transactions.getAll();
        const totalIncome = transactions.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);
        
        let itrDocs: any[] = [];
        try { itrDocs = await api.itrDocuments.getAll(); } catch (e) { /* table may not exist yet */ }

        let context = `User's financial snapshot:\n`;
        context += `- Total recorded income: ₹${totalIncome.toLocaleString('en-IN')}\n`;
        context += `- Total recorded expenses: ₹${totalExpenses.toLocaleString('en-IN')}\n`;
        context += `- Net savings: ₹${(totalIncome - totalExpenses).toLocaleString('en-IN')}\n`;
        context += `- Transaction count: ${transactions.length}\n`;
        
        if (itrDocs.length > 0) {
          const latest = itrDocs[0];
          context += `\nLatest ITR (AY ${latest.assessmentYear}):\n`;
          if (latest.extractedData?.grossIncome || latest.extractedData?.gross_income) {
            context += `- Gross Income: ₹${(latest.extractedData?.grossIncome || latest.extractedData?.gross_income || 0).toLocaleString('en-IN')}\n`;
          }
          if (latest.extractedData?.regime) {
            context += `- Regime: ${latest.extractedData.regime}\n`;
          }
        }

        setTaxContext(context);
      } catch (e) { /* ignore context loading errors */ }
    };
    loadContext();
  }, []);

  const handleSend = async (customInput?: string) => {
    const msgText = customInput || input;
    if (!msgText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: msgText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Save user message to DB
      await api.chat.addMessage('user', msgText);

      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await getCAAdvice(history, taxContext);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to DB
      await api.chat.addMessage('model', response);
    } catch (error) {
      console.error("AI Coach Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: <Calculator size={14} />, label: "80C Deductions", query: "What are all the investments and expenses I can claim under Section 80C? Please list with current limits and cite the relevant sections." },
    { icon: <Scale size={14} />, label: "Old vs New Regime", query: "Compare Old and New Tax Regime for FY 2024-25. When should I choose which? Include exact slab rates and cite sections." },
    { icon: <FileText size={14} />, label: "ITR Filing Guide", query: "Which ITR form should I use? What are the due dates for FY 2024-25? What documents do I need?" },
    { icon: <Receipt size={14} />, label: "GST Basics", query: "Explain GST input tax credit for a small business. What are the thresholds for registration? Cite relevant GST Act sections." },
    { icon: <Landmark size={14} />, label: "TDS Rules", query: "Explain TDS rules for salaried individuals. When can I claim TDS refund? What are the rates for different income types?" },
    { icon: <HelpCircle size={14} />, label: "Tax Saving Tips", query: "Give me top 10 legal tax saving strategies for FY 2024-25 with specific section references and limits." },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] pb-20 md:pb-0 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Shield size={18} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              RupeeWise CA
              <span className="text-[8px] sm:text-[9px] font-black bg-amber-500/20 text-amber-400 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-500/30">AI</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 truncate">Chartered Accountant with citations & legal references</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          <button
            onClick={async () => {
              await api.chat.clearHistory();
              setMessages([{
                id: Date.now().toString(),
                role: 'model',
                text: "Namaste! I'm your **RupeeWise CA** — a virtual Chartered Accountant powered by AI.\n\nI can help with:\n- 📊 **Tax Planning** — Old vs New Regime, deductions under 80C/80D/80E\n- 📋 **ITR Filing Guidance** — Which ITR form, deadlines, documents\n- 🧾 **GST & Invoicing** — Input credit, GSTIN validation, HSN codes\n- 💡 **Financial Advisory** — Investments, insurance, retirement planning\n\nEvery answer is backed by **specific sections of the Income Tax Act** and relevant laws. Ask me anything!",
                timestamp: new Date()
              }]);
            }}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shadow-sm shadow-primary/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New Chat
          </button>
          <button 
            onClick={async () => {
              if (window.confirm("Are you sure you want to clear chat history?")) {
                await api.chat.clearHistory();
                setMessages([{
                  id: '1',
                  role: 'model',
                  text: "Namaste! I'm your **RupeeWise CA** — a virtual Chartered Accountant powered by AI.\n\nI can help with:\n- 📊 **Tax Planning** — Old vs New Regime, deductions under 80C/80D/80E\n- 📋 **ITR Filing Guidance** — Which ITR form, deadlines, documents\n- 🧾 **GST & Invoicing** — Input credit, GSTIN validation, HSN codes\n- 💡 **Financial Advisory** — Investments, insurance, retirement planning\n\nEvery answer is backed by **specific sections of the Income Tax Act** and relevant laws. Ask me anything!",
                  timestamp: new Date()
                }]);
              }
            }}
            className="hidden sm:block text-xs text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-700 hover:bg-zinc-800 px-2 py-1 rounded-lg"
          >
            Clear History
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs text-zinc-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center shrink-0 mt-1 border border-amber-500/10">
                <Shield size={14} className="text-amber-400" />
              </div>
            )}
            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/20 text-white'
                  : 'glass-panel'
                }`}
            >
              {msg.role === 'model' ? (
                <MarkdownRenderer content={msg.text} />
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}
              <p className="text-[10px] text-zinc-500 mt-2">
                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center shrink-0 border border-amber-500/10">
              <Shield size={14} className="text-amber-400" />
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
                <span>Researching tax laws & verifying citations...</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-amber-400/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-400/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-400/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions (shown when few messages) */}
        {messages.length <= 2 && !loading && (
          <div className="pt-2">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 ml-1">Quick Questions</p>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible -mx-1 px-1">
              {quickActions.map((action, i) => (
                <QuickActionCard
                  key={i}
                  icon={action.icon}
                  label={action.label}
                  query={action.query}
                  onSelect={(q) => handleSend(q)}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex gap-2 sm:gap-3 items-center mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about taxes, deductions..."
          className="flex-1 bg-transparent text-white text-sm px-2 sm:px-3 py-2 outline-none placeholder-zinc-500"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-900 rounded-lg sm:rounded-xl flex items-center justify-center hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold shadow-lg shadow-amber-500/20 shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AICoach;
