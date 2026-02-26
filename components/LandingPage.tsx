import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Bot, Smartphone, Target, FileText, GraduationCap,
    Shield, Zap, BarChart3, ArrowRight, ChevronRight, Sparkles,
    Lock, Globe, IndianRupee, LineChart
} from 'lucide-react';

// ─── Intersection Observer Hook ───
const useReveal = () => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
};

// ─── Section wrapper with reveal ───
const RevealSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
    const ref = useReveal();
    return <div ref={ref} className={`reveal-section ${className}`}>{children}</div>;
};

// ─── Feature Card ───
const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    desc: string;
    color: string;
    large?: boolean;
}> = ({ icon, title, desc, color, large }) => (
    <div className={`glass-panel rounded-2xl p-6 card-hover-lift shimmer-overlay cursor-pointer group ${large ? 'bento-span-2 md:p-8' : ''}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${color}`}>
            {icon}
        </div>
        <h3 className={`font-bold text-white mb-2 ${large ? 'text-xl' : 'text-lg'}`}>{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Learn more <ChevronRight size={14} />
        </div>
    </div>
);

// ─── Stat Counter ───
const StatItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="text-3xl md:text-4xl font-extrabold gradient-text stat-counter">{value}</p>
        <p className="text-slate-400 text-sm mt-1 font-medium">{label}</p>
    </div>
);

