export default function StatTile({ icon: Icon, iconTone = 'blue', title, value, subtitle }) {
  const tones = {
    blue: 'bg-signal-blue/10 text-signal-blue border-signal-blue/20',
    red: 'bg-signal-red/10 text-signal-red border-signal-red/20',
    green: 'bg-signal-green/10 text-signal-green border-signal-green/20',
  };

  return (
    <div className="rounded-2xl border border-ink-border bg-ink-850/60 shadow-card p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-400">{title}</p>
        <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[iconTone]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}
