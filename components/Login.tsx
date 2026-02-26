import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, User, TrendingUp, Shield, Bot, Eye, EyeOff, Sparkles } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await signup(name, email, password);
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <Bot size={20} />, label: 'AI-Powered Insights', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { icon: <Shield size={20} />, label: 'Bank-Grade Security', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: <TrendingUp size={20} />, label: 'Zero Commission', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Animated Background Orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[130px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] animate-float-slow pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-4 md:p-8">

        {/* ═══ LEFT PANEL — The Pitch ═══ */}
        <div className="hidden lg:flex flex-col justify-center space-y-10 animate-fade-in">
          {/* Animated Brand Mark */}
          <div>
            <div className="relative w-16 h-16 mb-8">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-secondary opacity-20 animate-pulse-glow" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-2xl font-extrabold text-white">₹</span>
              </div>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
              Welcome to the{' '}
              <span className="gradient-text-hero">future</span>{' '}
              of personal finance
            </h1>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Join thousands of Indians mastering their money with AI-powered intelligence.
            </p>
          </div>

          {/* Floating Feature Cards */}
          <div className="space-y-4">
            {features.map((feat, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-sm ${feat.bg} animate-fade-in-left`}
                style={{
                  animationDelay: `${300 + i * 150}ms`,
                  animation: `fadeInLeft 0.6s cubic-bezier(0.16,1,0.3,1) ${300 + i * 150}ms both, float 6s ease-in-out ${i * 2}s infinite`,
                }}
              >
                <div className={`${feat.color}`}>{feat.icon}</div>
                <span className="text-white font-semibold">{feat.label}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3 text-zinc-500 text-sm animate-fade-in" style={{ animationDelay: '800ms' }}>
            <div className="flex -space-x-2">
              {['🧑‍💼', '👩‍💻', '👨‍🎓', '👩‍🔬'].map((emoji, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-surface-0 flex items-center justify-center text-sm">
                  {emoji}
                </div>
              ))}
            </div>
            <span>Trusted by <span className="text-white font-semibold">10,000+</span> investors</span>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Auth Form ═══ */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md animate-scale-in">
            <div className="glass-panel p-8 md:p-10 rounded-3xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="lg:hidden w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <span className="text-2xl font-extrabold text-white">₹</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-zinc-400 text-sm mt-2">
                  {isLogin ? 'Sign in to access your financial command center' : 'Start your journey to financial freedom'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="relative group animate-fade-in-up">
                    <User className="absolute left-3.5 top-3.5 text-zinc-500 group-focus-within:text-primary transition-colors z-10" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="neumorph-input"
                      required
                    />
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 text-zinc-500 group-focus-within:text-primary transition-colors z-10" size={18} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neumorph-input"
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 text-zinc-500 group-focus-within:text-primary transition-colors z-10" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neumorph-input pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center animate-shake flex items-center justify-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 shimmer-overlay overflow-hidden relative"
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

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 text-zinc-500 bg-surface-1">or continue with</span>
                </div>
              </div>

              {/* Social Button */}
              <button className="w-full py-3.5 glass-button rounded-xl text-zinc-300 font-semibold text-sm flex items-center justify-center gap-3 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Toggle */}
              <div className="mt-8 text-center border-t border-zinc-800/50 pt-6">
                <p className="text-zinc-400 text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-primary font-bold hover:text-primary/80 transition-colors ml-1.5"
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
