import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  IndianRupee, TrendingUp, Wallet, ArrowUp, ArrowDown, Target, Zap,
  ChevronRight, Plus, LineChart, Bot, Sparkles, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { getFinancialAdvice } from '../services/geminiService';
import { Link } from 'react-router-dom';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#06b6d4', '#d946ef', '#f43f5e', '#8b5cf6', '#ec4899'];

// ─── Quick Action Button ───
const QuickAction: React.FC<{ to: string; icon: React.ReactNode; label: string; color: string }> = ({ to, icon, label, color }) => (
  <Link to={to} className="flex flex-col items-center gap-2 p-4 glass-panel rounded-2xl card-hover-lift group cursor-pointer min-w-[100px]">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
      {icon}
    </div>
    <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors whitespace-nowrap">{label}</span>
  </Link>
);

// ─── Progress Ring SVG ───
const ProgressRing: React.FC<{ progress: number; size?: number; stroke?: number }> = ({ progress, size = 80, stroke = 6 }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#progressGradient)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#d946ef" />
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

  const netWorthData = localTransactions.length > 0 ? processChartData() : [
    { name: 'Jan', value: 10000 }, { name: 'Feb', value: 12000 },
    { name: 'Mar', value: 11000 }, { name: 'Apr', value: 15000 },
    { name: 'May', value: 18000 }, { name: 'Jun', value: 20000 }
  ];

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
      <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden animate-fade-in-up">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/8 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Calendar size={14} />
              <span>{getFormattedDate()}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {getGreeting()}, <span className="gradient-text">{userName}</span> 👋
            </h1>
            <p className="text-zinc-400 mt-1 font-medium">Your financial command center is ready.</p>
          </div>

          {/* Wealth Pulse Card */}
          <div className="glass-panel px-6 py-4 rounded-2xl relative overflow-hidden min-w-[200px]">
            {/* Pulse Line BG */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 L20 30 L30 10 L40 50 L50 20 L60 40 L70 30 L200 30' fill='none' stroke='%236366f1' stroke-width='2'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'center',
              backgroundSize: '200px 60px',
            }} />
            <div className="relative z-10">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Net Worth</p>
              <p className="text-3xl font-extrabold text-white stat-counter">₹{balance.toLocaleString('en-IN')}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={12} className="text-green-400" />
                <span className="text-xs text-green-400 font-semibold">+12.5% this month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS ═══ */}
      <div className="flex gap-3 overflow-x-auto pb-1 animate-fade-in-up" style={{ animationDelay: '100ms', scrollbarWidth: 'none' }}>
        <QuickAction to="/upi" icon={<Plus size={20} className="text-emerald-400" />} label="Add Transaction" color="bg-emerald-500/10" />
        <QuickAction to="/stocks" icon={<LineChart size={20} className="text-emerald-400" />} label="Check Markets" color="bg-emerald-500/10" />
        <QuickAction to="/goals" icon={<Target size={20} className="text-orange-400" />} label="Set Goal" color="bg-orange-500/10" />
        <QuickAction to="/coach" icon={<Bot size={20} className="text-primary" />} label="Ask Coach" color="bg-primary/10" />
      </div>

      {/* ═══ BENTO GRID — Main Content ═══ */}
      <div className="bento-grid animate-fade-in-up" style={{ animationDelay: '200ms' }}>

        {/* Net Worth Chart — Large */}
        <div className="bento-span-2 glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-[60px] -mr-12 -mt-12 pointer-events-none" />
          <div className="flex justify-between items-center mb-5 relative z-10">
            <div>
              <h3 className="text-base font-bold text-white">Net Worth Growth</h3>
              <p className="text-xs text-green-400 flex items-center mt-0.5">
                <TrendingUp size={12} className="mr-1" /> +12.5% this month
              </p>
            </div>
            <select className="bg-surface-2 border border-zinc-700/50 text-zinc-400 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary">
              <option>6 Months</option>
              <option>1 Year</option>
            </select>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '13px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#818cf8' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone" dataKey="value"
                  stroke="#6366f1" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Goal — Progress Ring */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-accent/10 rounded-xl text-accent">
              <Target size={20} />
            </div>
            <span className="text-[10px] font-bold bg-accent/15 text-accent px-2 py-1 rounded-full uppercase tracking-wider">Top Goal</span>
          </div>
          {topGoal ? (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <ProgressRing progress={goalProgress} size={90} stroke={7} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-white">{goalProgress}%</span>
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-0.5">{topGoal.title}</h3>
              <p className="text-xs text-zinc-400">₹{topGoal.current_amount?.toLocaleString()} / ₹{topGoal.target_amount?.toLocaleString()}</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-zinc-400 text-sm mb-3">No goals set yet</p>
              <Link to="/goals" className="text-primary text-xs font-bold hover:text-primary/80 transition-colors">Create One →</Link>
            </div>
          )}
        </div>

        {/* Stats Row — Full Width */}
        <div className="bento-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Income */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs mb-1 font-medium">Monthly Income</p>
              <p className="text-2xl font-extrabold text-white stat-counter">₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <ArrowUp size={20} />
            </div>
          </div>
          {/* Expenses */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs mb-1 font-medium">Monthly Expenses</p>
              <p className="text-2xl font-extrabold text-white stat-counter">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ArrowDown size={20} />
            </div>
          </div>
          {/* Savings Rate */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs mb-1 font-medium">Savings Rate</p>
              <p className="text-2xl font-extrabold text-white stat-counter">{savingsRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group cursor-pointer card-hover-lift shimmer-overlay" onClick={() => window.location.hash = '/coach'}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/8 rounded-full blur-[50px] -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sparkles size={16} className="text-yellow-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Daily Insight</h3>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed relative z-10 italic">"{insight}"</p>
          <div className="mt-4 flex items-center text-primary text-xs font-bold group-hover:tranzinc-x-1 transition-transform relative z-10">
            Ask Coach <ChevronRight size={14} className="ml-1" />
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-4">Spending Breakdown</h3>
          <div className="h-48 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={70}
                    paddingAngle={4} dataKey="value" stroke="none"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-zinc-600">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">No spending data yet</p>
              </div>
            )}
          </div>
          {categoryData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {categoryData.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-white">Recent Activity</h3>
            <Link to="/upi" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {localTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-2.5 hover:bg-zinc-800/30 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'debit' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    <IndianRupee size={14} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-200 group-hover:text-white transition-colors">{t.merchant}</p>
                    <p className="text-[10px] text-zinc-500">{t.date} · {t.category}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${t.type === 'debit' ? 'text-zinc-300' : 'text-green-400'}`}>
                  {t.type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {localTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">💳</p>
                <p className="text-zinc-500 text-sm mb-3">No transactions yet</p>
                <Link to="/upi" className="text-primary text-xs font-bold hover:text-primary/80 transition-colors">Add One →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
