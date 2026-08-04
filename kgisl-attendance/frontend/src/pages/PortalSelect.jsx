import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLogin from './AdminLogin.jsx';
import StudentLogin from './StudentLogin.jsx';

export default function PortalSelect() {
  const [isStudent, setIsStudent] = useState(true);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto flex font-sans text-white bg-[#09090b]">
      {/* Background stars pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
                            radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0))`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Subtle ambient glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-75"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 60%)',
        }}
      />

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .shimmer-text {
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Top Left Corner KGiSL Logo */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-12 z-30">
        <img src="/kgisl-logo-transparent.png" alt="KGiSL" className="h-10 sm:h-14 lg:h-16 w-auto object-contain drop-shadow-md" />
      </div>

      <div className="w-full min-h-screen max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between relative z-20 px-4 sm:px-8 lg:px-20 py-16 lg:py-12">
        
        {/* KGiSL Branding Section */}
        <div className="flex flex-col items-center lg:items-start justify-center pb-6 lg:pb-0 select-none w-full lg:w-1/2 mt-8 lg:mt-0">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center lg:items-start w-full text-center lg:text-left"
          >
            {/* PresenceIQ Title + Pulsing Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap mb-2">
              <h1 
                style={{ fontFamily: "'Playfair Display', serif" }} 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white shimmer-text"
              >
                PresenceIQ
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-400 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                Engine v2.4
              </span>
            </div>

            {/* 3. Iconic KGiSL WE TEACH KREATE Typography */}
            <div 
              style={{ fontFamily: "'Outfit', 'Syne', sans-serif" }}
              className="mt-4 mb-5 flex items-center justify-center lg:justify-start gap-4 select-none"
            >
              <span className="text-7xl sm:text-9xl lg:text-[11rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 leading-none drop-shadow-2xl">
                WE
              </span>
              <div className="flex flex-col text-left justify-center leading-none space-y-1.5">
                <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 uppercase">
                  TEACH
                </span>
                <span className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 uppercase">
                  KREATE
                </span>
              </div>
            </div>

            {/* 4. Description below */}
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-[480px] mt-2 opacity-90 text-center lg:text-left">
              KGiSL Institute of Information Management (KGiSL-IIM). Anti-proxy cryptographic verification with sub-second WebSocket telemetry.
            </p>
          </motion.div>
        </div>

        {/* Auth Box Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-[28px] p-4 sm:p-6 shadow-2xl my-auto"
        >
          <div className="w-full flex flex-col items-center">

            {/* Portal Switcher Tab - Available & Touch-friendly on ALL screens including mobile */}
            <div className="flex justify-center items-center mb-6 gap-1.5 text-xs font-bold tracking-wider uppercase bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/10 w-full max-w-[320px] shadow-inner">
              <button 
                onClick={() => setIsStudent(true)}
                className={`flex-1 py-2.5 rounded-full transition-all duration-300 text-center ${isStudent ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}
              >
                Student Portal
              </button>
              <button 
                onClick={() => setIsStudent(false)}
                className={`flex-1 py-2.5 rounded-full transition-all duration-300 text-center ${!isStudent ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}
              >
                Admin / Faculty
              </button>
            </div>

            <div className="relative w-full flex-1 perspective-1000 min-h-[380px]">
              <div className={`w-full h-full transition-transform duration-700 ease-in-out preserve-3d grid ${isStudent ? '' : 'rotate-y-180'}`}>
                
                {/* Student Login Form */}
                <div className={`row-start-1 col-start-1 w-full h-full backface-hidden flex justify-center ${!isStudent ? 'pointer-events-none' : ''}`}>
                  <div className="w-full">
                    <StudentLogin />
                  </div>
                </div>

                {/* Admin / Faculty Login Form */}
                <div className={`row-start-1 col-start-1 w-full h-full backface-hidden rotate-y-180 flex justify-center ${isStudent ? 'pointer-events-none' : ''}`}>
                  <div className="w-full">
                    <AdminLogin />
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </motion.div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-3 left-0 w-full text-center text-[11px] font-medium text-slate-500 pointer-events-none z-10">
        © {new Date().getFullYear()} KGiSL IIM. All rights reserved.
      </div>
    </div>
  );
}
