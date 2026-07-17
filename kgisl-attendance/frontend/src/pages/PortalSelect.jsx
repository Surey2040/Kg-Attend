import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <div
        className="h-screen w-screen overflow-hidden flex items-center justify-center relative text-[#272465]"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{
            backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '20px 30px',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)'
          }} 
        />
        <style>{`
          @keyframes cinematicReveal {
            0% { opacity: 0; transform: scale(0.01); filter: blur(40px) brightness(0) drop-shadow(0 0 0px rgba(255, 255, 255, 0)); }
            12% { opacity: 1; transform: scale(1.1); filter: blur(0px) brightness(3) drop-shadow(0 0 150px rgba(255, 255, 255, 1)); }
            100% { opacity: 0; transform: scale(2.5); filter: blur(0px) brightness(1.1) drop-shadow(0 0 30px rgba(150, 200, 255, 0.6)); }
          }
          .cinematic-logo {
            animation: cinematicReveal 5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            will-change: transform, filter, opacity;
          }
        `}</style>
        <img src="/img_4748_logo.png" alt="Loading..." className="cinematic-logo h-[150px] md:h-[250px] object-contain z-10" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex font-sans text-[#272465]"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '20px 30px',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)'
        }} 
      />

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      <div className="w-full h-full min-h-screen max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between relative z-20 px-4 lg:px-24 py-8">
        
        {/* Left Side Branding */}
        <div className="hidden lg:flex flex-row items-center justify-start pb-20 select-none lg:-ml-8 max-w-[900px] gap-16">
          
          {/* Animated Vertical Boxes */}
          <RandomImageStack />

          <div className="flex flex-col items-center">
            <div className="flex flex-row items-center mb-8">
              <span 
                style={{ fontFamily: "'Playfair Display', serif", fontSize: "220px", lineHeight: "0.75" }} 
                className="italic font-bold text-slate-800 pr-6 drop-shadow-sm"
              >
                We
              </span>
              <div className="flex flex-col justify-between" style={{ height: '165px', paddingTop: '5px', paddingBottom: '5px' }}>
                <span 
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "70px", lineHeight: "0.8" }} 
                  className="italic font-bold text-slate-500 tracking-wide"
                >
                  Teach
                </span>
                <span 
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "100px", lineHeight: "0.8" }} 
                  className="italic font-bold text-slate-900 drop-shadow-md tracking-tight"
                >
                  Kreate
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[500px] text-center">
              KGiSL Institute of Information Management (KGiSL-IIM) is a premier industry-sponsored institution in Coimbatore. Affiliated with Bharathiar University and AICTE approved, we follow an industry-integrated education model that provides strong practical exposure alongside academic learning.
            </p>
          </div>
        </div>

        <div className="w-full max-w-[400px] relative bg-transparent backdrop-blur-xl border border-white/20 rounded-[32px] overflow-hidden flex flex-col items-center shadow-md">
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
          </div>
        </div>

      <div className="absolute bottom-4 left-4 md:left-8 text-[10px] font-medium text-slate-400 pointer-events-none z-0">
        © {new Date().getFullYear()} KGiSL IIM. All rights reserved.
      </div>
    </div>
  );
}

function RandomImageStack() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Change images every 3.5 seconds
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Using actual project images from public/campus/ folder
  const images = [
    '/campus/c1.jpg',
    '/campus/c2.jpg',
    '/campus/c3.jpg',
    '/campus/c4.jpg',
  ];

  // Calculate standard indices
  const currentIndices = [
    (tick + 0) % images.length,
    (tick + 2) % images.length, // Staggered to feel more random
    (tick + 4) % images.length,
    (tick + 1) % images.length,
  ];

  return (
    <div className="flex flex-col gap-4 justify-center">
      {currentIndices.map((activeIndex, boxIndex) => (
        <div 
          key={boxIndex} 
          className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-slate-200/60 relative group"
        >
          {/* Subtle overlay to blend with the aesthetic */}
          <div className="absolute inset-0 bg-[#272465]/10 group-hover:bg-transparent transition-colors duration-500 z-20 pointer-events-none"></div>
          
          {images.map((imgSrc, imgIndex) => (
            <img 
              key={imgIndex} 
              src={imgSrc} 
              alt="Campus life" 
              className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ease-in-out ${
                imgIndex === activeIndex ? 'opacity-80 group-hover:opacity-100 z-10' : 'opacity-0 z-0'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
