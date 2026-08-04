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

    // Fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Unmount splash screen after 2.4 seconds
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b] text-white transition-opacity duration-500 ease-in-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_50%,rgba(99,102,241,0.2),transparent)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-sm px-6 text-center">
        {/* Glowing KGiSL Logo in Center */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-3xl opacity-40 animate-pulse" />
          <img
            src="/kgisl-logo-transparent.png"
            alt="KGiSL Logo"
            className="relative h-24 sm:h-28 w-auto object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]"
          />
        </motion.div>

        {/* Minimalist Progress Bar */}
        <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
