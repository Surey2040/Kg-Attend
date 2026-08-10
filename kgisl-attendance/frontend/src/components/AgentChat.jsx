import React, { useState, useRef, useEffect } from 'react';
import { sendAgentMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import aiRobotImage from '../assets/ai-robot.png';

// Helper component to parse and render structured agent messages cleanly
function FormattedAgentMessage({ text }) {
  if (!text) return null;

  // Split into lines
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed w-full">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header Section
        if (trimmed.startsWith('[HEADER]')) {
          const headerText = trimmed.replace('[HEADER]', '').trim();
          return (
            <div key={idx} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 mb-2">
              <span>🎓</span>
              <span>{headerText}</span>
            </div>
          );
        }

        // Section Title
        if (trimmed.startsWith('[SECTION]')) {
          const sectionText = trimmed.replace('[SECTION]', '').trim();
          return (
            <div key={idx} className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-200 pb-1 mt-3 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{sectionText}</span>
            </div>
          );
        }

        // Key-Value Pair Line (e.g. "Name: SURENDER VIGNESH M" or "Roll Number: 25MCA110")
        if (trimmed.includes(':')) {
          const colonIdx = trimmed.indexOf(':');
          const label = trimmed.substring(0, colonIdx).trim();
          const value = trimmed.substring(colonIdx + 1).trim();

          // Status Badges rendering
          if (label === 'Exam Eligibility') {
            const isEligible = value.includes('ELIGIBLE');
            return (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">{label}:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  isEligible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {value}
                </span>
              </div>
            );
          }

          if (label === 'Signature Status') {
            const isSigned = value.includes('SIGNED & VERIFIED');
            return (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">{label}:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {value}
                </span>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-baseline justify-between py-1 border-b border-slate-100 last:border-0 gap-2">
              <span className="font-medium text-slate-500 shrink-0">{label}:</span>
              <span className="font-bold text-slate-800 text-right break-all">{value}</span>
            </div>
          );
        }

        // Default bullet or text line
        return (
          <div key={idx} className="text-slate-700 font-medium py-0.5">
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}

export default function AgentChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'agent', text: "Hello! I'm Genius, your Faculty Assistant. Ask any Roll Number or Student Name to view full audit details!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Resizable Width & Height state
  const [chatWidth, setChatWidth] = useState(380);
  const [chatHeight, setChatHeight] = useState(560);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWRef = useRef(380);
  const startHRef = useRef(560);

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

  useEffect(() => {
    const handleOpen = () => openChat();
    window.addEventListener('open-agent-chat', handleOpen);
    return () => window.removeEventListener('open-agent-chat', handleOpen);
  }, []);

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

  // Handle Drag / Resize Chat Window
  const startResize = (e) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startWRef.current = chatWidth;
    startHRef.current = chatHeight;

    const onMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startXRef.current - moveEvent.clientX; // Left drag increases width
      const deltaY = startYRef.current - moveEvent.clientY; // Top drag increases height

      const newW = Math.max(320, Math.min(650, startWRef.current + deltaX));
      const newH = Math.max(420, Math.min(800, startHRef.current + deltaY));

      setChatWidth(newW);
      setChatHeight(newH);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const quickPrompts = [
    "25MCA110",
    "Today's Attendance",
    "Show active sessions",
  ];

  return (
    <>
      {/* ─── Floating Launcher Group Removed ─── */}

      {/* ─── Resizable Chat Window ─── */}
      {isOpen && (
        <div
          style={{
            width: `${chatWidth}px`,
            height: `${chatHeight}px`,
            animation: animating ? 'chatOpen 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
          }}
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-200 max-h-[90vh] max-w-[92vw]"
        >
          {/* Resize Handle (Top-Left corner drag handle) */}
          <div
            onMouseDown={startResize}
            className="absolute top-0 left-0 w-6 h-6 z-30 cursor-nwse-resize flex items-center justify-center text-slate-400 hover:text-indigo-600 bg-slate-100/80 rounded-br-lg transition-colors shadow-sm"
            title="Drag to resize chat window"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M0 10L10 0M0 5L5 0M0 0L0 0" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Ambient top glow */}
          <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between pl-7 pr-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-lg bg-white border border-slate-200 shadow-sm">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  Genius AI
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                    Resizable View
                  </span>
                </h3>
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
              ✕
            </button>
          </div>

          {/* Messages Container or Landing Screen */}
          {messages.length <= 1 && !input ? (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 bg-[#09090b] overflow-hidden text-center" onClick={() => inputRef.current?.focus()}>
              <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#09090b]/90 to-indigo-900/20 pointer-events-none" />
              <img src={aiRobotImage} alt="AI Robot" className="w-full max-w-[220px] object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-4 relative z-10" />
              <h2 className="text-xl font-medium text-slate-300 relative z-10">Hello, {user?.name?.split(' ')[0] || 'User'}!</h2>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-1 mb-8 relative z-10 leading-tight">
                How <span className="text-white">can</span><br/>
                I help <span className="text-slate-400">you?</span>
              </h1>
            </div>
          ) : (
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-1 bg-slate-100 border border-slate-200">🤖</div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm max-w-[80%]'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm w-full max-w-[95%] shadow-sm'
                  }`}
                >
                  {msg.sender === 'agent' ? (
                    <FormattedAgentMessage text={msg.text} />
                  ) : (
                    <span className="font-semibold text-sm">{msg.text}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs bg-slate-100 border border-slate-200">🤖</div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center bg-slate-50 border border-slate-200">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          )}

          {/* Quick Prompts */}
          <div className="relative z-10 px-3 pb-2 pt-2 flex gap-2 overflow-x-auto no-scrollbar bg-white border-t border-slate-50">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="relative z-10 px-3 pb-3 pt-2 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 rounded-2xl px-3 py-2 bg-slate-50 border border-slate-200"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Genius (e.g. 25MCA110 or Surender)..."
                className="flex-1 bg-transparent text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105 active:scale-95 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .siri-orb {
          background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #f43f5e, #3b82f6);
          filter: blur(2px);
          animation: siriSpin 3s linear infinite;
        }
        .siri-core {
          background: radial-gradient(circle at 40% 40%, #60a5fa 0%, #c084fc 40%, #fb7185 80%);
          animation: siriPulse 2.5s ease-in-out infinite, siriSpin 4s linear infinite reverse;
          opacity: 0.75;
        }
        @keyframes siriSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes siriPulse { 0%, 100% { transform: scale(0.85); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
      `}</style>
    </>
  );
}
