import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfUse: React.FC = () => {
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
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-12"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-surface-1 border border-primary/20 shadow-[0_0_40px_rgba(212,168,83,0.1)]">
                        <FileText className="text-primary" size={16} />
                        <span className="text-primary text-[11px] font-black uppercase tracking-[0.2em]">Operational Code</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                        Terms of <br /><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] via-[#F9E29C] to-[#B8860B]">Use</span>
                    </h1>

                    <div className="prose prose-invert prose-lg max-w-none text-slate-400 font-medium">
                        <p className="lead text-2xl text-slate-300 font-light mb-12">
                            The framework governing your access to the RupeeWise Terminal and Ecosystem. By initiating access, you agree to these operational parameters.
                        </p>

                        <div className="space-y-16">
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Service Definition</h2>
                                <p>
                                    RupeeWise is a comprehensive personal finance and wealth management operating system. Features include AI-driven UPI syncing, strategy backtesting, time machine challenges, and Monte Carlo statistical wealth projections ("The Services").
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Account Responsibility</h2>
                                <p>
                                    Users must maintain the confidentiality of their authentication credentials. You are architecturally responsible for all activities occurring under your account identifier.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Accuracy of Tooling</h2>
                                <p>
                                    While our simulators and AI coaches utilize advanced algorithms and real-time market data (such as Finnhub integrations), these are analytical tools, not certified financial advisement. Output from the Pro-Tier Sandbox, AI Wealth Insight, and Academy should be verified independently.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Usage Limitations</h2>
                                <p>
                                    Scraping, reverse-engineering the AI prompts, or overwhelming the backend data pipelines with automated scripts is strictly prohibited and will result in immediate termination of the secure access linkage.
                                </p>
                            </section>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default TermsOfUse;
