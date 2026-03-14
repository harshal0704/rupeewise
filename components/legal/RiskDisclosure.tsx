import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RiskDisclosure: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#050607] font-sans selection:bg-primary/40 selection:text-white text-slate-100 flex flex-col">
            <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-5 backdrop-blur-md border-b border-white/5 transition-all">
                <div onClick={() => navigate('/welcome')} className="flex items-center gap-3 group cursor-pointer">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ChevronLeft className="text-white group-hover:-translate-x-1 transition-transform" size={20} />
                    </button>
                    <span className="text-white font-bold tracking-widest uppercase text-sm">Return Home</span>
                </div>
            </nav>

            <main className="flex-1 max-w-4xl mx-auto px-6 py-40 relative z-10 w-full">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-12"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                        <ShieldAlert className="text-red-400" size={16} />
                        <span className="text-red-400 text-[11px] font-black uppercase tracking-[0.2em]">Market Reality</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                        Risk <br /><span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-500">Disclosure</span>
                    </h1>

                    <div className="prose prose-invert prose-lg max-w-none text-slate-400 font-medium">
                        <p className="lead text-2xl text-slate-300 font-light mb-12">
                            Elite wealth execution requires understanding downside volatility. The tools provided by RupeeWise are instruments for analysis, not guarantees of infinite returns.
                        </p>

                        <div className="space-y-16">
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Market Volatility Warning</h2>
                                <p>
                                    All financial trading, including equity, forex, and cryptocurrency tracking represented in our Market Hub, carries profound risk. Your capital is never insulated from total loss. Never deploy capital you cannot survive losing.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Simulation Imperfections</h2>
                                <p>
                                    The Pro-Tier SimulationSandbox (Backtester, Time Machine, Monte Carlo) utilizes historical time series and random walk physics. <strong className="text-white">Past performance and simulated historical realities do not dictate future market dynamics.</strong> A winning strategy in the backtester can fail instantly in live fire.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Information Velocity</h2>
                                <p>
                                    While our multi-source News Aggregation Engine and Finnhub APIs attempt to provide real-time latency, data delays, inaccuracies, and misprints can occur. Never execute a massive capital transition based solely on a single headline rendered within the app.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. No Advisory Fiduciary</h2>
                                <p>
                                    RupeeWise functions as a software interface (OS) for personal finance management. Neither the platform nor the embedded AI Coach acts as a registered financial advisor or fiduciary.
                                </p>
                            </section>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default RiskDisclosure;
