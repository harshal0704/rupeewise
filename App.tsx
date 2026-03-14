import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Smartphone, TrendingUp, FileText, MessageSquareText, Box, Menu, X, LineChart, LogOut } from 'lucide-react';

import Dashboard from './components/Dashboard';
import ExpenseBook from './components/ExpenseBook';
import TaxSimplifier from './components/TaxSimplifier';
import AICoach from './components/AICoach';
import SimulationSandbox from './components/SimulationSandbox';
import SimulationSummary from './components/SimulationSummary';
import MarketHub from './components/MarketHub';
import Academy from './components/Academy';
import GoalPlanner from './components/GoalPlanner';
import Watchlist from './components/Watchlist';
import StockDetails from './components/StockDetails';
import Portfolio from './components/Portfolio';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import PrivacyStrategy from './components/legal/PrivacyStrategy';
import TermsOfUse from './components/legal/TermsOfUse';
import RiskDisclosure from './components/legal/RiskDisclosure';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-0 relative overflow-hidden z-50">
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse-glow"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] animate-fade-in"></div>
       
       <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
         <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <img src="/logo.png" alt="RupeeWise Logo" className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl animate-float" />
         </div>
         <h1 className="text-3xl font-black text-text-main tracking-tight mb-2 flex items-center gap-2">
            Rupee<span className="text-primary">Wise</span>
         </h1>
         <p className="text-text-muted text-sm font-medium tracking-widest uppercase animate-pulse">Initializing Cortex...</p>
         
         <div className="mt-8 w-48 h-1 bg-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-progress-indeterminate"></div>
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
      <Route path="/privacy" element={<PublicRoute><PrivacyStrategy /></PublicRoute>} />
      <Route path="/terms" element={<PublicRoute><TermsOfUse /></PublicRoute>} />
      <Route path="/risk" element={<PublicRoute><RiskDisclosure /></PublicRoute>} />

      {/* Onboarding Route - Auth only */}
      <Route path="/onboarding" element={
        <AuthRequired>
          <Onboarding />
        </AuthRequired>
      } />

      {/* Main App Routes - Auth + Onboarding */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard transactions={transactions} />} />
        <Route path="/expenses" element={<ExpenseBook transactions={transactions} addTransaction={addTransaction} />} />
        <Route path="/invest" element={<SimulationSandbox />} />
        <Route path="/simulation-summary" element={<SimulationSummary />} />
        <Route path="/stocks" element={<MarketHub />} />
        <Route path="/learn" element={<Academy />} />
        <Route path="/goals" element={<GoalPlanner />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/stock/:symbol" element={<StockDetails />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/tax" element={<TaxSimplifier />} />
        <Route path="/coach" element={<AICoach />} />
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
