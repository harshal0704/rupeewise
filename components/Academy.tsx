import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Brain, ChevronRight, PlayCircle, Award, HelpCircle, TrendingUp, FileText, CheckCircle, XCircle, RefreshCw, Plus, Loader2, X, Globe, BarChart2, DollarSign, Zap, Network } from 'lucide-react';
import { getFinancialAdvice, generateFullCourse, generateDailyQuiz } from '../services/geminiService';
import { MarkdownRenderer } from '../services/markdownRenderer';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FinancialTree } from './FinancialTree';

const DEFAULT_COURSES = [
    {
        title: 'Financial Basics',
        description: 'Learn the fundamentals of money, inflation, and compounding.',
        icon: 'BookOpen',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        lessons: [
            { title: 'Understanding Inflation', duration: '5 min', content: '# Understanding Inflation\n\nInflation is the rate at which the general level of prices for goods and services is rising. As inflation rises, every rupee you own buys a smaller percentage of a good or service.\n\n### Why it matters\nIf your savings account gives you 4% interest, but inflation is 6%, your money is actually **losing** 2% of its purchasing power every year.\n\n### How to beat it\nYou must invest your money in assets that generate returns higher than the inflation rate, such as Equity (Stocks/Mutual Funds) or Real Estate.' },
            { title: 'Power of Compounding', duration: '8 min', content: '# The Power of Compounding\n\nCompounding is the process where the value of an investment increases because the earnings on an investment, both capital gains and interest, earn interest as time passes.\n\n### The Magic Formula\n`A = P(1 + r/n)^(nt)`\n\nAlbert Einstein reportedly called compound interest the "eighth wonder of the world". He who understands it, earns it; he who doesn\'t, pays it.\n\n### Example\nIf you invest ₹5,000 every month (SIP) at 12% annual return for 20 years, your total investment of ₹12 Lakhs will grow to approximately **₹50 Lakhs**!' },
            { title: 'Assets vs Liabilities', duration: '6 min', content: '# Assets vs Liabilities\n\nThe fundamental rule of getting rich is understanding the difference between an asset and a liability.\n\n### Simple Definition\n*   **Asset:** Puts money IN your pocket (e.g., Dividend-paying stocks, Rental property, Bonds).\n*   **Liability:** Takes money OUT of your pocket (e.g., Car loan, Credit card debt, Expensive gadgets).\n\n### The Golden Rule\nRich people acquire assets. The poor and middle class acquire liabilities that they *think* are assets.' }
        ]
    },
    {
        title: 'Mastering SIP',
        description: 'The ultimate guide to Systematic Investment Plans and wealth creation.',
        icon: 'BarChart2',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        lessons: [
            { title: 'What is a SIP?', duration: '5 min', content: '# What is a SIP?\n\nA Systematic Investment Plan (SIP) is a method of investing a fixed sum of money in a mutual fund scheme at regular intervals—monthly, quarterly, or semi-annually.\n\n### Benefits\n1.  **Disciplined Investing:** Automated savings.\n2.  **No Market Timing:** You don\'t need to guess when the market is low.\n3.  **Rupee Cost Averaging:** You buy more units when prices are low and fewer when they are high.' },
            { title: 'Lumpsum vs SIP', duration: '7 min', content: '# Lumpsum vs SIP\n\n### Lumpsum\nInvesting a large amount at once. Best when the market has crashed or is significantly undervalued.\n\n### SIP\nInvesting small amounts regularly. Best for long-term wealth creation and managing volatility.\n\n### The Winner?\nFor most salaried individuals, **SIP** is the superior strategy as it matches their income stream and reduces the emotional stress of market crashes.' },
            { title: 'Magic of Step-up SIP', duration: '10 min', content: '# The Magic of Step-up SIP\n\nA Step-up SIP is increasing your monthly investment by a fixed percentage or amount every year (e.g., increasing by 10% annually as your salary grows).\n\n### Impact\nIf you start a SIP of ₹10,000 for 20 years at 12%, you get **₹99 Lakhs**.\nIf you **Step-up** by just 10% every year, you get **₹1.5 Crores**!\n\nThat\'s the power of incremental growth.' }
        ]
    },
    {
        title: 'Mutual Fund Secrets',
        description: 'Everything you need to know about fund types, ratios, and picks.',
        icon: 'PieChart',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        lessons: [
            { title: 'Direct vs Regular Plans', duration: '8 min', content: '# Direct vs Regular Mutual Funds\n\n### Regular Plans\nYou invest through a broker/distributor. They get a commission from your investment every year.\n\n### Direct Plans\nYou invest directly with the AMC. No commission is paid to anyone.\n\n### The Cost\nDirect plans usually have a **1% lower** expense ratio. Over 20 years, this "small" 1% can save you **Lakhs of Rupees** in lost returns.' },
            { title: 'Expense Ratio & Exit Load', duration: '6 min', content: '# Fund Costs Explained\n\n### Expense Ratio\nThe annual fee the mutual fund charges to manage your money. Always look for funds with lower expense ratios (ideally < 1%).\n\n### Exit Load\nA fee charged if you sell your units before a certain period (usually 1 year). This is to discourage short-term trading.' },
            { title: 'Active vs Passive Funds', duration: '10 min', content: '# Active vs Passive Investing\n\n### Active Funds\nFund managers try to "beat the market" by picking specific stocks. High fees.\n\n### Passive (Index) Funds\nThe fund simply copies an index like Nifty 50. Low fees.\n\n### Which to choose?\nIn developed markets, passive wins. In India, many active funds still beat the index, but Index funds are becoming increasingly popular for their low cost and simplicity.' }
        ]
    },
    {
        title: 'Risk & Portfolio',
        description: 'Learn to balance your portfolio and manage market volatility.',
        icon: 'Shield',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        lessons: [
            { title: 'Asset Allocation', duration: '10 min', content: '# Asset Allocation\n\nAsset allocation is the most important decision you will make. It is the process of dividing your investments among different asset categories, such as stocks, bonds, and cash.\n\n### The 100-Age Rule\nA common rule of thumb is: `Equity % = 100 - your age`.\nIf you are 25, you should have 75% in equity. If you are 60, only 40%.\n\n### Why it works\nDifferent assets perform differently in various market conditions. When stocks are down, gold or bonds might be up, protecting your overall wealth.' },
            { title: 'Emergency Fund', duration: '5 min', content: '# The Emergency Fund\n\nBefore you invest a single rupee in the stock market, you MUST have an emergency fund.\n\n### How much?\nAt least **6 months** of your essential living expenses (Rent, Food, EMI, Insurance).\n\n### Where to keep it?\nIn a highly liquid place like a Savings Ash account or a Liquid Mutual Fund. It is not meant to earn high returns; it is meant to provide **Peace of Mind**.' },
            { title: 'Rebalancing', duration: '8 min', content: '# Portfolio Rebalancing\n\nOver time, some investments grow faster than others, changing your original asset allocation.\n\n### Example\nYou started with 50% Equity and 50% Debt. After a bull market, your Equity is now 70%.\n\n### The Action\nYou sell some equity and buy debt to bring it back to 50/50. This forces you to **Sell High and Buy Low** automatically!' }
        ]
    },
    {
        title: 'Market Psychology',
        description: 'Understand the emotional roller coaster of investing.',
        icon: 'Zap',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        lessons: [
            { title: 'Greed vs Fear', duration: '7 min', content: '# Greed vs Fear\n\nThe stock market is driven by two primary emotions.\n\n### Greed\nWhen prices are rising, everyone wants to buy. This pushes prices even higher, creating a bubble. People often buy at the top because of **FOMO** (Fear of Missing Out).\n\n### Fear\nWhen prices fall, panic sets in. People sell their good investments at low prices just to make the pain stop.\n\n### The Pro Tip\n"Be fearful when others are greedy, and greedy when others are fearful." — Warren Buffett' },
            { title: 'Loss Aversion', duration: '6 min', content: '# Loss Aversion\n\nPsychologically, the pain of losing ₹1,000 is **twice as powerful** as the joy of gaining ₹1,000.\n\n### Why it hurts\nThis bias often makes investors hold onto "losers" (falling stocks) for too long, hoping they will break even, while selling "winners" too early to lock in small gains.' }
        ]
    },
    {
        title: 'Investing 101',
        description: 'A beginner guide to stocks, mutual funds, and risk.',
        icon: 'TrendingUp',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        lessons: [
            { title: 'Stocks vs Mutual Funds', duration: '10 min', content: '# Stocks vs Mutual Funds\n\n### Direct Stocks\nBuying shares of a single company (e.g., Reliance, TCS). \n*   **Pros:** High return potential, full control.\n*   **Cons:** High risk, requires deep research and time.\n\n### Mutual Funds\nA pool of money from many investors managed by a professional fund manager.\n*   **Pros:** Built-in diversification, professionally managed, easy to start via SIP.\n*   **Cons:** Management fees (Expense Ratio), less control over specific stock picks.' },
            { title: 'Risk Management', duration: '7 min', content: '# Risk Management\n\nIn investing, risk and reward are directly correlated. Higher potential returns usually come with higher risk.\n\n### Types of Risk\n1.  **Market Risk:** The entire market goes down.\n2.  **Inflation Risk:** Your returns don\'t beat inflation.\n3.  **Liquidity Risk:** You can\'t sell your asset when you need cash.\n\n### How to manage it\n*   Never invest money you need in the short term (next 1-3 years) into the stock market.\n*   Maintain an Emergency Fund (6 months of living expenses) in a liquid asset like an FD or liquid mutual fund.' },
            { title: 'Diversification Strategy', duration: '12 min', content: '# Diversification\n\n"Don\'t put all your eggs in one basket."\n\nDiversification is a risk management strategy that mixes a wide variety of investments within a portfolio. A diversified portfolio contains a mix of distinct asset types and investment vehicles in an attempt at limiting exposure to any single asset or risk.\n\n### Asset Allocation in India\nA standard balanced portfolio might look like:\n*   **Equity (High Risk/High Reward):** 60%\n*   **Debt/FD/Bonds (Low Risk/Stable):** 30%\n*   **Gold (Hedge against inflation):** 10%' }
        ]
    }
];

