import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, TrendingUp, Shield, BarChart, DollarSign, 
  Home, Globe, Award, Zap, Rocket
} from 'lucide-react';

interface NodeProps {
  title: string;
  icon: React.ReactNode;
  status: 'locked' | 'unlocked' | 'completed';
  onClick: () => void;
  description?: string;
  position: { x: number, y: number };
  delay: number;
}

const TreeNode: React.FC<NodeProps> = ({ title, icon, status, onClick, description, position, delay }) => {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 200, damping: 20 }}
      onClick={!isLocked ? onClick : undefined}
      className={`absolute p-4 rounded-3xl border border-white/10 flex flex-col items-center text-center gap-2 z-10 group backdrop-blur-md
        ${isLocked ? 'bg-zinc-900/50 cursor-not-allowed grayscale' : 
          isCompleted ? 'bg-primary/20 cursor-pointer hover:bg-primary/30 border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.3)]' : 
          'bg-zinc-800/80 cursor-pointer hover:-translate-y-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20'}`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className={`p-4 rounded-2xl transition-all duration-300 ${isLocked ? 'bg-zinc-800 text-zinc-500' : isCompleted ? 'bg-primary text-white shadow-lg' : 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/50'}`}>
        {icon}
      </div>
      <div className="max-w-[120px]">
        <h4 className={`font-bold text-sm tracking-wide ${isLocked ? 'text-zinc-500' : 'text-white'}`}>{title}</h4>
        {description && <p className="text-[10px] text-zinc-400 mt-1 leading-tight group-hover:text-zinc-300 transition-colors uppercase tracking-widest">{description}</p>}
      </div>
      
      
      {isCompleted && (
        <div className="absolute -top-3 -right-3 bg-success text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-900">
          <Award size={14} strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
};

export const FinancialTree: React.FC<{ onNodeClick: (topic: string) => void }> = ({ onNodeClick }) => {
  const nodes = [
    { id: 'basics', title: 'Financial Basics', desc: 'Money, Inflation', icon: <BookOpen size={24} />, status: 'unlocked', pos: { x: 50, y: 50 } },
    { id: 'investing', title: 'Investing 101', desc: 'Stocks, MFs, Risk', icon: <TrendingUp size={24} />, status: 'unlocked', pos: { x: 25, y: 25 } },
    { id: 'sip', title: 'Mastering SIP', desc: 'Systematic Saving', icon: <BarChart size={24} />, status: 'unlocked', pos: { x: 75, y: 25 } },
    { id: 'funds', title: 'Mutual Fund Secrets', desc: 'Direct & Index', icon: <DollarSign size={24} />, status: 'unlocked', pos: { x: 25, y: 75 } },
    { id: 'portfolio', title: 'Risk & Portfolio', desc: 'Asset Allocation', icon: <Shield size={24} />, status: 'unlocked', pos: { x: 75, y: 75 } },
    { id: 'psychology', title: 'Market Psychology', desc: 'Greed & Fear', icon: <Zap size={24} />, status: 'unlocked', pos: { x: 50, y: 15 } },
  ];

  return (
    <div className="glass-panel rounded-3xl relative min-h-[600px] overflow-hidden bg-zinc-950/40 border border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" />
      
      <div className="relative w-full h-full min-w-[700px] min-h-[600px]">
        {/* Connection Lines (Organic curves) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
                <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {/* Connection Paths with Dash Animation */}
            <motion.g 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="tree-paths"
            >
                {/* Active Paths to all nodes */}
                <path d="M 50% 50% Q 25% 50%, 25% 25%" fill="none" stroke="url(#activeGrad)" strokeWidth="3" strokeDasharray="6 6" filter="url(#glow)" className="animate-dash" />
                <path d="M 50% 50% Q 75% 50%, 75% 25%" fill="none" stroke="url(#activeGrad)" strokeWidth="3" strokeDasharray="6 6" filter="url(#glow)" className="animate-dash" />
                <path d="M 50% 50% Q 25% 50%, 25% 75%" fill="none" stroke="url(#activeGrad)" strokeWidth="3" strokeDasharray="6 6" filter="url(#glow)" className="animate-dash" />
                <path d="M 50% 50% Q 75% 50%, 75% 75%" fill="none" stroke="url(#activeGrad)" strokeWidth="3" strokeDasharray="6 6" filter="url(#glow)" className="animate-dash" />
                <path d="M 50% 50% L 50% 15%" fill="none" stroke="url(#activeGrad)" strokeWidth="3" strokeDasharray="6 6" filter="url(#glow)" className="animate-dash" />
            </motion.g>
        </svg>

        {nodes.map((node, index) => (
          <TreeNode 
            key={node.id}
            title={node.title}
            description={node.desc}
            icon={node.icon}
            status={node.status as any}
            position={node.pos}
            delay={index * 0.1}
            onClick={() => onNodeClick(node.title)}
          />
        ))}
      </div>

      {/* Background Decor */}
      <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
          <Rocket size={150} className="text-primary" />
      </div>
    </div>
  );
};
