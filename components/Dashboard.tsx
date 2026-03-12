import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  IndianRupee, TrendingUp, Wallet, ArrowUp, ArrowDown, Target, Zap,
  ChevronRight, Plus, LineChart, Bot, Sparkles, Calendar, PieChart as PieChartIcon, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { getFinancialAdvice } from '../services/geminiService';
import { Link } from 'react-router-dom';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', '#60a5fa', '#f97316', '#a78bfa'];

// ─── Quick Action Button ───
const QuickAction: React.FC<{ to: string; icon: React.ReactNode; label: string; color: string }> = ({ to, icon, label, color }) => (
  <Link to={to} className="flex flex-col items-center gap-2 p-4 glass-panel rounded-2xl card-hover-lift group cursor-pointer min-w-[100px] border border-transparent hover:border-surface-3">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
      {icon}
    </div>
    <span className="text-xs font-semibold text-text-secondary group-hover:text-text-main transition-colors whitespace-nowrap">{label}</span>
  </Link>
);

// ─── Progress Ring SVG ───
const ProgressRing: React.FC<{ progress: number; size?: number; stroke?: number }> = ({ progress, size = 80, stroke = 6 }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#progressGradient)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ─── Time-based greeting ───
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getFormattedDate = (): string => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

const Dashboard: React.FC<DashboardProps> = ({ transactions: propTransactions }) => {
  const { user } = useAuth();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(propTransactions);
  const [insight, setInsight] = useState<string>("Analyzing your finances...");
  const [topGoal, setTopGoal] = useState<any>(null);

  useEffect(() => {
    if (propTransactions && propTransactions.length > 0) setLocalTransactions(propTransactions);
  }, [propTransactions]);

  useEffect(() => {
    const fetchTopGoal = async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('target_amount', { ascending: false })
        .limit(1)
        .single();
      if (data) setTopGoal(data);
    };

    const fetchInsight = async () => {
      const prompt = "Give me a one-sentence, motivating financial tip for an Indian investor.";
      const response = await getFinancialAdvice([{ role: 'user', parts: [{ text: prompt }] }]);
      setInsight(response);
    };

    if (user) {
      fetchTopGoal();
      fetchInsight();
    }
  }, [user]);

  const totalSpent = localTransactions.filter(t => t.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = localTransactions.filter(t => t.type === 'credit').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;

  const processChartData = () => {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let cumulative = 0;
    const sorted = [...localTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(t => {
      const date = new Date(t.date);
      const month = months[date.getMonth()];
      if (t.type === 'credit') cumulative += t.amount;
      else cumulative -= t.amount;
      monthlyData[month] = cumulative;
    });
    return Object.keys(monthlyData).map(m => ({ name: m, value: monthlyData[m] }));
  };

  // Compute real month-over-month change
  const computeMonthChange = () => {
    if (localTransactions.length === 0) return null;
    const now = new Date();
    const thisMonth = localTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = localTransactions.filter(t => {
      const d = new Date(t.date);
      const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === lm && d.getFullYear() === ly;
    });
    const thisNet = thisMonth.reduce((a, t) => a + (t.type === 'credit' ? t.amount : -t.amount), 0);
    const lastNet = lastMonth.reduce((a, t) => a + (t.type === 'credit' ? t.amount : -t.amount), 0);
    if (lastNet === 0) return thisNet > 0 ? 100 : 0;
    return Math.round(((thisNet - lastNet) / Math.abs(lastNet)) * 100);
  };
  const monthChange = computeMonthChange();

  const netWorthData = localTransactions.length > 0 ? processChartData() : [];

  const categoryData = localTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, curr) => {
      const existing = acc.find(a => a.name === curr.category);
      if (existing) existing.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const goalProgress = topGoal ? Math.min(100, Math.round((topGoal.current_amount / topGoal.target_amount) * 100)) : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* ═══ WELCOME BANNER — "The Pulse" ═══ */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden animate-fade-in-up border-surface-3 shadow-2xl">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-glow rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-3">
              <Calendar size={14} className="text-primary" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">{getFormattedDate()}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-main tracking-tight">
              {getGreeting()}, <span className="text-primary drop-shadow-[0_0_15px_var(--primary-glow)]">{userName}</span>
            </h1>
            <p className="text-text-muted mt-2 font-medium text-lg">Your financial command center is ready.</p>
          </div>

          {/* Wealth Pulse Card */}
          <div className="glass-panel px-8 py-6 rounded-3xl relative overflow-hidden min-w-[220px] border-surface-2 bg-surface-1/50 shadow-inner group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 text-center md:text-right">
              <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold mb-2">Net Worth</p>
              <p className="text-4xl font-extrabold text-text-main stat-counter drop-shadow-sm">₹{balance.toLocaleString('en-IN')}</p>
              <div className="flex justify-center md:justify-end items-center gap-1.5 mt-2">
                {monthChange !== null ? (
                  <>
                    <TrendingUp size={14} className={monthChange >= 0 ? 'text-success' : 'text-error'} />
                    <span className={`text-sm font-bold ${monthChange >= 0 ? 'text-success' : 'text-error'}`}>{monthChange >= 0 ? '+' : ''}{monthChange}% this month</span>
                  </>
                ) : (
                  <span className="text-xs text-text-muted">Add transactions to track</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="flex gap-4 overflow-x-auto pb-2 animate-fade-in-up" style={{ animationDelay: '100ms', scrollbarWidth: 'none' }}>
        <QuickAction to="/upi" icon={<Plus size={22} className="text-primary" />} label="Add Transaction" color="bg-primary/10" />
        <QuickAction to="/stocks" icon={<LineChart size={22} className="text-secondary" />} label="Check Markets" color="bg-secondary/10" />
        <QuickAction to="/goals" icon={<Target size={22} className="text-accent" />} label="Set Goal" color="bg-accent/10" />
        <QuickAction to="/coach" icon={<Bot size={22} className="text-primary" />} label="Ask Coach" color="bg-primary/10" />
      </div>

      {/* ═══ BENTO GRID — Main Content ═══ */}
      <div className="bento-grid animate-fade-in-up mt-2" style={{ animationDelay: '200ms' }}>

        {/* Net Worth Chart — Large */}
        <div className="bento-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden scroll-reveal border-surface-3">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] -mr-12 -mt-12 pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-extrabold text-text-main">Net Worth Growth</h3>
              <p className="text-sm font-medium flex items-center mt-1">
                {monthChange !== null ? (
                  <><TrendingUp size={14} className={`mr-1.5 ${monthChange >= 0 ? 'text-success' : 'text-error'}`} /> <span className={monthChange >= 0 ? 'text-success' : 'text-error'}>{monthChange >= 0 ? '+' : ''}{monthChange}% this month</span></>
                ) : (
                  <span className="text-text-muted">No data yet</span>
                )}
              </p>
            </div>
            <select className="bg-surface-2 border border-surface-3 text-text-secondary font-semibold text-xs rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors cursor-pointer shadow-sm">
              <option>6 Months</option>
              <option>1 Year</option>
            </select>
          </div>
          <div className="h-60 w-full relative z-10">
            {netWorthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
                    contentStyle={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--surface-3)', borderRadius: '16px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                    cursor={{ stroke: 'var(--surface-3)', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone" dataKey="value"
                    stroke="var(--primary)" strokeWidth={3}
                    fillOpacity={1} fill="url(#colorValue)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                  <LineChart size={32} className="text-text-muted" />
                </div>
                <p className="text-text-secondary font-medium">No transaction data yet</p>
                <Link to="/upi" className="text-primary text-sm font-bold mt-2 hover:text-primary-glow transition-colors">Add your first transaction →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Goal — Progress Ring */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden scroll-reveal border-surface-3 flex flex-col justify-between" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-start mb-2">
            <div className="p-3 bg-secondary/10 rounded-2xl text-secondary shadow-inner">
              <Target size={24} />
            </div>
            <span className="text-[10px] font-extrabold bg-secondary/15 text-secondary px-3 py-1.5 rounded-full uppercase tracking-widest">Top Goal</span>
          </div>
          {topGoal ? (
            <div className="flex flex-col items-center text-center mt-4">
              <div className="relative mb-5 group">
                <div className="absolute inset-0 rounded-full bg-secondary/5 blur-[20px] group-hover:bg-secondary/20 transition-colors duration-500" />
                <ProgressRing progress={goalProgress} size={110} stroke={8} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-extrabold text-text-main drop-shadow-md">{goalProgress}%</span>
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-text-main mb-1 truncate w-full">{topGoal.title}</h3>
              <p className="text-sm font-medium text-text-secondary">₹{topGoal.current_amount?.toLocaleString()} <span className="text-text-muted">/ ₹{topGoal.target_amount?.toLocaleString()}</span></p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 text-text-muted flex items-center justify-center mx-auto mb-4 border border-surface-3"><Target size={28} /></div>
              <p className="text-text-secondary font-medium mb-3">No active goals</p>
              <Link to="/goals" className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">Create Goal</Link>
            </div>
          )}
        </div>

        {/* Stats Row — Full Width */}
        <div className="bento-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-6 rounded-3xl flex items-center justify-between scroll-reveal border-surface-3 group hover:border-surface-4 transition-colors">
            <div>
              <p className="text-text-secondary text-[11px] uppercase tracking-wider mb-1.5 font-bold">Monthly Income</p>
              <p className="text-3xl font-extrabold text-text-main stat-counter group-hover:text-success transition-colors">₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shadow-inner group-hover:scale-110 transition-transform">
              <ArrowUp size={24} />
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl flex items-center justify-between scroll-reveal border-surface-3 group hover:border-surface-4 transition-colors" style={{ animationDelay: '100ms' }}>
            <div>
              <p className="text-text-secondary text-[11px] uppercase tracking-wider mb-1.5 font-bold">Monthly Expenses</p>
              <p className="text-3xl font-extrabold text-text-main stat-counter group-hover:text-error transition-colors">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-inner group-hover:scale-110 transition-transform">
              <ArrowDown size={24} />
            </div>
          </div>
          <div className="glass-panel p-6 rounded-3xl flex items-center justify-between scroll-reveal border-surface-3 group hover:border-surface-4 transition-colors" style={{ animationDelay: '200ms' }}>
            <div>
              <p className="text-text-secondary text-[11px] uppercase tracking-wider mb-1.5 font-bold">Savings Rate</p>
              <p className="text-3xl font-extrabold text-text-main stat-counter group-hover:text-primary transition-colors">{savingsRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group cursor-pointer border-surface-3 hover:border-primary/30 transition-colors hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] scroll-reveal" onClick={() => window.location.hash = '/coach'}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] -mr-12 -mt-12 pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Sparkles size={20} className="text-primary animate-pulse" />
            <h3 className="text-sm font-extrabold text-text-main uppercase tracking-widest">Daily Insight</h3>
          </div>
          <p className="text-lg font-medium text-text-secondary leading-relaxed relative z-10 italic group-hover:text-text-main transition-colors">"{insight}"</p>
          <div className="mt-6 flex items-center text-primary text-sm font-bold group-hover:translate-x-2 transition-transform relative z-10 bg-primary/10 w-max px-4 py-2 rounded-xl">
            Ask AI Coach <ChevronRight size={16} className="ml-1" />
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="glass-panel p-6 rounded-3xl scroll-reveal border-surface-3 flex flex-col" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-extrabold text-text-main mb-6">Spending Analysis</h3>
          <div className="flex-1 w-full flex items-center justify-center relative min-h-[180px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85}
                    paddingAngle={5} dataKey="value" stroke="none"
                    cornerRadius={8}
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--surface-3)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-text-muted">
                <div className="w-16 h-16 rounded-2xl bg-surface-2 text-text-secondary flex items-center justify-center mx-auto mb-4 border border-surface-3"><PieChartIcon size={28} /></div>
                <p className="text-sm font-medium">No spending data yet</p>
              </div>
            )}
          </div>
          {categoryData.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-6 bg-surface-1/50 p-4 rounded-2xl border border-surface-2">
              {categoryData.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center gap-2.5 text-xs font-semibold text-text-secondary hover:text-text-main transition-colors">
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bento-span-2 glass-panel p-6 rounded-3xl scroll-reveal border-surface-3" style={{ animationDelay: '200ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold text-text-main">Recent Activity</h3>
            <Link to="/upi" className="text-xs text-primary font-bold hover:text-primary-glow transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {localTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3.5 hover:bg-surface-2 rounded-2xl transition-all duration-300 group border border-transparent hover:border-surface-3 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${t.type === 'debit' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                    <IndianRupee size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-text-main group-hover:text-primary transition-colors">{t.merchant}</p>
                    <p className="text-[11px] font-medium text-text-muted mt-0.5">{t.date} · {t.category}</p>
                  </div>
                </div>
                <span className={`font-extrabold text-base ${t.type === 'debit' ? 'text-text-secondary' : 'text-success'} group-hover:-translate-x-1 transition-transform`}>
                  {t.type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {localTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-surface-2 text-text-muted flex items-center justify-center mx-auto mb-4 border border-surface-3"><CreditCard size={32} /></div>
                <p className="text-text-secondary font-medium text-sm mb-4">No transactions yet</p>
                <Link to="/upi" className="bg-primary hover:bg-primary-glow transition-colors text-surface-0 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Add Transaction</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
