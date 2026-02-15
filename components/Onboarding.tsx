import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { cloudinaryService } from '../services/cloudinaryService';
import { Check, ChevronRight, Target, Briefcase, GraduationCap, Upload, User, Camera, Plus, X } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // Start at 0 for Profile Photo
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        investmentGoal: '',
        experienceLevel: '',
        jobTitle: '',
        dream: '',
        goals: [] as string[],
        avatarUrl: ''
    });

    // Custom Goal Input
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

    const goals = [
        { id: 'wealth', label: 'Wealth Creation', icon: <Target className="text-emerald-400" />, desc: 'Build long-term wealth through compounding.' },
        { id: 'retirement', label: 'Retirement Planning', icon: <Briefcase className="text-blue-400" />, desc: 'Secure a financially independent retirement.' },
        { id: 'tax', label: 'Tax Saving', icon: <Check className="text-purple-400" />, desc: 'Optimize tax liabilities efficiently.' },
    ];

    const experience = [
        { id: 'beginner', label: 'Beginner', desc: 'I am new to investing.' },
        { id: 'intermediate', label: 'Intermediate', desc: 'I have some experience with stocks/MFs.' },
        { id: 'pro', label: 'Pro', desc: 'I actively trade and understand markets.' },
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ // Changed to upsert to handle missing rows
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

            await refreshProfile(); // Update context state
            navigate('/');
        } catch (error) {
            console.error("Onboarding Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10 animate-fade-in">
                    <h1 className="text-4xl font-bold text-white mb-2">Welcome to RupeeWise</h1>
                    <p className="text-slate-400">Let's personalize your financial journey.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 max-w-sm mx-auto mb-10">
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 0 ? 'bg-primary' : 'bg-slate-800'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-slate-800'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-slate-800'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-primary' : 'bg-slate-800'}`} />
                </div>

                <div className="glass-panel p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl animate-scale-in">

                    {step === 0 && (
                        <div className="space-y-8 text-center">
                            <h2 className="text-2xl font-bold text-white">Let's see that smile!</h2>
                            <p className="text-slate-400">Upload a profile photo to personalize your experience.</p>

                            <div className="relative w-32 h-32 mx-auto group cursor-pointer">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-800 group-hover:border-primary transition-colors bg-slate-800 flex items-center justify-center">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-slate-500" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full cursor-pointer hover:bg-primary-glow transition-all shadow-lg">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                                {loading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-primary-glow transition-all flex items-center justify-center gap-2"
                            >
                                {formData.avatarUrl ? 'Looking Good!' : 'Skip for Now'} <ChevronRight />
                            </button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center">Tell us about yourself</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">Job Title / Profession</label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors"
                                        placeholder="e.g. Software Engineer, Student"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">My Big Dream</label>
                                    <textarea
                                        value={formData.dream}
                                        onChange={(e) => setFormData({ ...formData, dream: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary transition-colors h-24 resize-none"
                                        placeholder="e.g. Buy a beach house in Goa, Retire by 45..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(0)} className="px-6 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all">Back</button>
                                <button
                                    onClick={() => setStep(2)}
                                    // disabled={!formData.jobTitle}
                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-all flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center">What are your specific goals?</h2>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customGoal}
                                    onChange={(e) => setCustomGoal(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
                                    placeholder="Add a goal (e.g. Save 1 Lakh)"
                                />
                                <button onClick={addGoal} className="p-3 bg-slate-800 text-white rounded-xl hover:bg-primary hover:text-white transition-colors">
                                    <Plus />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {formData.goals.length === 0 && <p className="text-sm text-slate-500 w-full text-center py-4">Add at least one goal to start tracking.</p>}
                                {formData.goals.map((g, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-semibold flex items-center gap-2 animate-fade-in">
                                        {g}
                                        <button onClick={() => removeGoal(g)} className="hover:text-white"><X size={14} /></button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all">Back</button>
                                <button
                                    onClick={() => setStep(3)} // Move to original Step 1 (Investment Goal)
                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-all flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center">What is your primary goal?</h2>
                            <div className="grid gap-4">
                                {goals.map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => setFormData({ ...formData, investmentGoal: goal.id })}
                                        className={`p-4 rounded-xl border flex items-center gap-4 transition-all text-left group ${formData.investmentGoal === goal.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="p-3 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">{goal.icon}</div>
                                        <div>
                                            <h3 className="font-bold text-white">{goal.label}</h3>
                                            <p className="text-sm text-slate-400">{goal.desc}</p>
                                        </div>
                                        {formData.investmentGoal === goal.id && <Check className="ml-auto text-primary" />}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!formData.investmentGoal}
                                className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continue <ChevronRight />
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-white text-center">What's your experience level?</h2>
                            <div className="grid gap-4">
                                {experience.map((exp) => (
                                    <button
                                        key={exp.id}
                                        onClick={() => setFormData({ ...formData, experienceLevel: exp.id })}
                                        className={`p-6 rounded-xl border text-center transition-all ${formData.experienceLevel === exp.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                                            }`}
                                    >
                                        <h3 className="font-bold text-white text-lg">{exp.label}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{exp.desc}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setStep(3)}
                                    className="px-6 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.experienceLevel || loading}
                                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Setting up...' : 'Get Started'}
                                    {!loading && <Check />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
