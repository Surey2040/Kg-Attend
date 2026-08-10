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
      className={`fixed inset-0 z-[9999] bg-white transition-opacity duration-1000 ease-in-out flex items-center justify-center overflow-hidden ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes marvel-zoom {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            /* Extremely large scale to fly completely through the logo */
            transform: scale(100);
            opacity: 0;
          }
        }
        
        .marvel-logo {
          width: 50vw;
          max-width: 600px;
          animation: marvel-zoom 4.5s cubic-bezier(0.6, 0.05, 0.15, 0.95) forwards;
          transform-origin: center center;
        }
      `}</style>

      {/* Exact KGiSL logo image zooming in on a clean white background */}
      <img 
        src="/kgisl-logo-transparent.png" 
        alt="KGiSL Logo" 
        className="marvel-logo" 
      />
    </div>
  );
}
