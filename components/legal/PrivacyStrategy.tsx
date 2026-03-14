import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyStrategy: React.FC = () => {
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
                        <Shield className="text-primary" size={16} />
                        <span className="text-primary text-[11px] font-black uppercase tracking-[0.2em]">Zero Knowledge</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                        Privacy <br /><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] via-[#F9E29C] to-[#B8860B]">Strategy</span>
                    </h1>

                    <div className="prose prose-invert prose-lg max-w-none text-slate-400 font-medium">
                        <p className="lead text-2xl text-slate-300 font-light mb-12">
                            Your financial nebula requires institutional-grade protection. At RupeeWise, we treat your data as an asset we are guarding, not a commodity to be traded.
                        </p>

                        <div className="space-y-16">
                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. The Zero-Knowledge Principle</h2>
                                <p>
                                    Our core architecture is built on absolute encryption. We parse your financial data intelligently via SMS algorithms solely on your local device or highly secured server shards. We do not sell, rent, or trade your personal financial footprint. The insights generated belong uniquely and exclusively to you.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Transaction Syncing & AI Parsing</h2>
                                <p>
                                    When utilizing our AI-powered UPI tracking, data extracts are processed with strict isolation. Descriptors, amounts, and metadata are anonymized. The AI coach operates under a strict privacy tunnel, ensuring your queries regarding tax optimization and wealth generation are sealed.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Data Sovereignty</h2>
                                <p>
                                    You maintain terminal velocity control over your data. Upon request, instances of your account, history, and simulation parameters can be permanently wiped from our relational infrastructure.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Strategic Partnerships</h2>
                                <p>
                                    We rely on enterprise-grade providers like Supabase for authentication and database management, and robust LLM APIs for intelligence. These partners are vetted for SOC2 compliance and adhere to stringent data protection policies.
                                </p>
                            </section>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default PrivacyStrategy;
