import { Grid3x3, Wifi, MapPin, Clock, ShieldCheck } from 'lucide-react';

const ITEMS = [
  { icon: Grid3x3, label: 'QR Code', value: 'Valid' },
  { icon: Wifi, label: 'Network', value: 'Verified' },
  { icon: MapPin, label: 'Location', value: 'Verified' },
  { icon: Clock, label: 'Time Window', value: 'Valid' },
  { icon: ShieldCheck, label: 'Duplicate Check', value: 'Passed' },
];

export default function ValidationStrip() {
  return (
    <div className="mx-8 rounded-2xl bg-ink-900/40 border border-ink-border/50 p-6 relative overflow-hidden backdrop-blur-md">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-signal-green/5 blur-3xl pointer-events-none" />
      
      <p className="mb-6 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Live Validation Pipeline</p>
      
      <div className="flex items-center justify-between w-full relative z-10">
        {ITEMS.map(({ icon: Icon, label, value }, idx) => (
          <div key={label} className="flex flex-col items-center flex-1 relative group cursor-default">
            
            {/* Connecting Line (except for last item) */}
            {idx !== ITEMS.length - 1 && (
              <div className="absolute top-6 left-[60%] w-[80%] h-[2px] bg-ink-border overflow-hidden">
                <div className="h-full bg-signal-green/40 w-full animate-pulseRing" style={{ animationDelay: `${idx * 0.2}s` }} />
              </div>
            )}

            {/* Icon Node */}
            <div className="relative mb-3">
              {/* Outer glowing ring */}
              <div className="absolute inset-0 rounded-full bg-signal-green/20 blur-md scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="h-12 w-12 rounded-full border border-signal-green/30 bg-signal-green/10 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(47,217,122,0.15)] group-hover:scale-110 transition-transform duration-300">
                <Icon size={20} className="text-signal-green drop-shadow-md" strokeWidth={2.5} />
              </div>
            </div>

            {/* Labels */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1 group-hover:text-slate-300 transition-colors">{label}</p>
              <p className="font-display text-xs font-bold text-signal-green drop-shadow-sm">{value}</p>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
