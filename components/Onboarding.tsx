import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Check, ChevronRight, Target, Briefcase, GraduationCap } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        investmentGoal: '',
        experienceLevel: '',
    });

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
                .update({
                    investment_goal: formData.investmentGoal,
                    experience_level: formData.experienceLevel,
                    onboarding_completed: true
                })
                .eq('id', user.id);

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
                <div className="flex gap-2 max-w-xs mx-auto mb-10">
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-slate-800'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-slate-800'}`} />
                </div>

                <div className="glass-panel p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl animate-scale-in">
                    {step === 1 && (
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
                                onClick={() => setStep(2)}
                                disabled={!formData.investmentGoal}
                                className="w-full py-4 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Continue <ChevronRight />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
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
                                    onClick={() => setStep(1)}
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
