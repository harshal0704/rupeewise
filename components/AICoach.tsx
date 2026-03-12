import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { MarkdownRenderer } from '../services/markdownRenderer';
import { Send, User, Bot, Sparkles } from 'lucide-react';

const AICoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Namaste! I'm your RupeeWise coach. Ask me anything about saving, investing in India, or planning for your future goals.",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMessage].map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await getFinancialAdvice(history);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Coach Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">RupeeWise AI Coach</h1>
            <p className="text-xs text-zinc-400">Your personal finance assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/20 text-white'
                  : 'glass-panel'
                }`}
            >
              {msg.role === 'model' ? (
                <MarkdownRenderer content={msg.text} />
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}
              <p className="text-[10px] text-zinc-500 mt-2">
                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-3 flex gap-3 items-center mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about investments, tax saving, budgeting..."
          className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-zinc-500"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-primary text-zinc-900 rounded-xl flex items-center justify-center hover:bg-primary/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AICoach;
