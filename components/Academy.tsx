import React, { useState } from 'react';
import { BookOpen, GraduationCap, Brain, ChevronRight, PlayCircle, Award, HelpCircle, TrendingUp, FileText, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';

const Academy: React.FC = () => {
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);

    // Quiz State
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    const quizQuestions = [
        {
            question: "What is the primary benefit of a SIP (Systematic Investment Plan)?",
            options: ["Guaranteed 50% returns", "Rupee Cost Averaging", "No tax liability", "Instant liquidity"],
            correct: 1
        },
        {
            question: "Which of these is considered a 'Safe Haven' asset during market crashes?",
            options: ["Small Cap Stocks", "Gold", "Crypto", "Futures & Options"],
            correct: 1
        },
        {
            question: "In the New Tax Regime (FY 2024-25), up to what income is tax-free?",
            options: ["₹5 Lakhs", "₹7 Lakhs", "₹3 Lakhs", "₹2.5 Lakhs"],
            correct: 1
        }
    ];

    const modules = [
        {
            id: 'basics',
            title: 'Financial Basics',
            icon: BookOpen,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            lessons: [
                { title: 'Understanding Inflation', duration: '5 min', url: 'https://www.investopedia.com/terms/i/inflation.asp' },
                { title: 'Power of Compounding', duration: '8 min', url: 'https://www.investopedia.com/terms/c/compounding.asp' },
                { title: 'Assets vs Liabilities', duration: '6 min', url: 'https://www.richdad.com/fake-assets-vs-liabilities' }
            ]
        },
        {
            id: 'investing',
            title: 'Investing 101',
            icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            lessons: [
                { title: 'Stocks vs Mutual Funds', duration: '10 min', url: 'https://zerodha.com/varsity/chapter/introduction-to-stock-markets/' },
                { title: 'Risk Management', duration: '7 min', url: 'https://www.investopedia.com/terms/r/riskmanagement.asp' },
                { title: 'Diversification Strategy', duration: '12 min', url: 'https://www.investopedia.com/terms/d/diversification.asp' }
            ]
        },
        {
            id: 'tax',
            title: 'Tax Planning',
            icon: FileText,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            lessons: [
                { title: 'Old vs New Regime', duration: '15 min', url: 'https://cleartax.in/s/old-tax-regime-vs-new-tax-regime' },
                { title: 'Section 80C Explained', duration: '8 min', url: 'https://cleartax.in/s/80c-deductions' },
                { title: 'Tax Harvesting', duration: '10 min', url: 'https://zerodha.com/varsity/chapter/tax-loss-harvesting/' }
            ]
        }
    ];

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery) return;
        setLoading(true);
        try {
            const prompt = `
                Act as a friendly and patient financial tutor. 
                Explain the following concept to a beginner investor in India: "${aiQuery}". 
                Use analogies, keep it simple (ELI5), and mention any specific Indian context if applicable (like RBI, SEBI, tax rules).
            `;
            const history = [{ role: 'user', parts: [{ text: prompt }] }];
            const response = await getFinancialAdvice(history);
            setAiResponse(response);
        } catch (error) {
            console.error("AI Error:", error);
            setAiResponse("I'm having trouble connecting to my knowledge base. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        setSelectedAnswer(index);

        setTimeout(() => {
            if (index === quizQuestions[currentQuestion].correct) {
                setScore(s => s + 1);
            }

            if (currentQuestion < quizQuestions.length - 1) {
                setCurrentQuestion(c => c + 1);
                setSelectedAnswer(null);
            } else {
                setShowResults(true);
            }
        }, 1000);
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setCurrentQuestion(0);
        setScore(0);
        setShowResults(false);
        setSelectedAnswer(null);
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
                            <div key={module.id} className="glass-panel p-6 rounded-2xl hover:border-primary/50 transition-all group">
                                <div className={`w-12 h-12 rounded-xl ${module.bg} flex items-center justify-center mb-4`}>
                                    <module.icon className={module.color} size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{module.title}</h3>
                                <div className="space-y-3">
                                    {module.lessons.map((lesson, idx) => (
                                        <a
                                            key={idx}
                                            href={lesson.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex justify-between items-center text-sm text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer group/lesson"
                                        >
                                            <div className="flex items-center gap-2">
                                                <PlayCircle size={14} className="group-hover/lesson:text-primary transition-colors" />
                                                <span>{lesson.title}</span>
                                            </div>
                                            <span className="text-xs opacity-60">{lesson.duration}</span>
                                        </a>
                                    ))}
                                </div>
                                <a
                                    href={module.lessons[0].url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Start Learning
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Panel: AI + Quiz */}
                <div className="space-y-6">
                    {/* AI Tutor */}
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
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                                <button
                                    onClick={() => { setAiQuery(''); setAiResponse(''); }}
                                    className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw size={10} /> Ask another question
                                </button>
                            </div>
                        )}

                        {!aiResponse && !loading && (
                            <div className="text-center py-8 text-slate-500">
                                <HelpCircle size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Try asking: "How does SIP work?"</p>
                            </div>
                        )}
                    </div>

                    {/* Interactive Quiz Widget */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden min-h-[250px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                        {!quizStarted ? (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <Award className="text-accent" size={20} />
                                    <h3 className="font-bold text-white">Daily Quiz</h3>
                                </div>
                                <p className="text-sm text-slate-300 mb-6">Test your knowledge on Finance and earn XP!</p>
                                <button
                                    onClick={() => setQuizStarted(true)}
                                    className="w-full py-2 bg-accent hover:bg-accent/80 text-white font-bold rounded-xl transition-colors shadow-lg shadow-accent/20"
                                >
                                    Take Quiz (+50 XP)
                                </button>
                            </>
                        ) : showResults ? (
                            <div className="text-center animate-fade-in">
                                <Award className="text-yellow-400 mx-auto mb-2" size={48} />
                                <h3 className="text-xl font-bold text-white mb-2">Quiz Complete!</h3>
                                <p className="text-slate-300 mb-4">You scored <span className="text-primary font-bold">{score}/{quizQuestions.length}</span></p>
                                <button
                                    onClick={resetQuiz}
                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="animate-fade-in w-full">
                                <div className="flex justify-between items-center mb-4 text-xs text-slate-400">
                                    <span>Question {currentQuestion + 1}/{quizQuestions.length}</span>
                                    <span>Score: {score}</span>
                                </div>
                                <p className="text-white font-medium mb-4">{quizQuestions[currentQuestion].question}</p>
                                <div className="space-y-2">
                                    {quizQuestions[currentQuestion].options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            disabled={selectedAnswer !== null}
                                            className={`w-full text-left p-2 rounded-lg text-sm transition-all ${selectedAnswer === idx
                                                    ? idx === quizQuestions[currentQuestion].correct
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                                        : 'bg-red-500/20 text-red-300 border border-red-500/50'
                                                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{option}</span>
                                                {selectedAnswer === idx && (
                                                    idx === quizQuestions[currentQuestion].correct
                                                        ? <CheckCircle size={14} className="text-green-400" />
                                                        : <XCircle size={14} className="text-red-400" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Academy;
