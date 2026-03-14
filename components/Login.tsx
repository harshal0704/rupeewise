import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, User, Shield, Bot, Eye, EyeOff, Monitor } from 'lucide-react';
import { Logo } from './Logo';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [entryCode, setEntryCode] = useState('');
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
        if (entryCode.trim().toLowerCase() !== 'blackrock') {
          throw new Error("Invalid entry code. Access denied.");
        }
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
    { icon: <Bot size={20} />, label: 'AI Wealth Coach', color: 'text-primary', bg: 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' },
    { icon: <Shield size={20} />, label: 'Bank-Grade Security', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]' },
    { icon: <Monitor size={20} />, label: 'Premium Command Center', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#080c0a] selection:bg-primary/30 selection:text-white">
      {/* Animated Premium Background Mesh */}
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-float pointer-events-none mix-blend-screen opacity-40" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/15 rounded-full blur-[130px] animate-float-delayed pointer-events-none mix-blend-screen opacity-40" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 p-4 md:p-8">

        {/* ═══ LEFT PANEL — The Pitch ═══ */}
        <div className="hidden lg:flex flex-col justify-center space-y-12 animate-fade-in pr-10">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <img src="/logo.png" alt="RupeeWise" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
              <h2 className="text-white text-3xl font-black tracking-tighter">RupeeWise</h2>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tighter mb-6">
              <span className="block text-white">Access the</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] via-[#F9E29C] to-[#B8860B] drop-shadow-[0_0_30px_rgba(212,175,55,0.2)]">Inner Circle.</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed font-light">
              Sign in to orchestrate your wealth with autonomous AI and institutional-grade financial intelligence.
            </p>
          </div>

          {/* Floating Feature Cards */}
          <div className="space-y-4">
            {features.map((feat, i) => (
              <div
                key={i}
                className={`flex items-center gap-5 p-5 rounded-2xl border backdrop-blur-sm ${feat.bg} group hover:bg-white/5 transition-all w-max animate-fade-in-left`}
                style={{
                  animationDelay: `${300 + i * 150}ms`,
                }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#080c0a] border border-white/5 ${feat.color} group-hover:scale-110 transition-transform`}>
                  {feat.icon}
                </div>
                <span className="text-white font-semibold tracking-wide pr-4">{feat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-sm animate-fade-in" style={{ animationDelay: '800ms' }}>
            <Shield size={16} className="text-primary" />
            <span>Protected by <span className="text-white font-medium">military-grade 256-bit AES encryption</span></span>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Auth Form ═══ */}
        <div className="flex items-center justify-center animate-scale-in">
          <div className="w-full max-w-md">
            <div className="bg-white/[0.02] backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden group">

              {/* Subtle premium edge highlight */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

              <div className="text-center mb-10">
                <div className="lg:hidden flex justify-center mb-6">
                  <img src="/logo.png" alt="RupeeWise" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {isLogin ? 'Welcome Back' : 'Apply for Access'}
                </h2>
                <p className="text-slate-400 mt-3 font-light">
                  {isLogin ? 'Enter your credentials to continue.' : 'Create your secure profile.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="relative group/input animate-fade-in-up">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#D4AF37] transition-colors z-10" size={18} />
                      <input
                        type="text"
                        placeholder="Full Legal Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 focus:border-[#D4AF37]/50 focus:bg-black/80 rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                        required
                      />
                    </div>
                    <div className="relative group/input animate-fade-in-up" style={{animationDelay: '100ms'}}>
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#D4AF37] transition-colors z-10" size={18} />
                      <input
                        type="text"
                        placeholder="Secret Entry Code"
                        value={entryCode}
                        onChange={(e) => setEntryCode(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 focus:border-[#D4AF37]/50 focus:bg-black/80 rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="relative group/input">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#D4AF37] transition-colors z-10" size={18} />
                  <input
                    type="email"
                    placeholder="Private Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 focus:border-[#D4AF37]/50 focus:bg-black/80 rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <div className="relative group/input">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-[#D4AF37] transition-colors z-10" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Vault Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-black/40 border border-white/10 focus:border-[#D4AF37]/50 focus:bg-black/80 rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center animate-shake flex items-center justify-center gap-2">
                    <Shield size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 mt-4 bg-gradient-to-r from-[#D4AF37] via-[#F9E29C] to-[#D4AF37] bg-[length:200%_auto] hover:bg-[position:right_center] text-black font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500 hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Authenticate' : 'Submit Application'} <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 text-slate-500 bg-[#080c0a] tracking-wider uppercase">or authorize via</span>
                </div>
              </div>

              <button className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-slate-300 font-bold transition-all flex items-center justify-center gap-3 hover:text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="mt-8 text-center pt-6">
                <p className="text-slate-400 text-sm">
                  {isLogin ? "Not a member yet?" : "Already an exclusive member?"}
                  <button
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-[#D4AF37] font-bold hover:text-[#F9E29C] transition-colors ml-2"
                  >
                    {isLogin ? 'Apply Now' : 'Sign In'}
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
