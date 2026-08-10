import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 2-Second Smooth Progress Animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 80);

    // Fade out after 4.5 seconds (matches the 4s animation + buffer)
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 4500);

    // Unmount splash screen after 5 seconds
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#302C75] transition-opacity duration-1000 ease-in-out flex items-center justify-center overflow-hidden ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes blink-zoom {
          0% { opacity: 0; transform: scale(0.5); }
          5% { opacity: 1; transform: scale(0.6); }
          10% { opacity: 0; transform: scale(0.7); }
          15% { opacity: 1; transform: scale(0.8); }
          20% { opacity: 0; transform: scale(0.9); }
          25% { opacity: 1; transform: scale(1.0); }
          80% { opacity: 1; transform: scale(1.3); } /* Light zoom */
          100% { opacity: 0; transform: scale(1.4); }
        }
        
        .marvel-logo {
          width: 50vw;
          max-width: 600px;
          animation: blink-zoom 4.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform-origin: center center;
        }
      `}</style>

      {/* New KGiSL logo blinking and lightly zooming from small on a #302C75 background */}
      <img 
        src="/kgisl-final-logo.png" 
        alt="KGiSL Logo" 
        className="marvel-logo" 
      />
    </div>
  );
}
