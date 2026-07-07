import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { LayoutGrid, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-10">
        <TopBar connected={true} />

        <div className="px-8 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-blue/10 border border-signal-blue/20 text-signal-blue">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Department Analytics</h2>
              <p className="text-sm text-slate-400">Class stats, presence metrics & insights</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="rounded-2xl border border-ink-border bg-ink-850/60 p-5 shadow-card">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Attendance</span>
                <TrendingUp size={18} className="text-signal-green" />
              </div>
              <p className="text-3xl font-bold text-white mt-2">84.2%</p>
              <p className="text-xs text-slate-500 mt-1">Weighted average attendance</p>
            </div>

            <div className="rounded-2xl border border-ink-border bg-ink-850/60 p-5 shadow-card">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Students</span>
                <Users size={18} className="text-signal-blue" />
              </div>
              <p className="text-3xl font-bold text-white mt-2">64</p>
              <p className="text-xs text-slate-500 mt-1">Students enrolled in database</p>
            </div>

            <div className="rounded-2xl border border-ink-border bg-ink-850/60 p-5 shadow-card">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Sessions Conducted</span>
                <Calendar size={18} className="text-signal-amber" />
              </div>
              <p className="text-3xl font-bold text-white mt-2">12</p>
              <p className="text-xs text-slate-500 mt-1">Sessions launched this week</p>
            </div>

            <div className="rounded-2xl border border-ink-border bg-ink-850/60 p-5 shadow-card">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Proxy Warnings</span>
                <BarChart3 size={18} className="text-signal-red" />
              </div>
              <p className="text-3xl font-bold text-white mt-2">0</p>
              <p className="text-xs text-slate-500 mt-1">Geo/device discrepancies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visual Attendance rate simulation */}
            <div className="lg:col-span-2 rounded-2xl border border-ink-border bg-ink-850/60 p-6 shadow-card">
              <h3 className="text-base font-bold text-white mb-6">Attendance Attendance Trends by Subject</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Java Programming</span>
                    <span className="text-signal-green">91%</span>
                  </div>
                  <div className="h-2 bg-ink-900 rounded-full overflow-hidden">
                    <div className="h-full bg-signal-green" style={{ width: '91%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Data Structures</span>
                    <span className="text-signal-green">86%</span>
                  </div>
                  <div className="h-2 bg-ink-900 rounded-full overflow-hidden">
                    <div className="h-full bg-signal-green" style={{ width: '86%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Operating Systems</span>
                    <span className="text-signal-amber">78%</span>
                  </div>
                  <div className="h-2 bg-ink-900 rounded-full overflow-hidden">
                    <div className="h-full bg-signal-amber" style={{ width: '78%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">DBMS</span>
                    <span className="text-signal-green">88%</span>
                  </div>
                  <div className="h-2 bg-ink-900 rounded-full overflow-hidden">
                    <div className="h-full bg-signal-green" style={{ width: '88%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">PHP Programming</span>
                    <span className="text-signal-red">64%</span>
                  </div>
                  <div className="h-2 bg-ink-900 rounded-full overflow-hidden">
                    <div className="h-full bg-signal-red" style={{ width: '64%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance breakdown stats */}
            <div className="rounded-2xl border border-ink-border bg-ink-850/60 p-6 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-4">Batch Distribution</h3>
                <p className="text-xs text-slate-400 mb-6">Active department batches currently configured under MCA</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm p-3 bg-ink-900/60 rounded-xl border border-ink-border/50">
                    <span className="text-slate-200 font-semibold">MCA - I Year A</span>
                    <span className="text-slate-400">22 Students</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-3 bg-ink-900/60 rounded-xl border border-ink-border/50">
                    <span className="text-slate-200 font-semibold">MCA - II Year A</span>
                    <span className="text-slate-400">24 Students</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-3 bg-ink-900/60 rounded-xl border border-ink-border/50">
                    <span className="text-slate-200 font-semibold">MCA - II Year B</span>
                    <span className="text-slate-400">18 Students</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-6 pt-4 border-t border-ink-border/50">
                Data generated directly from database entries.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
