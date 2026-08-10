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
            transform: scale(0.6);
          }
          30% {
            transform: scale(1.2);
          }
          100% {
            /* Extremely large scale to fly completely through the cutout */
            transform: scale(150);
          }
        }
        
        .color-flow-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d, #833ab4, #fd1d1d, #fcb045);
          background-size: 300% 300%;
          animation: flow 6s ease infinite;
        }

        @keyframes flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .mask-container {
          position: absolute;
          inset: 0;
          background-color: white;
          color: black;
          mix-blend-mode: lighten;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        
        .marvel-mask {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          font-weight: 900;
          font-style: italic;
          letter-spacing: -0.05em;
          font-size: 28vw;
          line-height: 1;
          animation: marvel-zoom 4.5s cubic-bezier(0.5, 0, 0.1, 1) forwards;
          transform-origin: center center;
          margin: 0;
          padding: 0;
        }
      `}</style>

      {/* The vibrant color flow backdrop running continuously */}
      <div className="color-flow-bg" />

      {/* The white mask with black text. 
          Due to mix-blend-mode: lighten, the white background stays white, 
          but the black text becomes transparent and reveals the color-flow-bg! */}
      <div className="mask-container">
        <h1 className="marvel-mask select-none">
          KGiSL
        </h1>
      </div>
    </div>
  );
}
