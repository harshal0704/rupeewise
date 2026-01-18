import React, { useState } from 'react';
import { Target, Plus, Trash2, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: 'Short Term' | 'Long Term' | 'Retirement';
    color: string;
}

const GoalPlanner: React.FC = () => {
    const [goals, setGoals] = useState<Goal[]>([
        { id: '1', title: 'Europe Trip', targetAmount: 250000, currentAmount: 112500, deadline: '2024-12-01', category: 'Short Term', color: '#6366f1' },
        { id: '2', title: 'Emergency Fund', targetAmount: 500000, currentAmount: 350000, deadline: '2025-01-01', category: 'Long Term', color: '#10b981' },
        { id: '3', title: 'New Car', targetAmount: 1200000, currentAmount: 200000, deadline: '2026-06-01', category: 'Long Term', color: '#f59e0b' },
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({ category: 'Short Term', color: '#6366f1' });

    const calculateMonthlySavings = (target: number, current: number, deadline: string) => {
        const months = (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (months <= 0) return 0;
        return Math.ceil((target - current) / months);
    };

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) return;

        const goal: Goal = {
            id: Date.now().toString(),
            title: newGoal.title,
            targetAmount: Number(newGoal.targetAmount),
            currentAmount: Number(newGoal.currentAmount) || 0,
            deadline: newGoal.deadline,
            category: newGoal.category as any,
            color: newGoal.color || '#6366f1'
        };

        setGoals([...goals, goal]);
        setShowAddModal(false);
        setNewGoal({ category: 'Short Term', color: '#6366f1' });
    };

    const handleDelete = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
    };

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
                    className="px-4 py-2 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> Add Goal
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Goals List */}
                <div className="lg:col-span-2 space-y-6">
                    {goals.map((goal) => {
                        const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                        const monthlyNeeded = calculateMonthlySavings(goal.targetAmount, goal.currentAmount, goal.deadline);

                        return (
                            <div key={goal.id} className="glass-panel p-6 rounded-2xl group hover:border-primary/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                                            {progress}%
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{goal.title}</h3>
                                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                                <Calendar size={14} /> Target: {new Date(goal.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(goal.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-300">₹{goal.currentAmount.toLocaleString()} saved</span>
                                        <span className="text-slate-400">Target: ₹{goal.targetAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progress}%`, backgroundColor: goal.color }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <TrendingUp size={16} className="text-green-400" />
                                        <span>Save <span className="text-white font-bold">₹{monthlyNeeded.toLocaleString()}</span> / month to reach on time</span>
                                    </div>
                                    <button className="text-primary text-sm font-bold flex items-center hover:underline">
                                        Add Funds <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Widget */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-lg font-bold text-white mb-6">Goal Distribution</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={goals}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="currentAmount"
                                        stroke="none"
                                    >
                                        {goals.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {goals.map(goal => (
                                <div key={goal.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }}></div>
                                        <span className="text-slate-300">{goal.title}</span>
                                    </div>
                                    <span className="text-white font-bold">₹{goal.currentAmount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Goal Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-6">Create New Goal</h2>
                        <form onSubmit={handleAddGoal} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Goal Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
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
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                        value={newGoal.targetAmount || ''}
                                        onChange={e => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Current Saved (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                        value={newGoal.currentAmount || ''}
                                        onChange={e => setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Target Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    value={newGoal.deadline || ''}
                                    onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-glow transition-colors"
                                >
                                    Create Goal
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