// ─── Step Card ───
const StepCard: React.FC<{ number: string; title: string; desc: string; icon: React.ReactNode; color: string }> = ({ number, title, desc, icon, color }) => (
    <div className="flex-1 text-center glass-panel rounded-2xl p-8 card-hover-lift relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary/30">
            {number}
        </div>
        <div className={`w-14 h-14 rounded-xl mx-auto flex items-center justify-center mb-4 mt-2 ${color}`}>
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* ═══ HERO SECTION ═══ */}
            <section className="hero-mesh relative min-h-screen flex items-center justify-center px-4 py-20">
                {/* Animated Background Orbs */}
                <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-float pointer-events-none" />
                <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-accent/20 rounded-full blur-[130px] animate-float-delayed pointer-events-none" />
                <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-secondary/15 rounded-full blur-[100px] animate-float-slow pointer-events-none" />

                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    {/* Badge */}
                    <div className="animate-fade-in-down inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                        <Sparkles size={14} className="animate-pulse-glow" />
                        Financial Intelligence, Reimagined
                    </div>

                    {/* Headline — Staggered Words */}
                    <div className="stagger-children mb-6">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
                            <span className="block text-white">Master Your</span>
                            <span className="block gradient-text-hero">Money.</span>
                            <span className="block text-white">Like a Pro.</span>
                        </h1>
                    </div>

                    {/* Subheadline */}
                    <p className="animate-fade-in-up text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '400ms' }}>
                        AI-powered insights to track expenses, plan investments, analyze markets, and grow your wealth — built for the new India.
                    </p>

                    {/* CTAs */}
                    <div className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center" style={{ animationDelay: '600ms' }}>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Start Free <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 glass-button text-white font-semibold text-lg rounded-2xl flex items-center justify-center gap-2"
                        >
                            Sign In <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Floating Dashboard Mockup */}
                    <div className="animate-fade-in-up mt-16 relative mx-auto max-w-4xl" style={{ animationDelay: '800ms' }}>
                        <div className="relative rounded-2xl overflow-hidden glass-panel p-1 shadow-2xl shadow-primary/10" style={{ perspective: '1200px' }}>
                            <div className="rounded-xl overflow-hidden bg-surface-0 p-4 md:p-6" style={{ transform: 'rotateX(2deg)' }}>
                                {/* Mock Dashboard Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><IndianRupee size={16} /></div>
                                        <div>
                                            <div className="h-3 w-24 bg-slate-800 rounded-full" />
                                            <div className="h-2 w-16 bg-slate-800/60 rounded-full mt-1.5" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800/80" />
                                        <div className="w-8 h-8 rounded-lg bg-slate-800/80" />
                                    </div>
                                </div>
                                {/* Mock Stats Row */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[['bg-green-500/10', 'text-green-500'], ['bg-red-500/10', 'text-red-500'], ['bg-blue-500/10', 'text-blue-500']].map(([bg, text], i) => (
                                        <div key={i} className="rounded-xl bg-surface-1 p-3 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                                                <div className={`w-4 h-4 rounded-sm ${text === 'text-green-500' ? 'bg-green-500/40' : text === 'text-red-500' ? 'bg-red-500/40' : 'bg-blue-500/40'}`} />
                                            </div>
                                            <div>
                                                <div className="h-2 w-12 bg-slate-700 rounded-full" />
                                                <div className="h-3 w-16 bg-slate-600 rounded-full mt-1.5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Mock Chart Area */}
                                <div className="rounded-xl bg-surface-1 p-4 h-32 md:h-40 flex items-end gap-1.5">
                                    {[35, 50, 40, 65, 55, 70, 60, 80, 75, 90, 85, 95].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary/60 transition-all" style={{
                                            height: `${h}%`,
                                            animationDelay: `${i * 100}ms`
                                        }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Glow Effect Under Mockup */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* ═══ SOCIAL PROOF TICKER ═══ */}
            <RevealSection>
                <div className="py-8 border-y border-slate-800/50 bg-surface-0/50">
                    <div className="marquee-container">
                        <div className="marquee-track">
                            {[...Array(2)].map((_, setIdx) => (
                                <div key={setIdx} className="flex items-center gap-12 px-6">
                                    <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-2"><Shield size={16} className="text-primary" /> Trusted by 10,000+ Indian Investors</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-2"><IndianRupee size={16} className="text-green-500" /> ₹50Cr+ Transactions Tracked</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> 98% User Satisfaction</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-2"><Lock size={16} className="text-cyan-500" /> 256-bit SSL Encrypted</span>
                                    <span className="text-slate-700">•</span>
                                    <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-2"><Globe size={16} className="text-purple-500" /> RBI Compliant</span>
                                    <span className="text-slate-700 mr-12">•</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </RevealSection>

            {/* ═══ FEATURES BENTO GRID ═══ */}
            <RevealSection className="py-20 md:py-28 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-primary text-sm font-semibold uppercase tracking-wider">Everything You Need</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-3 mb-4">One Platform. Total Control.</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">From daily UPI tracking to AI-driven investment insights — RupeeWise puts your entire financial life at your fingertips.</p>
                    </div>

                    <div className="bento-grid stagger-children">
                        <FeatureCard
                            icon={<Bot size={24} className="text-white" />}
                            title="AI Financial Coach"
                            desc="Get personalized advice powered by Gemini AI. Ask anything — from budgeting tips to retirement planning. It's like having a CFO in your pocket."
                            color="bg-gradient-to-br from-primary to-secondary"
                            large
                        />
                        <FeatureCard
                            icon={<LineChart size={24} className="text-cyan-400" />}
                            title="Market Hub"
                            desc="Real-time stock data, charts, and screener. Track every move in the Indian market."
                            color="bg-cyan-500/10"
                        />
                        <FeatureCard
                            icon={<Smartphone size={24} className="text-emerald-400" />}
                            title="UPI Tracker"
                            desc="Parse bank statements with AI. Categorize every ₹ automatically."
                            color="bg-emerald-500/10"
                        />
                        <FeatureCard
                            icon={<Target size={24} className="text-fuchsia-400" />}
                            title="Goal Planner"
                            desc="Set financial goals — dream home, retirement, travel — and track your progress with smart milestones."
                            color="bg-fuchsia-500/10"
                        />
                        <FeatureCard
                            icon={<FileText size={24} className="text-amber-400" />}
                            title="Tax Simplifier"
                            desc="Old vs New regime comparison. Maximize savings with automated deduction analysis."
                            color="bg-amber-500/10"
                            large
                        />
                        <FeatureCard
                            icon={<GraduationCap size={24} className="text-violet-400" />}
                            title="Academy"
                            desc="Learn investing from scratch with curated courses and quizzes."
                            color="bg-violet-500/10"
                        />
                    </div>
                </div>
            </RevealSection>

            {/* ═══ STATS ═══ */}
            <RevealSection className="py-16 md:py-20 px-4">
                <div className="max-w-4xl mx-auto glass-panel rounded-3xl p-10 md:p-14">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatItem value="10K+" label="Active Users" />
                        <StatItem value="₹50Cr+" label="Tracked" />
                        <StatItem value="98%" label="Satisfaction" />
                        <StatItem value="24/7" label="AI Support" />
                    </div>
                </div>
            </RevealSection>

            {/* ═══ HOW IT WORKS ═══ */}
            <RevealSection className="py-20 md:py-28 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-secondary text-sm font-semibold uppercase tracking-wider">How It Works</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-3">Three Steps to Financial Freedom</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-6 relative stagger-children">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px border-t-2 border-dashed border-slate-700 -translate-y-1/2 pointer-events-none" />

                        <StepCard
                            number="1"
                            title="Connect"
                            desc="Sign up for free in 30 seconds. Secure authentication powered by Supabase."
                            icon={<Shield size={28} className="text-primary" />}
                            color="bg-primary/10"
                        />
                        <StepCard
                            number="2"
                            title="Track"
                            desc="Add transactions manually or let AI parse your bank statements automatically."
                            icon={<BarChart3 size={28} className="text-secondary" />}
                            color="bg-secondary/10"
                        />
                        <StepCard
                            number="3"
                            title="Grow"
                            desc="Get AI insights, set goals, track markets, and watch your wealth compound."
                            icon={<TrendingUp size={28} className="text-emerald-400" />}
                            color="bg-emerald-500/10"
                        />
                    </div>
                </div>
            </RevealSection>

            {/* ═══ FINAL CTA ═══ */}
            <RevealSection className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center relative overflow-hidden rounded-3xl p-12 md:p-16" style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1), rgba(217,70,239,0.1))'
                }}>
                    {/* Glow */}
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                            Your Financial Future <br className="hidden md:block" />Starts with <span className="gradient-text">₹0</span>
                        </h2>
                        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                            No credit card required. No hidden fees. Just smarter money management.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.03] active:scale-[0.98] transition-all inline-flex items-center gap-2"
                        >
                            Get Started — It's Free <ArrowRight size={20} />
                        </button>

                        {/* Trust Badges */}
                        <div className="mt-10 flex flex-wrap justify-center gap-6 text-slate-500 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><Lock size={12} /> 256-bit SSL</span>
                            <span className="flex items-center gap-1.5"><Shield size={12} /> RBI Compliant</span>
                            <span className="flex items-center gap-1.5"><Globe size={12} /> No Hidden Fees</span>
                        </div>
                    </div>
                </div>
            </RevealSection>

            {/* ═══ FOOTER ═══ */}
            <footer className="py-10 px-4 border-t border-slate-800/50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">₹</div>
                        <span className="text-white font-bold text-lg">RupeeWise</span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2026 RupeeWise. Built with ❤️ for India.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
