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
        
        .hyperspace-bg {
          position: absolute;
          inset: 0;
          background-color: black;
          overflow: hidden;
        }

        @keyframes streakZoom {
          0% {
            transform: translateY(0px) scaleY(0.1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(1500px) scaleY(3);
            opacity: 0;
          }
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
          width: 60vw;
          height: 25vw;
          background-color: black;
          
          /* Masking the black div to the exact shape of the KGiSL logo image */
          -webkit-mask-image: url('/kgisl-logo-transparent.png');
          -webkit-mask-size: contain;
          -webkit-mask-position: center;
          -webkit-mask-repeat: no-repeat;
          mask-image: url('/kgisl-logo-transparent.png');
          mask-size: contain;
          mask-position: center;
          mask-repeat: no-repeat;
          
          animation: marvel-zoom 4.5s cubic-bezier(0.5, 0, 0.1, 1) forwards;
          transform-origin: center center;
          margin: 0;
          padding: 0;
        }
      `}</style>

      {/* The time travel hyperspace background running continuously */}
      <div className="hyperspace-bg">
        {/* Dark radial center to give it depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,black_80%)] z-10" />
        
        {/* Light streaks zooming towards the camera */}
        {Array.from({ length: 60 }).map((_, i) => {
          // Pre-calculate random values for each streak to avoid React hydration mismatches 
          // (though it doesn't matter much for a client-side splash, it's good practice)
          const angle = Math.random() * 360;
          const delay = Math.random() * 2;
          const duration = 0.5 + Math.random() * 1.5;
          const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#38bdf8'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{
                transform: `rotate(${angle}deg)`,
                zIndex: 1
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '2px',
                  height: '100px',
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
                  animation: `streakZoom ${duration}s ease-in ${delay}s infinite`,
                  opacity: 0,
                  top: '40px' // Start a little away from the center to form a "tunnel"
                }}
              />
            </div>
          );
        })}
      </div>

      {/* The white mask with black logo. 
          Due to mix-blend-mode: lighten, the white background stays white, 
          but the black logo cutout becomes transparent and reveals the hyperspace-bg! */}
      <div className="mask-container">
        <div className="marvel-mask" />
      </div>
    </div>
  );
}
