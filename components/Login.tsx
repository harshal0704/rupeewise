import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, User, TrendingUp, Shield, Globe } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">

        {/* Left Side: Hero Text (Visible on LG screens) */}
        <div className="hidden lg:flex flex-col justify-center text-white space-y-8 p-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Financial Intelligence Reimagined
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Master Your Money <br /> Like a Pro.
            </h1>
            <p className="text-lg text-slate-400 max-w-md">
              Join thousands of investors using AI-driven insights to track, plan, and grow their wealth effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm">
              <TrendingUp className="text-emerald-400 mb-3" size={24} />
              <h3 className="font-semibold text-white">Smart Analytics</h3>
              <p className="text-sm text-slate-400 mt-1">Visualize growth with precision.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm">
              <Shield className="text-blue-400 mb-3" size={24} />
              <h3 className="font-semibold text-white">Bank-Grade Security</h3>
              <p className="text-sm text-slate-400 mt-1">Your data is encrypted & safe.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md p-8 backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <span className="text-2xl font-bold text-white">₹</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                {isLogin ? 'Enter your credentials to access your account' : 'Start your financial journey today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="group">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Get Started'} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-slate-800 pt-6">
              <p className="text-slate-400 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors ml-1"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
