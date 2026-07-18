import React from 'react';
import AgentLogoImg from '../assets/agent-logo.png';
import { hapticLight } from '../utils/haptics.js';

const AIAgentButton = () => {
  return (
    <button 
      onClick={() => {
        if (typeof hapticLight === 'function') hapticLight();
        console.log("Agent Clicked!");
      }}
      className="fixed bottom-24 md:bottom-10 right-4 md:right-10 z-[100] group cursor-pointer"
    >
      <div className="relative flex items-center justify-center">
        {/* Glowing backdrop */}
        <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 blur-xl group-hover:opacity-60 transition-opacity duration-500"></div>
        
        {/* Rotating Image */}
        <img 
          src={AgentLogoImg} 
          alt="AI Agent" 
          className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shadow-2xl agent-logo-animated border-2 border-white/10"
        />
      </div>
    </button>
  );
};

export default AIAgentButton;