const Academy: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'courses' | 'tree'>('courses');
    const [courseTab, setCourseTab] = useState<'inprogress' | 'completed'>('inprogress');
    
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);

    // Course Generator State
    const [courseTopic, setCourseTopic] = useState('');
    const [generatingCourse, setGeneratingCourse] = useState(false);

    // Reader State
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [markingComplete, setMarkingComplete] = useState(false);

    // Quiz State
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

    const [modules, setModules] = useState<any[]>(DEFAULT_COURSES);

    // Fetch and Seed Courses
    useEffect(() => {
        const fetchCourses = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase.from('courses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                if (error) throw error;

                if (data && data.length > 0) {
                    // Prepend user specifically generated courses that aren't in the default set
                    const userGenerated = data.filter(d => !DEFAULT_COURSES.find(dc => dc.title === d.title));
                    setModules([...userGenerated, ...DEFAULT_COURSES]);
                } else {
                    // Seed initial data with user context
                    const defaultCoursesWithUser = DEFAULT_COURSES.map(c => ({ user_id: user.id, ...c }));
                    const { data: insertedData, error: insertError } = await supabase.from('courses').insert(defaultCoursesWithUser).select();
                    if (!insertError && insertedData) {
                        setModules(insertedData);
                    }
                }
            } catch (err) {
                console.error("Error fetching/seeding courses:", err);
            }
        };

        fetchCourses();
    }, [user]);

    // Helper to render dynamic icons
    const renderIcon = (iconName: string, className: string) => {
        const icons: any = { BookOpen, TrendingUp, FileText, Globe, BarChart2, DollarSign, Zap };
        const IconComponent = icons[iconName] || BookOpen;
        return <IconComponent className={className} size={24} />;
    };

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

    const handleGenerateCourse = async (eOrTopic?: string | React.FormEvent) => {
        let targetTopic = courseTopic;
        
        if (typeof eOrTopic === 'string') {
            targetTopic = eOrTopic;
        } else if (eOrTopic && (eOrTopic as React.FormEvent).preventDefault) {
            (eOrTopic as React.FormEvent).preventDefault();
        }

        if (!targetTopic || !user) return;

        setGeneratingCourse(true);
        setActiveTab('courses'); // switch to courses view to see it generated
        
        try {
            const courseData = await generateFullCourse(targetTopic);
            if (courseData) {
                const { data, error } = await supabase.from('courses').insert({
                    user_id: user.id,
                    ...courseData
                }).select();

                if (!error && data) {
                    setModules(prev => [data[0], ...prev]);
                    setCourseTopic('');
                } else {
                    throw error;
                }
            } else {
                alert("Failed to generate course. Please try a different topic.");
            }
        } catch (error) {
            console.error("Course Gen Error:", error);
            alert("Error creating course.");
        } finally {
            setGeneratingCourse(false);
        }
    };

    const handleNodeClick = (topic: string) => {
        const existing = modules.find(m => m.title === topic);
        if (existing) {
            setActiveTab('courses');
            setSelectedCourse(existing);
        } else {
            handleGenerateCourse(topic);
        }
    };

    const handleMarkAsComplete = async () => {
        if (!selectedCourse?.id) {
            setModules(prev => prev.map(m => m.title === selectedCourse.title ? { ...m, is_completed: true } : m));
            setSelectedCourse({ ...selectedCourse, is_completed: true });
            return;
        }

        setMarkingComplete(true);
        try {
            const { error } = await supabase.from('courses').update({ is_completed: true }).eq('id', selectedCourse.id);
            if (error) throw error;
            
            setModules(prev => prev.map(m => m.id === selectedCourse.id ? { ...m, is_completed: true } : m));
            setSelectedCourse({ ...selectedCourse, is_completed: true });
        } catch (e) {
            console.error("Failed to mark complete:", e);
        } finally {
            setMarkingComplete(false);
        }
    };

    const handleLessonClick = (lesson: any) => {
        if (lesson.content) {
            setSelectedLesson(lesson);
        } else if (lesson.url) {
            window.open(lesson.url, '_blank', 'noopener,noreferrer');
        }
    };

    const startDailyQuiz = async () => {
        setQuizLoading(true);
        try {
            const questions = await generateDailyQuiz();
            if (questions && questions.length > 0) {
                setQuizQuestions(questions);
                setQuizStarted(true);
            } else {
                alert("Could not generate quiz at this time.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setQuizLoading(false);
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
        setQuizQuestions([]);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="text-primary" /> RupeeWise Academy
                    </h1>
                    <p className="text-zinc-400">Master your money with structured paths and AI tutoring.</p>
                </div>
                <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/80 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('tree')}
                        className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${activeTab === 'tree' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Network size={14} /> Curriculum Tree
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${activeTab === 'courses' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <BookOpen size={14} /> My Courses
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* AI Generator Input - Located outside tabs so it is always visible on top */}
                    <div className="glass-panel p-4 rounded-xl flex gap-3 items-center border border-primary/30 bg-primary/10 shadow-lg shadow-primary/5">
                        <Brain className="text-primary" size={24} />
                        <form onSubmit={handleGenerateCourse as any} className="flex-1 flex gap-2">
                            <input
                                type="text"
                                placeholder="Generate a full course on any topic (e.g. 'Bitcoin', 'Options')"
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-400 text-sm"
                                value={courseTopic}
                                onChange={e => setCourseTopic(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={generatingCourse || !courseTopic}
                                className="bg-primary hover:bg-primary-glow text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {generatingCourse ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Create Course
                            </button>
                        </form>
                    </div>

                    {activeTab === 'tree' ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white mb-2">Finance Major Pathway</h2>
                            <p className="text-sm text-zinc-400 mb-6">Click on any unlocked node to automatically generate a tailored crash course on that topic using AI.</p>
                            <FinancialTree onNodeClick={handleNodeClick} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <h2 className="text-xl font-bold text-white">Course Library</h2>
                                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/80">
                                    <button
                                        onClick={() => setCourseTab('inprogress')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${courseTab === 'inprogress' ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        In Progress
                                    </button>
                                    <button
                                        onClick={() => setCourseTab('completed')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${courseTab === 'completed' ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        Completed
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {modules.filter(m => courseTab === 'completed' ? m.is_completed : !m.is_completed).map((module, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedCourse(module)}
                                        className={`glass-panel p-6 rounded-2xl transition-all group animate-scale-in cursor-pointer ${module.is_completed ? 'opacity-60 grayscale hover:grayscale-0 border-transparent hover:border-zinc-700' : 'hover:border-primary/50'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${module.bg || 'bg-primary/10'} flex items-center justify-center mb-4`}>
                                            {renderIcon(module.icon, module.color || 'text-primary')}
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{module.title}</h3>
                                            {module.is_completed && <CheckCircle size={18} className="text-green-500 opacity-50" />}
                                        </div>
                                        {module.description && <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{module.description}</p>}
                                        <div className="space-y-3 pointer-events-none">
                                            {module.lessons.map((lesson: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between items-center text-sm text-zinc-400 opacity-80"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <PlayCircle size={14} />
                                                        <span className="line-clamp-1">{lesson.title}</span>
                                                    </div>
                                                    <span className="text-xs opacity-60 whitespace-nowrap">{lesson.duration}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            className="block w-full text-center mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors pointer-events-none"
                                        >
                                            {module.is_completed ? 'Review Course' : 'Start Learning'}
                                        </button>
                                    </div>
                                ))}
                                {modules.filter(m => courseTab === 'completed' ? m.is_completed : !m.is_completed).length === 0 && (
                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                                        <BookOpen className="mx-auto text-zinc-600 mb-4" size={32} />
                                        <h3 className="text-lg font-bold text-zinc-300">No courses found</h3>
                                        <p className="text-sm text-zinc-500 mt-2">
                                            {courseTab === 'completed' 
                                                ? "You haven't completed any courses yet. Keep learning!" 
                                                : "You have no active courses. Generate one using AI!"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Side Panel: AI + Quiz */}
                <div className="space-y-6">
                    {/* Interactive Quiz Widget */}
                    <div className="glass-panel p-6 rounded-3xl relative overflow-hidden min-h-[250px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                        {!quizStarted ? (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <Award className="text-accent" size={20} />
                                    <h3 className="font-bold text-white">Daily AI Quiz</h3>
                                </div>
                                <p className="text-sm text-zinc-300 mb-6">Challenge yourself with 5 dynamic, AI-generated finance questions tailored to the Indian market.</p>
                                <button
                                    onClick={startDailyQuiz}
                                    disabled={quizLoading}
                                    className="w-full py-3 bg-accent hover:bg-accent/80 text-white font-bold rounded-xl transition-colors shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {quizLoading ? <Loader2 className="animate-spin" size={18} /> : 'Start Challenge'}
                                </button>
                            </>
                        ) : showResults ? (
                            <div className="text-center animate-fade-in">
                                <Award className="text-yellow-400 mx-auto mb-2" size={48} />
                                <h3 className="text-xl font-bold text-white mb-2">Quiz Complete!</h3>
                                <p className="text-zinc-300 mb-4">You scored <span className="text-primary font-bold text-xl">{score}/{quizQuestions.length}</span></p>
                                <button
                                    onClick={resetQuiz}
                                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="animate-fade-in w-full">
                                <div className="flex justify-between items-center mb-4 text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                    <span>Q {currentQuestion + 1}/{quizQuestions.length}</span>
                                    <span>Score: {score}</span>
                                </div>
                                <p className="text-white font-medium mb-6 leading-relaxed text-sm">{quizQuestions[currentQuestion].question}</p>
                                <div className="space-y-3">
                                    {quizQuestions[currentQuestion].options.map((option: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            disabled={selectedAnswer !== null}
                                            className={`w-full text-left p-3 rounded-xl text-sm transition-all font-medium border ${selectedAnswer === idx
                                                ? idx === quizQuestions[currentQuestion].correct
                                                    ? 'bg-green-500/20 text-green-300 border-green-500/50'
                                                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 border-zinc-700/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{option}</span>
                                                {selectedAnswer === idx && (
                                                    idx === quizQuestions[currentQuestion].correct
                                                        ? <CheckCircle size={16} className="text-green-400" />
                                                        : <XCircle size={16} className="text-red-400" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Tutor */}
                    <div className="glass-panel p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-900/50 border-primary/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">AI Tutor</h3>
                                <p className="text-xs text-zinc-400">Ask anything, get simple answers.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAskAI} className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    placeholder="e.g. What is a PE ratio?"
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none pr-10"
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
                            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                                <div className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-sm">
                                    <MarkdownRenderer content={aiResponse} />
                                </div>
                                <button
                                    onClick={() => { setAiQuery(''); setAiResponse(''); }}
                                    className="mt-4 text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                                >
                                    <RefreshCw size={12} /> Clear Chat
                                </button>
                            </div>
                        )}

                        {!aiResponse && !loading && (
                            <div className="text-center py-8 text-zinc-500">
                                <HelpCircle size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Try asking: "How does SIP work?"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Full-Screen Page */}
            {selectedCourse && !selectedLesson && (
                <div className="fixed inset-0 z-[9999] bg-[#09090b] flex flex-col animate-fade-in overflow-hidden">
                    {/* Top Nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur-xl shrink-0">
                        <button
                            onClick={() => setSelectedCourse(null)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                        >
                            <div className="p-2 rounded-xl bg-zinc-800/80 group-hover:bg-zinc-700 transition-colors">
                                <X size={18} />
                            </div>
                            <span className="text-sm font-semibold hidden sm:inline">Back to Academy</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${selectedCourse.bg || 'bg-primary/10'} flex items-center justify-center`}>
                                {renderIcon(selectedCourse.icon, selectedCourse.color || 'text-primary')}
                            </div>
                            <div>
                                <h1 className="text-base font-black text-white leading-tight">{selectedCourse.title}</h1>
                                <p className="text-[11px] text-zinc-500">{selectedCourse.lessons?.length || 0} lessons</p>
                            </div>
                        </div>
                        {selectedCourse.is_completed ? (
                            <div className="flex items-center gap-2 text-green-400 text-sm font-bold px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                                <CheckCircle size={15} /> Completed
                            </div>
                        ) : (
                            <button
                                onClick={handleMarkAsComplete}
                                disabled={markingComplete}
                                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/80 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {markingComplete ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Mark Complete
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl mx-auto px-6 py-10">
                            {selectedCourse.description && (
                                <p className="text-zinc-400 text-base mb-10 leading-relaxed border-l-4 border-primary/50 pl-4">{selectedCourse.description}</p>
                            )}
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Course Lessons</h2>
                            <div className="space-y-3">
                                {selectedCourse.lessons?.map((lesson: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedLesson(lesson)}
                                        className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center text-sm font-black group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{lesson.title}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">{lesson.duration || '5 min'} read</p>
                                            </div>
                                        </div>
                                        <PlayCircle size={22} className="text-zinc-600 group-hover:text-primary transition-colors shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lesson Full-Screen Page */}
            {selectedLesson && (
                <div className="fixed inset-0 z-[10000] bg-[#09090b] flex flex-col animate-fade-in overflow-hidden">
                    {/* Top Nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur-xl shrink-0">
                        <button
                            onClick={() => setSelectedLesson(null)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                        >
                            <div className="p-2 rounded-xl bg-zinc-800/80 group-hover:bg-zinc-700 transition-colors">
                                <X size={18} />
                            </div>
                            <span className="text-sm font-semibold hidden sm:inline">Back to Course</span>
                        </button>
                        <div className="text-center">
                            <h1 className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">{selectedLesson.title}</h1>
                            <p className="text-[11px] text-primary font-bold uppercase tracking-widest">{selectedLesson.duration} read</p>
                        </div>
                        <button
                            onClick={() => setSelectedLesson(null)}
                            className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/80 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
                        >
                            <CheckCircle size={14} /> Done
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl mx-auto px-6 py-12">
                            <article className="prose prose-invert prose-emerald max-w-none font-medium leading-relaxed text-zinc-300 prose-headings:font-black prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg">
                                <MarkdownRenderer content={selectedLesson.content} />
                            </article>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center shrink-0">
                        <button
                            onClick={() => setSelectedLesson(null)}
                            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
                        >
                            ← Back to Course
                        </button>
                        <button
                            onClick={() => setSelectedLesson(null)}
                            className="px-8 py-3 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
                        >
                            Complete Lesson ✓
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Academy;