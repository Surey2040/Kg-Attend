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
        className="h-screen w-screen overflow-hidden flex items-center justify-center relative text-white bg-black"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <EtheralShadow
            color="rgba(20, 30, 70, 1)"
            animation={{ scale: 100, speed: 90 }}
            noise={{ opacity: 1, scale: 1.2 }}
            sizing="fill"
          />
        </div>
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
      className="relative min-h-screen overflow-y-auto overflow-x-hidden flex font-sans text-white bg-black"
    >
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
        <div className="flex flex-col items-center justify-center pb-12 lg:pb-20 select-none w-full lg:w-auto mt-4 lg:mt-0">

          <div className="flex flex-col items-start">
            {/* Row 1: We Teach */}
            <div className="flex flex-row items-baseline">
              <span 
                style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1" }} 
                className="text-[100px] sm:text-[130px] lg:text-[180px] italic font-bold pr-4 shimmer-text"
              >
                We
              </span>
              <span 
                style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1" }} 
                className="text-[60px] sm:text-[80px] lg:text-[110px] italic font-bold shimmer-text"
              >
                Teach
              </span>
            </div>

            {/* Row 2: We Kreate */}
            <div className="flex flex-row items-baseline -mt-4 lg:-mt-8">
              <span 
                style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1" }} 
                className="text-[100px] sm:text-[130px] lg:text-[180px] italic font-bold pr-4 shimmer-text"
              >
                We
              </span>
              <span 
                style={{ fontFamily: "'Playfair Display', serif", lineHeight: "1" }} 
                className="text-[60px] sm:text-[80px] lg:text-[110px] italic font-bold shimmer-text"
              >
                Kreate
              </span>
            </div>

            <p className="text-[14px] text-slate-300 font-medium leading-relaxed max-w-[550px] text-justify px-1 lg:px-0 opacity-90 mt-4">
              KGiSL Institute of Information Management (KGiSL-IIM) is a premier industry-sponsored institution in Coimbatore. Affiliated with Bharathiar University and AICTE approved, we follow an industry-integrated model.
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

