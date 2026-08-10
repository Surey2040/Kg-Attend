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
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-1000 ease-in-out flex items-center justify-center overflow-hidden ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes marvel-zoom {
          0% {
            transform: scale(0.8) translateZ(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          60% {
            transform: scale(2.5) translateZ(0);
            opacity: 1;
          }
          100% {
            /* Zooms extremely far into the text to pass "through" a letter */
            transform: scale(80) translateZ(0);
            opacity: 0;
          }
        }
        
        .marvel-mask {
          /* Setup text clipping so video only shows inside the text */
          -webkit-text-fill-color: transparent;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-align: center;
          /* The animation drives the scale */
          animation: marvel-zoom 4s cubic-bezier(0.5, 0, 0.2, 1) forwards;
          transform-origin: center center;
          /* This background will be overridden by the video mix-blend-mode setup, but provides a fallback mask */
          background-image: linear-gradient(to bottom, #fff, #aaa);
        }
        
        /* The container setup for the mask effect */
        .video-text-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-center: center;
          background-color: black;
        }

        /* The video fills the screen */
        .intro-video {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.8;
          pointer-events: none;
        }

        /* The text acts as a cutout revealing the video underneath */
        .cutout-text {
          position: relative;
          z-index: 2;
          width: 100%;
          text-align: center;
          font-size: 25vw;
          line-height: 1;
          /* This creates the cutout effect, where the text is transparent and the background is black */
          background-color: black;
          color: white;
          mix-blend-mode: multiply;
        }

        /* Adding a vibrant background behind the video to give it that color flow look */
        .color-flow-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d);
          background-size: 400% 400%;
          animation: flow 10s ease infinite;
          z-index: 0;
        }

        @keyframes flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Color flow background behind the video */}
      <div className="color-flow-bg" />

      {/* The Video */}
      <video 
        autoPlay 
        muted 
        playsInline 
        className="intro-video"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </video>

      {/* The Text Mask that zooms in */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="marvel-mask text-white whitespace-nowrap text-[25vw] leading-none select-none drop-shadow-2xl">
          KGiSL
        </h1>
      </div>
    </div>
  );
}
