import React, { useState, useRef, useEffect } from 'react';
import { sendAgentMessage } from '../services/api';

export default function StudentAgentChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'agent', text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your personal attendance assistant. I can only answer questions about your own attendance and details.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [messages, isOpen]);

  const openChat = () => {
    setBubbleDismissed(true);
    setAnimating(true);
    setIsOpen(true);
    setTimeout(() => setAnimating(false), 500);
  };

  const closeChat = () => setIsOpen(false);

  // Build a scoped system context with only the current student's details
  const buildStudentContext = (userMessage) => {
    const studentInfo = `
[SYSTEM CONTEXT - STUDENT ONLY MODE]
You are a personal attendance assistant for this specific student ONLY.
You must ONLY discuss information about this student. Do NOT reveal other students' data.

Student Details:
- Name: ${user?.name || 'Unknown'}
- Roll No: ${user?.rollNo || 'N/A'}
- Email: ${user?.email || 'N/A'}
- Department: ${user?.department || 'N/A'}
- Batch/Year: ${user?.batch || user?.year || 'N/A'}
- Role: Student

Rules:
1. Only answer questions about THIS student's attendance and details.
2. If asked about other students, say "I can only show your own details."
3. Be friendly and helpful regarding QR scanning and attendance.
4. If asked general attendance questions (how to scan, etc.), answer them.

User Question: ${userMessage}
    `.trim();
    return studentInfo;
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setIsTyping(true);

    try {
      const scopedMessage = buildStudentContext(textToSend);
      const response = await sendAgentMessage(scopedMessage);
      setMessages(prev => [...prev, { sender: 'agent', text: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', text: "Sorry, I couldn't reach the server right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "What are my details?",
    "How do I scan QR?",
    "My attendance status",
  ];

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">

      {/* Welcome Bubble */}
      {!bubbleDismissed && (
        <div className="mb-1 animate-bounce-in">
          <div className="relative max-w-[180px] rounded-2xl rounded-br-sm bg-white px-3 py-2 shadow-lg border border-slate-100">
            <p className="text-[11px] text-slate-600 font-medium leading-snug">Hi {user?.name?.split(' ')[0]}! Need help? 👋</p>
            <button onClick={() => setBubbleDismissed(true)} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[9px] flex items-center justify-center hover:bg-slate-300">✕</button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="w-[300px] h-[480px] max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-[#0d1117] border border-white/10"
          style={{ animation: animating ? 'chatOpen 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
            <div className="relative w-8 h-8 rounded-full bg-black flex items-center justify-center overflow-hidden shrink-0">
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)', filter: 'blur(2px)', animation: 'siriSpin 3s linear infinite' }} />
              <div className="absolute inset-[2px] rounded-full bg-black z-10 flex items-center justify-center overflow-hidden">
                <div className="w-7 h-7 rounded-full blur-md" style={{ background: 'radial-gradient(circle at 40% 40%, #60a5fa 0%, #c084fc 40%, #fb7185 80%)', animation: 'siriPulse 2.5s ease-in-out infinite, siriSpin 4s linear infinite reverse', opacity: 0.75 }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white">My Assistant</p>
              <p className="text-[10px] text-slate-400 truncate">Showing only your details</p>
            </div>
            <button onClick={closeChat} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">×</button>
          </div>

          {/* Student Info Badge */}
          <div className="mx-3 mt-2.5 mb-1 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-indigo-300">{user?.rollNo || user?.email}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => handleSend(p)}
                className="shrink-0 text-[10px] font-medium text-slate-300 bg-white/6 hover:bg-white/12 border border-white/10 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap">
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-white/10 bg-black/20 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about your attendance..."
              className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
            />
            <button onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={openChat}
        className="relative group w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-black"
      >
        <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f43f5e, #3b82f6)', filter: 'blur(2px)', animation: 'siriSpin 3s linear infinite' }} />
        <div className="absolute inset-[2px] rounded-full bg-black z-10 flex items-center justify-center overflow-hidden">
          <div className="w-10 h-10 rounded-full blur-md" style={{ background: 'radial-gradient(circle at 40% 40%, #60a5fa 0%, #c084fc 40%, #fb7185 80%)', animation: 'siriPulse 2.5s ease-in-out infinite, siriSpin 4s linear infinite reverse', opacity: 0.75 }} />
        </div>
        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-[10px] font-semibold text-slate-700 bg-white shadow border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
          My Assistant
        </span>
      </button>

      <style>{`
        @keyframes siriSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes siriPulse { 0%, 100% { transform: scale(0.85); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes chatOpen { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
