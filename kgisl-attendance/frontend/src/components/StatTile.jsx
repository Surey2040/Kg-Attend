export default function StatTile({ icon: Icon, iconTone = 'blue', title, value, subtitle }) {
  const tones = {
    blue: 'bg-signal-blue/10 text-signal-blue border-signal-blue/20',
    red: 'bg-signal-red/10 text-signal-red border-signal-red/20',
    green: 'bg-signal-green/10 text-signal-green border-signal-green/20',
  };

  const glowColors = {
    blue: '#38BDF8', // Light Blue
    red: '#F43F5E', // Rose/Red
    green: '#2DD4BF', // Soft Teal
  };

  return (
    <div className="rounded-[1.25rem] glass-card p-5 flex flex-col relative overflow-hidden min-h-[130px]">

      
      <div className="flex justify-between items-start w-full mb-5 relative z-10">
        <div className={`flex h-9 w-9 items-center justify-center rounded-[0.6rem] border backdrop-blur-md ${tones[iconTone]}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="text-right mt-1">
          <p className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">{title}</p>
        </div>
      </div>

      <div className="mt-auto relative z-10">
        <p className="font-display font-bold text-white tracking-tight text-3xl mb-0.5">
          {value}
        </p>
        <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-500 uppercase">{subtitle}</p>
      </div>
    </div>
  );
}
