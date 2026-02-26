import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { cloudinaryService } from '../services/cloudinaryService';
import { Check, ChevronRight, ChevronLeft, Target, Briefcase, GraduationCap, Upload, User, Camera, Plus, X, Sparkles, Trophy, Rocket } from 'lucide-react';

const STEPS = [
    { label: 'Photo', emoji: '📸' },
    { label: 'About', emoji: '✍️' },
    { label: 'Goals', emoji: '🎯' },
    { label: 'Focus', emoji: '🧭' },
    { label: 'Level', emoji: '🚀' },
];

const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        investmentGoal: '',
        experienceLevel: '',
        jobTitle: '',
        dream: '',
        goals: [] as string[],
        avatarUrl: ''
    });
    const [customGoal, setCustomGoal] = useState('');

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            const url = await cloudinaryService.uploadImage(e.target.files[0]);
            if (url) {
                setFormData(prev => ({ ...prev, avatarUrl: url }));
            }
            setLoading(false);
        }
    };

    const addGoal = () => {
        if (customGoal && !formData.goals.includes(customGoal)) {
            setFormData(prev => ({ ...prev, goals: [...prev.goals, customGoal] }));
            setCustomGoal('');
        }
    };

    const removeGoal = (g: string) => {
        setFormData(prev => ({ ...prev, goals: prev.goals.filter(item => item !== g) }));
    };

    const togglePresetGoal = (goal: string) => {
        if (formData.goals.includes(goal)) {
            removeGoal(goal);
        } else {
            setFormData(prev => ({ ...prev, goals: [...prev.goals, goal] }));
        }
    };

    const goals = [
        { id: 'wealth', label: 'Wealth Creation', icon: <Target className="text-emerald-400" size={22} />, desc: 'Build long-term wealth through compounding.', emoji: '💰' },
        { id: 'retirement', label: 'Retirement Planning', icon: <Briefcase className="text-amber-400" size={22} />, desc: 'Secure a financially independent retirement.', emoji: '🏖️' },
        { id: 'tax', label: 'Tax Saving', icon: <Check className="text-yellow-400" size={22} />, desc: 'Optimize tax liabilities efficiently.', emoji: '📊' },
    ];

    const experience = [
        { id: 'beginner', label: 'Beginner', desc: 'I am new to investing.', emoji: '🌱', accent: 'border-amber-500/30 bg-amber-500/5' },
        { id: 'intermediate', label: 'Intermediate', desc: 'I have some experience with stocks/MFs.', emoji: '⚡', accent: 'border-zinc-400/30 bg-zinc-400/5' },
        { id: 'pro', label: 'Pro', desc: 'I actively trade and understand markets.', emoji: '🏆', accent: 'border-yellow-500/30 bg-yellow-500/5' },
    ];

    const presetGoals = [
        { label: '🏠 Buy a Home', value: 'Buy a Home' },
        { label: '🚗 Buy a Car', value: 'Buy a Car' },
        { label: '✈️ Travel Fund', value: 'Travel Fund' },
        { label: '💰 Emergency Fund', value: 'Emergency Fund' },
        { label: '👨‍🎓 Education', value: 'Education' },
        { label: '💍 Wedding', value: 'Wedding' },
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    investment_goal: formData.investmentGoal,
                    experience_level: formData.experienceLevel,
                    job_title: formData.jobTitle,
                    dream: formData.dream,
                    goals: formData.goals,
                    avatar_url: formData.avatarUrl,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .select();

            if (error) throw error;

            setSubmitted(true);
            await refreshProfile();
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error("Onboarding Error:", error);
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (step === 3) return !!formData.investmentGoal;
        if (step === 4) return !!formData.experienceLevel;
        return true;
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--surface-0)' }}>
            {/* Background */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-float pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-float-delayed pointer-events-none" />

            <div className="max-w-2xl w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in-down">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
                        <Sparkles size={12} /> Setting Up Your Account
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Welcome to RupeeWise</h1>
                    <p className="text-zinc-400">Let's personalize your financial journey.</p>
                </div>

                {/* ═══ Progress Bar with Labels ═══ */}
                <div className="flex items-center justify-center gap-1 max-w-lg mx-auto mb-8 animate-fade-in">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={i}>
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${step > i
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : step === i
                                            ? 'bg-primary/20 text-primary border-2 border-primary shadow-lg shadow-primary/20'
                                            : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                    {step > i ? <Check size={14} /> : s.emoji}
                                </div>
                                <span className={`text-[10px] font-semibold transition-colors ${step >= i ? 'text-white' : 'text-zinc-600'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 rounded-full mx-1 transition-all duration-500 mt-[-18px] ${step > i ? 'bg-primary' : 'bg-zinc-800'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* ═══ Card ═══ */}
                <div className="glass-panel p-8 rounded-3xl animate-scale-in">

                    {/* ─── SUCCESS STATE ─── */}
                    {submitted && (
                        <div className="text-center py-12 animate-scale-in">
                            <div className="text-6xl mb-4">🎉</div>
                            <h2 className="text-2xl font-extrabold text-white mb-2">You're All Set!</h2>
                            <p className="text-zinc-400">Redirecting to your dashboard...</p>
                            <div className="mt-6 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    )}

                    {/* ─── STEP 0: Photo ─── */}
                    {!submitted && step === 0 && (
                        <div className="space-y-8 text-center animate-fade-in-up">
                            <div>
                                <h2 className="text-2xl font-extrabold text-white mb-2">Let's see that smile! 📸</h2>
                                <p className="text-zinc-400 text-sm">Upload a profile photo to personalize your experience.</p>
                            </div>

                            <div className="relative w-32 h-32 mx-auto group cursor-pointer">
                                <div className={`w-full h-full rounded-full overflow-hidden border-4 transition-all bg-surface-1 flex items-center justify-center ${formData.avatarUrl ? 'border-primary/50' : 'border-zinc-700 border-dashed group-hover:border-primary/50'
                                    }`}>
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2.5 bg-gradient-to-br from-primary to-secondary text-white rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                                    <Camera size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                                {loading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                {formData.avatarUrl && !loading && (
                                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-surface-0 animate-scale-in">
                                        <Check size={14} className="text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 1: About You ─── */}
                    {!submitted && step === 1 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="text-center">
                                <h2 className="text-2xl font-extrabold text-white mb-2">Tell us about yourself ✍️</h2>
                                <p className="text-zinc-400 text-sm">This helps us personalize your experience.</p>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Job Title / Profession</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className="neumorph-input !pl-4"
                                        placeholder="CEO of my future empire 👑"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">My Big Dream</label>
                                        <span className="text-xs text-zinc-600">{formData.dream.length}/200</span>
                                    </div>
                                    <textarea
                                        value={formData.dream}
                                        onChange={(e) => setFormData({ ...formData, dream: e.target.value.slice(0, 200) })}
                                        className="neumorph-input !pl-4 h-24 resize-none"
                                        placeholder="Buy a beach house in Goa, retire by 45... 🏖️"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 2: Specific Goals ─── */}
                    {!submitted && step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="text-center">
                                <h2 className="text-2xl font-extrabold text-white mb-2">What are your goals? 🎯</h2>
                                <p className="text-zinc-400 text-sm">Pick presets or add custom goals.</p>
                            </div>

                            {/* Preset Chips */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                {presetGoals.map((pg) => (
                                    <button
                                        key={pg.value}
                                        onClick={() => togglePresetGoal(pg.value)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${formData.goals.includes(pg.value)
                                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/10'
                                                : 'bg-surface-2 text-zinc-400 border border-transparent hover:border-zinc-600 hover:text-white'
                                            }`}
                                    >
                                        {pg.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Goal Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customGoal}
                                    onChange={(e) => setCustomGoal(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                                    className="neumorph-input !pl-4 flex-1"
                                    placeholder="Add a custom goal..."
                                />
                                <button onClick={addGoal} className="p-3 bg-surface-2 text-zinc-400 rounded-xl hover:bg-primary hover:text-white transition-all">
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Selected Goals */}
                            {formData.goals.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.goals.map((g, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-primary/15 text-primary border border-primary/20 rounded-lg text-sm font-semibold flex items-center gap-2 animate-scale-in">
                                            {g}
                                            <button onClick={() => removeGoal(g)} className="hover:text-white transition-colors"><X size={14} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── STEP 3: Primary Goal ─── */}
                    {!submitted && step === 3 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="text-center">
                                <h2 className="text-2xl font-extrabold text-white mb-2">What's your primary focus? 🧭</h2>
                            </div>
                            <div className="grid gap-4">
                                {goals.map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => setFormData({ ...formData, investmentGoal: goal.id })}
                                        className={`p-5 rounded-2xl border flex items-center gap-4 transition-all text-left group ${formData.investmentGoal === goal.id
                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                            : 'border-zinc-800 bg-surface-1 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="text-2xl">{goal.emoji}</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{goal.label}</h3>
                                            <p className="text-sm text-zinc-400 mt-0.5">{goal.desc}</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.investmentGoal === goal.id
                                                ? 'border-primary bg-primary'
                                                : 'border-zinc-600'
                                            }`}>
                                            {formData.investmentGoal === goal.id && <Check size={14} className="text-white animate-scale-in" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 4: Experience ─── */}
                    {!submitted && step === 4 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="text-center">
                                <h2 className="text-2xl font-extrabold text-white mb-2">What's your experience level? 🚀</h2>
                            </div>
                            <div className="grid gap-4">
                                {experience.map((exp) => (
                                    <button
                                        key={exp.id}
                                        onClick={() => setFormData({ ...formData, experienceLevel: exp.id })}
                                        className={`p-5 rounded-2xl border text-left transition-all ${formData.experienceLevel === exp.id
                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                            : `${exp.accent} hover:border-zinc-500`
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{exp.emoji}</span>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white text-lg">{exp.label}</h3>
                                                <p className="text-sm text-zinc-400 mt-0.5">{exp.desc}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.experienceLevel === exp.id
                                                    ? 'border-primary bg-primary'
                                                    : 'border-zinc-600'
                                                }`}>
                                                {formData.experienceLevel === exp.id && <Check size={14} className="text-white animate-scale-in" />}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ Navigation Buttons ═══ */}
                    {!submitted && (
                        <div className="flex gap-3 mt-8">
                            {step > 0 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="px-5 py-3.5 bg-surface-2 text-white font-semibold rounded-xl hover:bg-surface-3 transition-all flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>
                            )}
                            {step < 4 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!canProceed()}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/20"
                                >
                                    {step === 0 ? (formData.avatarUrl ? 'Looking Good!' : 'Skip for Now') : 'Continue'} <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canProceed() || loading}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/20"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>Launch My Dashboard <Rocket size={18} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
