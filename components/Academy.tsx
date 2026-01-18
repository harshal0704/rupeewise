import React, { useState } from 'react';
import { BookOpen, GraduationCap, Brain, ChevronRight, PlayCircle, Award, HelpCircle } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';

const Academy: React.FC = () => {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const modules = [
        {
            id: 'basics',
            title: 'Financial Basics',
            icon: BookOpen,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            lessons: [
                { title: 'Understanding Inflation', duration: '5 min' },
                { title: 'Power of Compounding', duration: '8 min' },
                { title: 'Assets vs Liabilities', duration: '6 min' }
            ]
        },
        {
            id: 'investing',
            title: 'Investing 101',
            icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            lessons: [
                { title: 'Stocks vs Mutual Funds', duration: '10 min' },
                { title: 'Risk Management', duration: '7 min' },
                { title: 'Diversification Strategy', duration: '12 min' }
            ]
        },
        {
            id: 'tax',
            title: 'Tax Planning',
            icon: FileText,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            lessons: [
                { title: 'Old vs New Regime', duration: '15 min' },
                { title: 'Section 80C Explained', duration: '8 min' },
                { title: 'Tax Harvesting', duration: '10 min' }
            ]
        }
    ];

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery) return;
        setLoading(true);
        try {
            const history = [{ role: 'user', parts: [{ text: `Explain this financial concept like I'm 15 years old: ${aiQuery}` }] }];
            const response = await getFinancialAdvice(history);
            setAiResponse(response);
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="text-primary" /> RupeeWise Academy
                </h1>
                <p className="text-slate-400">Master your money with bite-sized lessons and AI tutoring.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Learning Modules */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white">Course Library</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {modules.map((module) => (
                            <div key={module.id} className="glass-panel p-6 rounded-2xl hover:border-primary/50 transition-all group cursor-pointer">
                                <div className={`w-12 h-12 rounded-xl ${module.bg} flex items-center justify-center mb-4`}>
                                    <module.icon className={module.color} size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{module.title}</h3>
                                <div className="space-y-3">
                                    {module.lessons.map((lesson, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <PlayCircle size={14} />
                                                <span>{lesson.title}</span>
                                            </div>
                                            <span className="text-xs opacity-60">{lesson.duration}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                    Start Learning
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Tutor Side Panel */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/50 border-primary/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">AI Tutor</h3>
                                <p className="text-xs text-slate-400">Ask anything, get simple answers.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAskAI} className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    placeholder="e.g. What is a PE ratio?"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none pr-10"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !aiQuery}
                                    className="absolute right-2 top-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-glow disabled:opacity-50 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </form>

                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {aiResponse && (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 animate-fade-in">
                                <p className="text-sm text-slate-300 leading-relaxed">{aiResponse}</p>
                            </div>
                        )}

                        {!aiResponse && !loading && (
                            <div className="text-center py-8 text-slate-500">
                                <HelpCircle size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Try asking: "How does SIP work?"</p>
                            </div>
                        )}
                    </div>

                    {/* Daily Quiz Widget */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="text-accent" size={20} />
                            <h3 className="font-bold text-white">Daily Quiz</h3>
                        </div>
                        <p className="text-sm text-slate-300 mb-4">Test your knowledge on Mutual Funds and earn XP!</p>
                        <button className="w-full py-2 bg-accent hover:bg-accent/80 text-white font-bold rounded-xl transition-colors shadow-lg shadow-accent/20">
                            Take Quiz (+50 XP)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Icons needed for the modules array
import { TrendingUp, FileText } from 'lucide-react';

export default Academy;
