import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Calendar, TrendingUp, ChevronRight, Calculator, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface Goal {
    id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    category: 'Short Term' | 'Long Term' | 'Retirement';
    color: string;
    image_url?: string;
}

const GoalPlanner: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({ category: 'Short Term', color: '#6366f1' });
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchGoals();
        }
    }, [user]);

    const fetchGoals = async () => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('deadline', { ascending: true });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error("Error fetching goals:", error);
            // addNotification("Error", "Failed to load goals", "error");
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlySavings = (target: number, current: number, deadline: string) => {
        const months = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (months <= 0) return 0;
        const needed = Math.ceil((target - current) / months);
        return needed > 0 ? needed : 0;
    };

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title || !newGoal.target_amount || !newGoal.deadline || !user) return;
        setCreateLoading(true);

        try {
            const { error } = await supabase
                .from('goals')
                .insert([{
                    user_id: user.id,
                    title: newGoal.title,
                    target_amount: newGoal.target_amount,
                    current_amount: newGoal.current_amount || 0,
                    deadline: newGoal.deadline,
                    category: newGoal.category,
                    color: newGoal.color
                    // Note: image_url could be added here if we want to persist specific ones
                }]);

            if (error) throw error;

            addNotification("Goal Created", "Keep pushing towards your dreams!", "success");
            await fetchGoals();
            setShowAddModal(false);
            setNewGoal({ category: 'Short Term', color: '#6366f1' });
        } catch (error) {
            console.error("Error adding goal:", error);
            addNotification("Error", "Failed to create goal", "error");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        try {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', id);

            if (error) throw error;
            addNotification("Goal Deleted", "Goal removed successfully.", "info");
            setGoals(goals.filter(g => g.id !== id));
        } catch (error) {
            console.error("Error deleting goal:", error);
            addNotification("Error", "Failed to delete goal", "error");
        }
    };

    const handleAddFunds = async (goal: Goal) => {
        const amountStr = prompt("Enter amount to add (₹):");
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) return;

        try {
            const newAmount = goal.current_amount + amount;
            const { error } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', goal.id);

            if (error) throw error;

            addNotification("Funds Added", `₹${amount} added to ${goal.title}`, "success");
            setGoals(goals.map(g => g.id === goal.id ? { ...g, current_amount: newAmount } : g));
        } catch (error) {
            console.error("Error updating goal:", error);
            addNotification("Error", "Failed to add funds", "error");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading goals...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Target className="text-primary" /> Goal Planner
                    </h1>
                    <p className="text-slate-400">Visualize and track your financial dreams.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/25"
                >
                    <Plus size={20} /> New Goal
                </button>
            </header>

            {goals.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                    <Target size={48} className="text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Goals Yet</h3>
                    <p className="text-slate-400 mt-2">Start by adding your first financial goal.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {goals.map((goal) => {
                        const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
                        const monthlyNeeded = calculateMonthlySavings(goal.target_amount, goal.current_amount, goal.deadline);
                        const isCompleted = progress >= 100;
                        const getGoalImage = (title: string, category: string) => {
                            const t = title.toLowerCase();
                            // Static high-quality images for common goals to avoid broken dynamic links
                            if (t.includes('car') || t.includes('vehicle')) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80';
                            if (t.includes('home') || t.includes('house') || t.includes('flat')) return 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80';
                            if (t.includes('trip') || t.includes('travel') || t.includes('paris') || t.includes('europe')) return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';
                            if (t.includes('wedding') || t.includes('marriage')) return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
                            if (t.includes('emergency') || category === 'Short Term') return 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=800&q=80'; // Piggy bank
                            if (category === 'Retirement') return 'https://images.unsplash.com/photo-1526304640152-d4619684e485?auto=format&fit=crop&w=800&q=80'; // Old couple/relaxing

                            // Dynamic fallback - using a search term that is likely to exist or a generic one
                            return `https://source.unsplash.com/800x600/?${encodeURIComponent(title)},money`;
                        };

                        const unsplashUrl = getGoalImage(goal.title, goal.category);

                        return (
                            <div key={goal.id} className="glass-panel rounded-2xl overflow-hidden group hover:border-primary/50 transition-all flex flex-col h-full relative">
                                {/* Image Header */}
                                <div className="h-40 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
                                    <img
                                        src={unsplashUrl}
                                        alt={goal.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80'; // Fallback to Money
                                        }}
                                    />
                                    <div className="absolute top-4 right-4 z-20">
                                        <button
                                            onClick={() => handleDelete(goal.id)}
                                            className="p-2 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-6 z-20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                                                {goal.category}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white shadow-black drop-shadow-lg">{goal.title}</h3>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-slate-400 mb-1">Saved</p>
                                                <p className="text-xl font-bold text-white">₹{goal.current_amount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 mb-1">Target</p>
                                                <p className="text-sm font-medium text-slate-300">₹{goal.target_amount.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="relative pt-1">
                                            <div className="flex mb-2 items-center justify-between">
                                                <div className="text-right">
                                                    <span className="text-xs font-semibold inline-block text-primary">
                                                        {progress}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-800">
                                                <div
                                                    style={{ width: `${progress}%` }}
                                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isCompleted ? 'bg-green-500' : 'bg-primary'} transition-all duration-1000 ease-out`}
                                                ></div>
                                            </div>
                                        </div>

                                        {!isCompleted ? (
                                            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                <Calculator size={18} className="text-secondary mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">
                                                        Save <span className="text-white font-bold">₹{monthlyNeeded.toLocaleString()}/mo</span> to reach your goal by {new Date(goal.deadline).toLocaleDateString()}.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-green-400 font-bold justify-center p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                                <CheckCircle2 size={20} /> Goal Achieved!
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={() => handleAddFunds(goal)}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white"
                                        >
                                            <Plus size={18} /> Add Funds
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Goal Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl animate-scale-in">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Target className="text-primary" /> Create New Goal
                        </h2>
                        <form onSubmit={handleAddGoal} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Goal Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dream Home"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
                                    value={newGoal.title || ''}
                                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Target Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="500000"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
                                        value={newGoal.target_amount || ''}
                                        onChange={e => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Saved So Far (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
                                        value={newGoal.current_amount || ''}
                                        onChange={e => setNewGoal({ ...newGoal, current_amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Target Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-primary"
                                    value={newGoal.deadline || ''}
                                    onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-glow transition-colors disabled:opacity-50"
                                >
                                    {createLoading ? 'Creating...' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalPlanner;
