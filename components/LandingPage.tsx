import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import {
    Bot, Smartphone, Target, FileText, GraduationCap,
    Shield, ShieldAlert, BarChart3, ChevronRight, Lock, Globe,
    LineChart, CheckCircle2, PlayCircle, Fingerprint, Wallet, Monitor, Sparkles, Youtube, Instagram
} from 'lucide-react';

// ─── Animation Variants ───
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as any } }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const letterReveal = {
    initial: { y: "100%" },
    animate: { y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as any } }
};

// ─── Floating Particle Background ───
const BackgroundParticles = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: Math.random() * 3 + 1 + 'px',
                        height: Math.random() * 3 + 1 + 'px',
                        backgroundColor: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                        opacity: 0.2,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

// ─── Nav Component ───
const Navbar = ({ onSignIn }: { onSignIn: () => void }) => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
                ? 'py-3 bg-black/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl'
                : 'py-5 bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="/logo.png" alt="RupeeWise" className="w-12 h-12 object-contain" />
                    <span className="text-white text-2xl font-black tracking-tight hidden sm:block">Rupee<span className="text-primary">Wise</span></span>
                </div>

                {/* Center Nav */}
                <div className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-2 py-1.5 backdrop-blur-sm">
                    {[
                        { label: 'Features', href: '#terminal' },
                        { label: 'Ecosystem', href: '#ecosystem' },
                        { label: 'Academy', href: '#academy' },
                    ].map(link => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="px-5 py-2 text-[13px] font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-200"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* CTA */}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onSignIn}
                    className="px-6 py-2.5 text-sm font-bold bg-white text-black rounded-full hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all"
                >
                    Get Started
                </motion.button>
            </div>
        </motion.nav>
    );
};

