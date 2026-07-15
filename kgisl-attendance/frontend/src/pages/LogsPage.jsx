import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { FileClock, Terminal } from 'lucide-react';

const MOCK_LOGS = [
  { time: '17:55:36', type: 'INFO', msg: '[redis] connected successfully' },
  { time: '17:55:37', type: 'INFO', msg: 'KGiSL-IIM Attendance server listening on port 4000' },
  { time: '17:56:04', type: 'AUDIT', msg: 'Faculty Login Success: ravi.kumar@kgisl-iim.ac.in' },
  { time: '17:56:45', type: 'INFO', msg: 'Active attendance session started: session_id = 9e28f72a' },
  { time: '17:56:55', type: 'INFO', msg: 'Generated secure dynamic QR code hash token: a281c7f9' },
  { time: '17:57:02', type: 'AUDIT', msg: 'Attendance Marked: Student MCA24001 present (GPS verification: PASS)' },
  { time: '17:57:08', type: 'AUDIT', msg: 'Attendance Marked: Student MCA24002 present (GPS verification: PASS)' },
  { time: '17:57:15', type: 'WARN', msg: 'Duplicate scan blocked for Student MCA24001 (already registered)' },
  { time: '17:57:42', type: 'AUDIT', msg: 'Attendance Marked: Student MCA24003 present (GPS verification: PASS)' },
  { time: '17:58:10', type: 'INFO', msg: 'Secure QR Code token rotated (hash: c129a0df)' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Simulated live log append
    setLogs(MOCK_LOGS);
    const interval = setInterval(() => {
      const now = new Date().toTimeString().split(' ')[0];
      const types = ['INFO', 'AUDIT', 'WARN'];
      const messages = [
        'Prisma Query executed: SELECT 1 FROM "public"."attendance_session"',
        'Token generation heartbeat status: OK',
        'Redis session state TTL check complete',
        'Client socket heartbeats verified: 4 clients active',
      ];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs((prev) => [...prev, { time: now, type: randomType, msg: randomMsg }].slice(-15));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full">
        <TopBar connected={true} />

        <div className="px-8 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-ink-border text-slate-300">
              <FileClock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Activity Logs</h2>
              <p className="text-sm text-slate-400">Live operational log trace stream</p>
            </div>
          </div>

          {/* Log terminal */}
          <div className="rounded-2xl glass-card p-5 font-mono text-xs bg-[#050811]/50">
            <div className="flex items-center justify-between border-b border-ink-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal size={14} />
                <span>Console Stream</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-signal-green">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-green status-dot" />
                Live Log
              </span>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto leading-relaxed">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="text-slate-500 font-mono select-none">{log.time}</span>
                  <span
                    className={`font-semibold ${
                      log.type === 'WARN'
                        ? 'text-signal-amber'
                        : log.type === 'AUDIT'
                        ? 'text-signal-blue'
                        : 'text-slate-400'
                    }`}
                  >
                    [{log.type}]
                  </span>
                  <span className="text-slate-300 font-mono">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
