import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('blink'); // 'blink' | 'hold' | 'zoom-out'

  useEffect(() => {
    // Phase 1: Blink for 1.2 seconds
    const holdTimer = setTimeout(() => setPhase('hold'), 1200);

    // Phase 2: Hold for 1.5 seconds, then zoom out
    const zoomTimer = setTimeout(() => setPhase('zoom-out'), 2700);

    // Phase 3: After zoom animation, complete
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(zoomTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        phase === 'zoom-out' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#302C75' }}
    >
      <style>{`
        /* Phase 1: Blinking flicker entrance */
        @keyframes flicker-in {
          0%   { opacity: 0; transform: scale(0.82); }
          8%   { opacity: 1; transform: scale(0.84); }
          16%  { opacity: 0; transform: scale(0.86); }
          24%  { opacity: 1; transform: scale(0.88); }
          32%  { opacity: 0; transform: scale(0.90); }
          40%  { opacity: 1; transform: scale(0.92); }
          50%  { opacity: 0; transform: scale(0.94); }
          60%  { opacity: 1; transform: scale(0.96); }
          75%  { opacity: 1; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1.0); }
        }

        /* Phase 2: Steady hold */
        @keyframes hold-steady {
          0%   { opacity: 1; transform: scale(1.0); }
          100% { opacity: 1; transform: scale(1.0); }
        }

        /* Phase 3: Smooth light zoom out with fade */
        @keyframes zoom-exit {
          0%   { opacity: 1; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(1.35); }
        }

        /* Subtle glow pulse on the logo during hold */
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(255,255,255,0.15)); }
          50%       { filter: drop-shadow(0 0 20px rgba(255,255,255,0.35)); }
        }

        .logo-blink {
          animation: flicker-in 1.2s ease-out forwards;
          transform-origin: center center;
          width: 52vw;
          max-width: 620px;
        }

        .logo-hold {
          animation: hold-steady 1.5s linear forwards, glow-pulse 1.5s ease-in-out infinite;
          transform-origin: center center;
          width: 52vw;
          max-width: 620px;
        }

        .logo-exit {
          animation: zoom-exit 0.8s cubic-bezier(0.4, 0, 1, 1) forwards;
          transform-origin: center center;
          width: 52vw;
          max-width: 620px;
        }

        /* Subtle radial vignette on the bg */
        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%);
          pointer-events: none;
        }
      `}</style>

      {/* Vignette overlay for cinematic depth */}
      <div className="vignette" />

      {/* KGiSL-IIM Logo — exact image, no color changes */}
      <img
        src="/kgisl-final-logo.png"
        alt="KGiSL-IIM Logo"
        className={
          phase === 'blink'    ? 'logo-blink' :
          phase === 'hold'     ? 'logo-hold'  :
                                 'logo-exit'
        }
      />
    </div>
  );
}