// ─── Main Landing Page ───
const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="min-h-screen relative overflow-x-hidden bg-[#050607] font-sans selection:bg-primary/40 selection:text-white text-slate-100">
            {/* Scroll Progress Bar */}
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary z-[60] origin-left" style={{ scaleX }} />

            <BackgroundParticles />
            <Navbar onSignIn={() => navigate('/login')} />

            <main className="relative z-10">
                {/* ═══ HERO SECTION ═══ */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />

                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={staggerContainer}
                        className="max-w-6xl mx-auto space-y-10 text-center relative z-10"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-surface-1 border border-primary/20 shadow-[0_0_40px_rgba(212,168,83,0.1)] backdrop-blur-xl"
                        >
                            <Sparkles size={14} className="text-primary animate-pulse" />
                            <span className="text-primary text-[11px] font-black uppercase tracking-[0.2em]">Personal Finance & Wealth Management</span>
                        </motion.div>

                        <div className="space-y-4">
                            <h1 className="text-[10vw] md:text-[6.5rem] lg:text-[8.5rem] font-black leading-[0.9] tracking-tighter text-white">
                                <motion.span variants={fadeInUp} className="block">COMMAND YOUR</motion.span>
                                <motion.span
                                    variants={fadeInUp}
                                    className="block text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] via-[#F9E29C] to-[#B8860B] drop-shadow-[0_0_30px_rgba(212,175,55,0.2)] skew-x-[-5deg] pb-2"
                                >
                                    FINANCIAL DESTINY
                                </motion.span>
                            </h1>
                        </div>

                        <motion.p
                            variants={fadeInUp}
                            className="max-w-3xl mx-auto text-slate-400 text-lg md:text-2xl font-medium leading-relaxed opacity-80"
                        >
                            Command your net worth. AI-driven UPI syncing, pro-tier investment simulations, and personalized tax optimization—engineered for India's smartest investors.
                        </motion.p>

                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-6"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(212, 175, 55, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/login')}
                                className="h-20 px-12 bg-primary text-black font-black rounded-[2rem] text-xl shadow-[0_20px_40px_rgba(212,175,55,0.2)] transition-all flex items-center justify-center gap-3 group"
                            >
                                Get Started <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                            </motion.button>

                            <motion.button
                                whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                                onClick={() => navigate('/login')}
                                className="h-20 px-10 border border-white/10 text-white font-black rounded-[2rem] flex items-center justify-center gap-4 group backdrop-blur-sm"
                            >
                                <div className="p-2.5 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                                    <PlayCircle size={24} className="text-primary" />
                                </div>
                                <span className="uppercase tracking-widest text-sm">Vision</span>
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-10 flex flex-col items-center gap-4"
                    >
                        <div className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-black">Scroll to Explore</div>
                        <div className="w-[1px] h-20 bg-gradient-to-b from-primary/50 to-transparent" />
                    </motion.div>
                </section>

                {/* ═══ BENTO SHOWCASE ═══ */}
                <section id="terminal" className="px-6 py-32 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:auto-rows-[300px]">

                        {/* Featured High-Res Card */}
                        <motion.div
                            whileInView={{ opacity: 1, scale: 1 }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            viewport={{ once: true }}
                            className="md:col-span-8 md:row-span-2 relative rounded-[3rem] overflow-hidden group shadow-[0_0_50px_rgba(212,175,55,0.08)] border border-white/10 hover:border-primary/40 transition-all duration-700 hover:shadow-[0_0_80px_rgba(212,175,55,0.15)]"
                        >
                            <img
                                src="/dashboard.png"
                                alt="Modern Dashboard"
                                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 opacity-70 grayscale-[0.6] group-hover:grayscale-[0.2]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                            <div className="absolute bottom-0 left-0 p-10 md:p-16">
                                <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6 font-bold text-[10px] uppercase tracking-widest text-white shadow-xl">
                                    <Monitor size={14} className="text-primary" /> Institutional Grade
                                </motion.div>
                                <h3 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight max-w-3xl mb-6">
                                    Your entire financial <span className="text-primary">nebula</span> in one view.
                                </h3>
                                <p className="text-slate-300 text-lg md:text-xl max-w-xl font-light leading-relaxed">
                                    Professional visualization tools once reserved for elite traders, now beautifully reimagined for your personal success.
                                </p>
                            </div>
                        </motion.div>

                        {/* Interactive Stats Card */}
                        <motion.div
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: 50 }}
                            viewport={{ once: true }}
                            className="md:col-span-4 bg-surface-1 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between group overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-secondary/20 transition-all duration-1000" />
                            <div className="relative z-10 w-16 h-16 bg-secondary/10 border border-secondary/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(52,211,153,0.1)] group-hover:scale-110 transition-transform">
                                <LineChart className="text-secondary" size={32} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-white text-2xl font-black mb-3">Wealth Pulse</h4>
                                <p className="text-slate-400 font-medium">Real-time market velocity tracking and dynamic net-worth analytics.</p>
                            </div>
                            <div className="mt-8 relative z-10 flex gap-2 items-end h-16">
                                {[30, 70, 45, 90, 60].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.1, duration: 1 }}
                                        className="flex-1 bg-gradient-to-t from-secondary/5 to-secondary/40 rounded-t-lg"
                                    />
                                ))}
                            </div>
                        </motion.div>

                        {/* AI Coach Snippet */}
                        <motion.div
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: 50 }}
                            viewport={{ once: true }}
                            className="md:col-span-4 bg-primary text-black rounded-[3rem] p-10 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                            onClick={() => navigate('/login')}
                        >
                            <img
                                src="/ai_coach.png"
                                alt="AI Coach"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 opacity-60"
                            />
                            <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 flex justify-between items-start w-full text-white">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30 text-white">
                                    <Bot size={28} />
                                </div>
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                            <div className="relative z-10 text-white mt-8">
                                <h4 className="text-2xl font-black mb-2 tracking-tight drop-shadow-md">AI Wealth Coach</h4>
                                <p className="text-white/80 font-medium leading-snug">Autonomous text parsing, tax strategy generation, and deep financial advisory.</p>
                            </div>
                        </motion.div>

                    </div>
                </section>

                {/* ═══ INNOVATION HORIZON ═══ */}
                <section id="ecosystem" className="py-32 px-6 relative bg-gradient-to-b from-transparent to-black/40">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <motion.div
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: -50 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <span className="text-primary text-xs font-black uppercase tracking-[0.4em] block drop-shadow-[0_0_10px_var(--primary-glow)]">Advanced Ecosystem</span>
                            <h3 className="text-5xl md:text-7xl font-black text-white leading-[1] tracking-tighter">
                                Everything you need. <span className="text-slate-600">Perfectly synced.</span>
                            </h3>

                            <div className="space-y-6 pt-4">
                                {[
                                    { icon: Smartphone, title: "UPI Auto-Tracker", desc: "Instantly sync SMS receipts via AI deduplication to track every rupee seamlessly." },
                                    { icon: Target, title: "Pro-Tier Sandbox", desc: "Strategy backtesting, Time Machines, and Monte Carlo wealth projections." },
                                    { icon: GraduationCap, title: "Capital Academy", desc: "Dynamically generated, AI-curated coursework focused strictly on asset scaling." }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        transition={{ delay: idx * 0.2 }}
                                        viewport={{ once: true }}
                                        className="flex gap-6 group"
                                    >
                                        <div className="mt-1 w-12 h-12 shrink-0 bg-surface-1 border border-white/5 rounded-2xl flex items-center justify-center group-hover:border-primary/50 transition-colors shadow-xl">
                                            <item.icon size={20} className="text-white group-hover:text-primary transition-colors" />
                                        </div>
                                        <div>
                                            <h5 className="text-white font-black text-lg mb-1">{item.title}</h5>
                                            <p className="text-slate-500 font-medium text-base">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
                            initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                            <div className="relative glass-panel rounded-[3rem] p-12 border-primary/20 backdrop-blur-3xl shadow-[0_0_80px_rgba(212,175,55,0.1)]">
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black font-black"><CheckCircle2 /></div>
                                            <span className="font-black text-white">Smart Parsing</span>
                                        </div>
                                        <div className="text-primary font-bold">100% Success</div>
                                    </div>
                                    <div className="p-8 bg-black/40 rounded-3xl border border-white/5 space-y-4 shadow-2xl">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Recent Insights</p>
                                        <p className="text-xl font-medium text-slate-300 italic">"Your savings velocity increased by 14% this month following the capital reallocation suggested by AI."</p>
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Sparkles size={14} className="text-primary" /></div>
                                            <span className="text-primary font-black text-sm self-center">Coach Recommendation</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs transition-all text-center">
                                        View Dashboard
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ═══ CTA SECTION ═══ */}
                <section className="px-6 py-40 relative flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent blur-3xl opacity-30 pointer-events-none" />

                    <motion.div
                        whileInView={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 50 }}
                        viewport={{ once: true }}
                        className="max-w-4xl space-y-12 relative z-10"
                    >
                        <h2 className="text-6xl md:text-9xl font-black text-white leading-[0.9] tracking-tighter">
                            THE LAST <br /> <span className="text-primary">FINANCE APP</span> YOU'LL <br /> EVER NEED.
                        </h2>

                        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto pt-4 leading-relaxed">
                            Stop guessing. Start command-line level execution. Join the private network of India's most vision-oriented investors today.
                        </p>

                        <div className="flex flex-col md:flex-row gap-6 justify-center pt-4">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(212, 175, 55, 0.5)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/login')}
                                className="h-24 px-16 bg-gradient-to-r from-primary via-[#F9E29C] to-primary bg-[length:200%_auto] text-black font-black rounded-full text-2xl shadow-3xl transition-all duration-700 hover:bg-[position:right_center]"
                            >
                                Secure My Access
                            </motion.button>
                        </div>

                        <div className="flex items-center justify-center gap-6 pt-4 text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                            <span className="flex items-center gap-2"><Lock size={12} /> Military Grade</span>
                            <span className="flex items-center gap-2"><Globe size={12} /> Global Support</span>
                            <span className="flex items-center gap-2"><Shield size={12} /> SOC2 Ready</span>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* ═══ FOOTER ═══ */}
            <footer className="relative z-10 bg-[#050505] pt-20 pb-10 px-6">
                {/* Gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1 space-y-5">
                            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                                <span className="text-white text-lg font-black tracking-tight">RupeeWise</span>
                            </div>
                            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                                The personal finance operating system for India's next generation of wealth builders.
                            </p>
                        </div>

                        {/* Product */}
                        <div className="space-y-4">
                            <h6 className="text-zinc-300 font-semibold text-sm">Product</h6>
                            <ul className="space-y-3 text-zinc-500 text-sm">
                                <li><a href="#terminal" className="hover:text-white transition-colors">Simulator</a></li>
                                <li><a href="#ecosystem" className="hover:text-white transition-colors">Ecosystem</a></li>
                                <li><a href="#academy" className="hover:text-white transition-colors">Academy</a></li>
                                <li><a onClick={() => navigate('/login')} className="hover:text-white transition-colors cursor-pointer">Dashboard</a></li>
                            </ul>
                        </div>

                        {/* Social */}
                        <div className="space-y-4">
                            <h6 className="text-zinc-300 font-semibold text-sm">Socials</h6>
                            <div className="flex gap-4">
                                <a href="https://www.instagram.com/rupeewise.money/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                                    <Instagram size={18} />
                                </a>
                                <a href="https://www.youtube.com/@rupeewisesp" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                                    <Youtube size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Legal */}
                        <div className="space-y-4">
                            <h6 className="text-zinc-300 font-semibold text-sm">Legal</h6>
                            <ul className="space-y-3 text-zinc-500 text-sm">
                                <li><a onClick={() => navigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</a></li>
                                <li><a onClick={() => navigate('/terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</a></li>
                                <li><a onClick={() => navigate('/risk')} className="hover:text-white transition-colors cursor-pointer">Risk Disclosure</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-zinc-800/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-zinc-600 text-xs">
                            © {new Date().getFullYear()} RupeeWise Technologies. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-zinc-600 text-xs">
                            <span className="flex items-center gap-1.5"><Lock size={12} /> Encrypted</span>
                            <span className="flex items-center gap-1.5"><Shield size={12} /> SOC2 Ready</span>
                            <span className="flex items-center gap-1.5"><Fingerprint size={12} /> GDPR</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
