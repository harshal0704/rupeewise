import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Smartphone, TrendingUp, FileText, MessageSquareText, Box, Menu, X, LineChart, LogOut } from 'lucide-react';

import Dashboard from './components/Dashboard';
import UPITracker from './components/UPITracker';
import InvestmentSimulator from './components/InvestmentSimulator';
import TaxSimplifier from './components/TaxSimplifier';
import AICoach from './components/AICoach';
import SimulationSandbox from './components/SimulationSandbox';
import MarketHub from './components/MarketHub';
import Academy from './components/Academy';
import GoalPlanner from './components/GoalPlanner';
import Watchlist from './components/Watchlist';
import Portfolio from './components/Portfolio';
import Login from './components/Login';
import { Transaction } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

import Layout from './components/Layout';

// --- PROTECTED ROUTE ---
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">₹</span>
        </div>
      </div>
    </div>
  );

  return user ? <Layout /> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const txs = await api.transactions.getAll();
          setTransactions(txs);
        } catch (error) {
          console.error("Failed to fetch transactions:", error);
        }
      };
      fetchData();
    } else {
      setTransactions([]);
    }
  }, [user]);

  const addTransaction = async (t: Transaction) => {
    const newTx = await api.transactions.add(t);
    setTransactions(prev => [newTx, ...prev]);
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard transactions={transactions} />} />
        <Route path="/upi" element={<UPITracker transactions={transactions} addTransaction={addTransaction} />} />
        <Route path="/invest" element={<InvestmentSimulator />} />
        <Route path="/stocks" element={<MarketHub />} />
        <Route path="/learn" element={<Academy />} />
        <Route path="/goals" element={<GoalPlanner />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/tax" element={<TaxSimplifier />} />
        <Route path="/coach" element={<AICoach />} />
        <Route path="/sandbox" element={<SimulationSandbox />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
