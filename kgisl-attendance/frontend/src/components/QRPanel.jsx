import { useEffect, useState } from 'react';
import { RefreshCcw, Copy, Maximize, X } from 'lucide-react';

export default function QRPanel({ qr, sessionMeta }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!qr?.expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [qr?.expiresAt, qr?.issuedAt]);

  const total = qr?.refreshIntervalSeconds ?? 60;
  const progress = Math.max(0, Math.min(100, (secondsLeft / total) * 100));
  
  let timerColor = 'text-emerald-400';
  if (secondsLeft <= 15) timerColor = 'text-rose-500';
  else if (secondsLeft <= 30) timerColor = 'text-orange-400';

  return (
    <div className="rounded-[1.25rem] glass-card p-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Scan to Mark Attendance</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(true)}
            className="flex items-center gap-1.5 rounded-md border border-ink-border bg-black/20 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-black/40 transition-colors"
          >
            <Maximize size={11} />
            Full View
          </button>
          <div className="flex items-center gap-2 rounded-md border border-ink-border bg-black/20 pl-1.5 pr-2.5 py-1">
            <div className="relative flex items-center justify-center w-5 h-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${timerColor} transition-all duration-1000 ease-linear`}
                  strokeDasharray={`${progress}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute text-[8px] font-bold ${timerColor} ${secondsLeft <= 3 ? 'animate-pulse' : ''}`}>
                {secondsLeft}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-300">Resets in</span>
          </div>
        </div>
      </div>

      <div className="scan-frame relative">
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />
        <div className="relative h-64 w-64 overflow-hidden rounded-2xl bg-white p-3">
          {qr?.qrImageDataUrl ? (
            <>
              <img src={qr.qrImageDataUrl} alt="Attendance QR" className="h-full w-full object-contain" />
              {/* Center Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-1.5 rounded-xl shadow-lg border border-slate-100 flex items-center justify-center">
                  <img src="/qr-center-logo.jpg" alt="Center Logo" className="h-12 w-12 object-contain" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Waiting for session…
            </div>
          )}
          <div
            className="sweep animate-scanline"
            style={{ animationDuration: `${total}s` }}
          />
        </div>
      </div>

      <p className="mt-5 text-xs text-slate-500">Show this QR to students for scanning</p>

      <div className="mt-6 grid w-full grid-cols-3 gap-4 border-t border-ink-border pt-5 text-center">
        <div>
          <p className="text-[10px] text-slate-500 uppercase">Session ID</p>
          <div className="mt-1 flex items-center justify-center gap-1 font-mono text-xs text-slate-300">
            <span className="truncate max-w-[90px]">{sessionMeta?.sessionId ?? '—'}</span>
            {sessionMeta?.sessionId && (
              <button onClick={() => navigator.clipboard.writeText(sessionMeta.sessionId)}>
                <Copy size={11} className="text-slate-500 hover:text-slate-300" />
              </button>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase">Started By</p>
          <p className="mt-1 text-xs text-slate-300">{sessionMeta?.startedBy ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase">Started At</p>
          <p className="mt-1 text-xs text-slate-300">{sessionMeta?.startedAt ?? '—'}</p>
        </div>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="text-center mb-10 mt-8">
            <h2 className="text-3xl font-bold text-white tracking-wide">Scan to Mark Attendance</h2>
            <div className="mt-4 flex items-center justify-center gap-3 text-base font-medium text-slate-200 bg-white/10 px-5 py-2.5 rounded-full mx-auto w-fit shadow-inner">
              <div className="relative flex items-center justify-center w-7 h-7">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${timerColor} transition-all duration-1000 ease-linear`}
                    strokeDasharray={`${progress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className={`absolute text-[10px] font-bold ${timerColor} ${secondsLeft <= 3 ? 'animate-pulse' : ''}`}>
                  {secondsLeft}
                </span>
              </div>
              <span className="tracking-wide">Refreshes in {secondsLeft}s</span>
            </div>
          </div>

          <div className="scan-frame relative p-4 mb-8">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            <div className="relative h-[45vh] w-[45vh] max-h-[500px] max-w-[500px] min-h-[300px] min-w-[300px] overflow-hidden rounded-[2rem] bg-white p-5 shadow-2xl">
              {qr?.qrImageDataUrl ? (
                <>
                  <img src={qr.qrImageDataUrl} alt="Attendance QR" className="h-full w-full object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center">
                      <img src="/qr-center-logo.jpg" alt="Center Logo" className="h-16 w-16 object-contain" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg text-slate-400 font-medium">
                  Waiting for session…
                </div>
              )}
              <div
                className="sweep animate-scanline"
                style={{ animationDuration: `${total}s` }}
              />
            </div>
          </div>
          
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold">Session ID</p>
            <div className="flex items-center gap-3 font-mono text-3xl font-bold text-white tracking-wider bg-white/5 px-8 py-4 rounded-2xl border border-white/10 shadow-lg">
              {sessionMeta?.sessionId ?? '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
