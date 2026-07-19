import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLogin from './AdminLogin.jsx';
import StudentLogin from './StudentLogin.jsx';
import { EtheralShadow } from '../components/ui/EtheralShadow.jsx';

export default function PortalSelect() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem('hasSeenLoadingScreen');
  });
  const [isStudent, setIsStudent] = useState(true);

  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('hasSeenLoadingScreen', 'true');
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen overflow-hidden flex items-center justify-center relative text-white bg-black">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <EtheralShadow
            color="rgba(20, 30, 70, 1)"
            animation={{ scale: 100, speed: 90 }}
            noise={{ opacity: 1, scale: 1.2 }}
            sizing="fill"
          />
        </div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@1,900&display=swap');
          
          /* Cinematic Light Sweep / Flare Effect */
          @keyframes lightSweep {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .ae-shimmer {
            background: linear-gradient(
              120deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.1) 40%,
              rgba(255, 255, 255, 0.8) 50%,
              rgba(255, 255, 255, 0.1) 60%,
              rgba(255, 255, 255, 0) 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            animation: lightSweep 3s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
          }
        `}</style>
        
        {/* Premiere Pro / After Effects Style Cinematic Scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(30px) brightness(0.5)" }}
          animate={{ opacity: 1, scale: 1.05, filter: "blur(0px) brightness(1.2)" }}
          exit={{ opacity: 0, scale: 1.2, filter: "blur(20px) brightness(0)" }}
          transition={{ 
            duration: 4, 
            ease: [0.16, 1, 0.3, 1], /* Advanced AE-like Expo Ease Out */
          }}
          className="z-10 flex flex-col items-center justify-center relative"
        >
          {/* Deep Cinematic Glow Background behind text */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.3, 0.6, 0.5] }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute w-[150%] h-[150%] bg-[#E31E24]/10 blur-[100px] rounded-full pointer-events-none -z-10"
          />

          <motion.div 
            initial={{ letterSpacing: "-0.2em" }}
            animate={{ letterSpacing: "-0.02em" }}
            transition={{ duration: 4.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 relative">
              
              <h1 
                style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", transform: "skewX(-15deg)" }}
                className="text-6xl md:text-7xl lg:text-[10rem] font-black italic flex items-baseline drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] leading-none ae-shimmer"
              >
                <span className="text-white tracking-tighter">KG</span>
                <span className="text-[#E31E24] drop-shadow-[0_0_30px_rgba(227,30,36,1)] px-[0.05em] relative" style={{ fontSize: "0.95em" }}>
                  i
                  {/* Subtle red optical flare on the 'i' */}
                  <motion.span 
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full blur-[4px] mix-blend-overlay"
                  />
                </span>
                <span className="text-white tracking-tighter">SL</span>
                <span className="text-white ml-2 md:ml-4 tracking-tighter">-IIM</span>
              </h1>
              
              {/* Cinematic SVG Logo Mark Reveal (Created in Code) */}
              <motion.div className="relative w-20 h-20 md:w-32 md:h-32 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[#E31E24]/20 blur-[30px] rounded-full scale-150 -z-10 mix-blend-screen"
                />
                
                <motion.svg 
                  viewBox="0 0 120 120" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <g transform="translate(0, 10)">
                    {/* Top White Book Page */}
                    <motion.path 
                      d="M 20,20 Q 50,-5 85,25 L 65,40 Q 40,20 20,35 Z" 
                      fill="white"
                      style={{ originX: "20px" }}
                      initial={{ opacity: 0, rotateY: -90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                      className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                    />
                    
                    {/* Middle Red Book Page (Main Ribbon) */}
                    <motion.path 
                      d="M 20,35 Q 65,10 105,55 L 85,75 Q 50,40 20,60 Z" 
                      fill="#E31E24"
                      style={{ originX: "20px" }}
                      initial={{ opacity: 0, rotateY: -90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                      className="drop-shadow-[0_6px_12px_rgba(227,30,36,0.5)]"
                    />
                    
                    {/* Bottom White Book Page Slice */}
                    <motion.path 
                      d="M 20,60 Q 55,45 90,80 L 75,95 Q 45,70 20,80 Z" 
                      fill="white"
                      style={{ originX: "20px" }}
                      initial={{ opacity: 0, rotateY: -90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
                      className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                    />
                  </g>
                </motion.svg>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ width: "0%", opacity: 0, filter: "blur(5px)" }}
              animate={{ width: "120%", opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 1, duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[2px] bg-gradient-to-r from-transparent via-[#E31E24] to-transparent mt-8 mb-6 overflow-hidden"
            >
               {/* Saber plugin like laser effect */}
               <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute inset-0 w-1/3 bg-white blur-[2px]"
               />
            </motion.div>

            
            <motion.p 
              initial={{ opacity: 0, y: 20, filter: "blur(10px)", letterSpacing: "0.2em" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "0.5em" }}
              transition={{ delay: 1.5, duration: 2, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-xs md:text-sm text-white/90 uppercase font-bold text-center"
            >
              Institute of Information Management
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden flex font-sans text-white bg-black">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <EtheralShadow
          color="rgba(20, 30, 70, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="w-full min-h-screen max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-start lg:justify-between relative z-20 px-4 lg:px-24 py-12 lg:py-8 pb-32 lg:pb-8">
        
        {/* Branding Area */}
        <div className="flex flex-col items-center justify-center pb-8 lg:pb-20 select-none w-full lg:w-auto mt-2 lg:mt-0">

          <motion.div 
            initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="flex flex-col items-center w-full"
          >
            {/* Original layout: big We + stacked Teach/Kreate — vw-based so it always fits */}
            <div className="flex flex-row items-center justify-center w-full">
              <span 
                style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1.1", fontSize: 'clamp(80px, 28vw, 240px)', paddingBottom: '0.15em', paddingRight: '0.05em' }} 
                className="inline-block italic font-bold pr-[2vw] lg:pr-5 shimmer-text flex-shrink-0"
              >
                We
              </span>
              <div className="flex flex-col justify-center">
                <span 
                  style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1", fontSize: 'clamp(26px, 8.5vw, 80px)', paddingBottom: '0.1em', paddingRight: '0.1em' }} 
                  className="inline-block italic font-bold tracking-wide shimmer-text"
                >
                  Teach
                </span>
                <span 
                  style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1", fontSize: 'clamp(38px, 12.5vw, 110px)', paddingBottom: '0.15em', paddingRight: '0.1em' }} 
                  className="inline-block italic font-bold drop-shadow-md tracking-tight shimmer-text -mt-[2vw] lg:-mt-4"
                >
                  Kreate
                </span>
              </div>
            </div>

            <p 
              className="text-[13px] md:text-[14px] text-slate-300 font-medium leading-relaxed w-full max-w-[520px] text-center md:text-justify opacity-90 -mt-4 lg:-mt-8"
              style={{ textAlignLast: 'center' }}
            >
              KGiSL Institute of Information Management (KGiSL-IIM) is a premier industry-sponsored institution in Coimbatore. Affiliated with Bharathiar University and AICTE approved, we provide industry-integrated education.
            </p>

            {/* Social Media Icons */}
            <div className="flex flex-row items-center justify-center gap-5 mt-4 lg:mt-6 w-full">
              <a href="https://www.facebook.com/kgisliim" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors duration-200" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.733 0 1.326-.592 1.326-1.326V1.326C24 .593 23.408 0 22.675 0z"/></svg>
              </a>
              <a href="https://twitter.com/kgisliim" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors duration-200" aria-label="X">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.instagram.com/kgisliim" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-400 transition-colors duration-200" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.youtube.com/@kgisliim" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-500 transition-colors duration-200" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://www.linkedin.com/school/kgisliim" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors duration-200" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="w-full max-w-[400px] relative bg-transparent backdrop-blur-xl border border-white/20 rounded-[32px] overflow-hidden flex flex-col items-center shadow-md"
        >
            <div className="absolute inset-0 z-0 pointer-events-none">
              <EtheralShadow
                color="rgba(20, 30, 70, 1)"
                animation={{ scale: 100, speed: 90 }}
                noise={{ opacity: 1, scale: 1.2 }}
                sizing="fill"
              />
            </div>
            {/* Dark overlay for readability matching App.jsx */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-black/20"></div>
            
            <div className="w-full flex flex-col items-center pt-8 pb-0 relative z-10">

              <div className="flex justify-center items-center mb-6 gap-2 text-xs font-bold tracking-widest uppercase bg-black/40 backdrop-blur-md shadow-inner p-1.5 rounded-full border border-white/10 w-full max-w-[280px]">
                <button 
                  onClick={() => setIsStudent(true)}
                  className={`flex-1 py-2.5 rounded-full transition-all duration-300 ${isStudent ? 'bg-signal-blue text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                  Student
                </button>
                <button 
                  onClick={() => setIsStudent(false)}
                  className={`flex-1 py-2.5 rounded-full transition-all duration-300 ${!isStudent ? 'bg-signal-blue text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                  Admin
                </button>
              </div>

              <div className="relative w-full flex-1 perspective-1000">
                <div className={`w-full h-full transition-transform duration-700 ease-in-out preserve-3d grid ${isStudent ? '' : 'rotate-y-180'}`}>
                  
                  <div className={`row-start-1 col-start-1 w-full h-full backface-hidden flex justify-center ${!isStudent ? 'pointer-events-none' : ''}`}>
                    <div className="w-full max-w-[320px]">
                      <StudentLogin />
                    </div>
                  </div>

                  <div className={`row-start-1 col-start-1 w-full h-full backface-hidden rotate-y-180 flex justify-center ${isStudent ? 'pointer-events-none' : ''}`}>
                    <div className="w-full max-w-[320px]">
                      <AdminLogin />
                    </div>
                  </div>

                </div>
              </div>
              
            </div>
        </motion.div>

        <div className="hidden md:block absolute bottom-4 left-4 md:left-8 text-[10px] font-medium text-slate-400 pointer-events-none z-0">
          © {new Date().getFullYear()} KGiSL IIM. All rights reserved.
        </div>
    </div>
    </div>
  );
}

