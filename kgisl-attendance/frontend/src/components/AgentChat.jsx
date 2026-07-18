import React, { useState, useRef, useEffect } from 'react';
import { sendAgentMessage } from '../services/api';

export default function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'agent', text: "Hello! I'm Genius, your Faculty Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [messages, isOpen]);

  const openChat = () => {
    setBubbleDismissed(true);
    setAnimating(true);
    setIsOpen(true);
    setTimeout(() => setAnimating(false), 500);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendAgentMessage(textToSend);
      setMessages(prev => [...prev, { sender: 'agent', text: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'agent', text: "Sorry, I couldn't reach the server right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Today's Attendance",
    "Show active sessions",
    "Who is absent today?"
  ];

  return (
    <>
      {/* ─── Floating Launcher Group ─── */}
      <div className={`fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 transition-all duration-300 ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}>

        {/* Preview bubble */}
        {!bubbleDismissed && (
          <div className="agent-bubble flex items-start gap-2 max-w-[200px] cursor-pointer" onClick={openChat}>
            <div
              className="relative rounded-2xl rounded-br-none px-4 py-3 text-xs text-slate-700 leading-relaxed shadow-xl bg-white border border-slate-200"
            >
              👋 Ask me about attendance!
              {/* tail */}
              <span
                className="absolute -bottom-2 right-3 w-0 h-0"
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '0px solid transparent',
                  borderTop: '10px solid #ffffff',
                }}
              />
            </div>
            {/* small dismiss X */}
            <button
              onClick={(e) => { e.stopPropagation(); setBubbleDismissed(true); }}
              className="mt-0.5 text-slate-400 hover:text-slate-600 transition-colors text-xs leading-none"
            >✕</button>
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={openChat}
          className="relative group w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-transparent"
        >
          {/* Glowing Rotating rainbow ring with transparent center */}
          <div className="absolute inset-0 rounded-full rainbow-ring"></div>
          
          {/* Genius label tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-[10px] font-semibold text-slate-700 bg-white shadow border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
            Ask Genius AI
          </span>
        </button>
      </div>

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[300px] md:w-[340px] h-[600px] max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-200"
          style={{
            animation: animating ? 'chatOpen 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
          }}
        >
          {/* Ambient top glow */}
          <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(98,92,168,0.05) 0%, transparent 100%)' }} />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              {/* Avatar with glow ring */}
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-lg bg-white border border-slate-200 shadow-sm">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Genius AI</h3>
                <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Always online
                </p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animation: `msgPop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${idx * 30}ms both` }}
              >
                {msg.sender === 'agent' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-sm mb-0.5 bg-slate-100 border border-slate-200">🤖</div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'text-slate-700 rounded-bl-sm'
                  }`}
                  style={msg.sender === 'user'
                    ? { background: 'linear-gradient(135deg,#7771BD,#625CA8)', boxShadow: '0 2px 10px rgba(98,92,168,0.2)' }
                    : { background: '#f8fafc', border: '1px solid #e2e8f0' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-slate-100 border border-slate-200">🤖</div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center bg-slate-50 border border-slate-200">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="relative z-10 px-3 pb-2 pt-2 flex gap-2 overflow-x-auto no-scrollbar bg-white border-t border-slate-50">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium transition-all hover:scale-105 active:scale-95 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="relative z-10 px-3 pb-3 pt-2 bg-white">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 bg-slate-50 border border-slate-200"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Genius anything…"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7771BD,#625CA8)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @keyframes siriSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .rainbow-ring {
          background: conic-gradient(from 0deg, #00f, #f0f, #f00, #ff0, #0f0, #0ff, #00f);
          filter: blur(1.5px);
          -webkit-mask-image: radial-gradient(transparent 55%, black 60%);
          mask-image: radial-gradient(transparent 55%, black 60%);
          animation: siriSpin 2.5s linear infinite;
        }

        /* Bubble entrance */
        .agent-bubble { animation: bubbleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes bubbleIn {
          from { opacity:0; transform: scale(0.7) translateY(12px); transform-origin: bottom right; }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }

        /* Chat window open — scale+fade from bottom-right origin */
        @keyframes chatOpen {
          from { opacity:0; transform: scale(0.6) translate(10%, 10%); transform-origin: bottom right; }
          to   { opacity:1; transform: scale(1) translate(0,0); }
        }

        /* Per-message pop */
        @keyframes msgPop {
          from { opacity:0; transform: scale(0.85) translateY(8px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
