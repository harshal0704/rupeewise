import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, Wallet, ArrowUp, ArrowDown, Target, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { getFinancialAdvice } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#06b6d4', '#d946ef', '#f43f5e', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ transactions: propTransactions }) => {
  const { user } = useAuth();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(propTransactions);
  const [insight, setInsight] = useState<string>("Analyzing your finances...");
  const [topGoal, setTopGoal] = useState<any>(null);

  useEffect(() => {
    if (propTransactions && propTransactions.length > 0) {
      setLocalTransactions(propTransactions);
    }
  }, [propTransactions]);

  useEffect(() => {
    // Fetch Top Goal
    const fetchTopGoal = async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('target_amount', { ascending: false }) // Prioritize biggest goal
        .limit(1)
        .single();
      if (data) setTopGoal(data);
    };

    // Generate Insight
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

  const totalSpent = localTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalIncome = localTransactions
    .filter(t => t.type === 'credit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalSpent;

  // Dynamic Chart Data from Transactions
  const processChartData = () => {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize with some base value or 0
    let cumulative = 0;

    // Sort transactions by date
    const sorted = [...localTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by month
    sorted.forEach(t => {
      const date = new Date(t.date);
      const month = months[date.getMonth()];
      if (t.type === 'credit') cumulative += t.amount;
      else cumulative -= t.amount;
      monthlyData[month] = cumulative;
    });

    // Fill in gaps or just return what we have. 
    // For simplicity, returning last 6 months found or defaults.
    return Object.keys(monthlyData).map(m => ({ name: m, value: monthlyData[m] }));
  };

  const netWorthData = localTransactions.length > 0
    ? processChartData()
    : [
      { name: 'Jan', value: 10000 }, { name: 'Feb', value: 12000 },
      { name: 'Mar', value: 11000 }, { name: 'Apr', value: 15000 },
      { name: 'May', value: 18000 }, { name: 'Jun', value: 20000 }
    ];

  const categoryData = localTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, curr) => {
      const existing = acc.find(a => a.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Namaste, <span className="gradient-text">{user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>! 🙏
          </h1>
          <p className="text-slate-400 font-medium">Your financial command center is ready.</p>
        </div>
        <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Net Worth</p>
            <p className="text-2xl font-bold text-white">₹{balance.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white">Net Worth Growth</h3>
              <p className="text-sm text-green-400 flex items-center mt-1">
                <TrendingUp size={14} className="mr-1" /> +12.5% this month
              </p>
            </div>
            <select className="bg-slate-800/50 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-primary">
              <option>6 Months</option>
              <option>1 Year</option>
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          {/* Goal Widget */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent/10 rounded-xl text-accent">
                <Target size={24} />
              </div>
              <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-1 rounded-full">Top Goal</span>
            </div>
            {topGoal ? (
              <>
                <h3 className="text-lg font-bold text-white mb-1">{topGoal.title}</h3>
                <p className="text-sm text-slate-400 mb-4">Target: ₹{topGoal.target_amount.toLocaleString()}</p>

                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-gradient-to-r from-accent to-purple-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, (topGoal.current_amount / topGoal.target_amount) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>₹{topGoal.current_amount.toLocaleString()} saved</span>
                  <span>{Math.round((topGoal.current_amount / topGoal.target_amount) * 100)}%</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">No goals set yet.</p>
                <a href="#/goals" className="text-primary text-xs font-bold mt-2 inline-block">Create One</a>
              </div>
            )}
          </div>

          {/* AI Insight Widget */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-3">
              <Zap size={20} className="text-yellow-400 fill-yellow-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Daily Insight</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              "{insight}"
            </p>
            <div className="mt-4 flex items-center text-primary text-xs font-bold group-hover:translate-x-1 transition-transform">
              ASK COACH <ChevronRight size={14} className="ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Monthly Income</p>
            <p className="text-2xl font-bold text-white">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <ArrowUp size={20} />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Monthly Expenses</p>
            <p className="text-2xl font-bold text-white">₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <ArrowDown size={20} />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Savings Rate</p>
            <p className="text-2xl font-bold text-white">
              {totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Breakdown */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-6">Spending Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500">No data available</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <button className="text-sm text-primary hover:text-primary-glow transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {localTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3 hover:bg-slate-800/50 rounded-xl transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'debit' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    <IndianRupee size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 group-hover:text-primary transition-colors">{t.merchant}</p>
                    <p className="text-xs text-slate-500">{t.date} • {t.category}</p>
                  </div>
                </div>
                <span className={`font-bold ${t.type === 'debit' ? 'text-slate-200' : 'text-green-400'}`}>
                  {t.type === 'debit' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {localTransactions.length === 0 && (
              <p className="text-slate-500 text-center py-4">No recent transactions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
