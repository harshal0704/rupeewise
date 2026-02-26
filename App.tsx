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
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import { Transaction } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './services/api';

import Layout from './components/Layout';

// --- PROTECTED ROUTE (Requires Auth & Onboarding) ---
const ProtectedRoute = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-0)' }}>
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">₹</span>
        </div>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/welcome" replace />;

  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout />;
};

// --- AUTH REQUIRED ROUTE (Just Auth, No Onboarding Check) ---
const AuthRequired = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// --- PUBLIC ROUTE (Redirect to dashboard if already logged in) ---
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
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
      {/* Public Routes */}
      <Route path="/welcome" element={
        <PublicRoute><LandingPage /></PublicRoute>
      } />
      <Route path="/login" element={<Login />} />

      {/* Onboarding Route - Auth only */}
      <Route path="/onboarding" element={
        <AuthRequired>
          <Onboarding />
        </AuthRequired>
      } />

      {/* Main App Routes - Auth + Onboarding */}
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
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
