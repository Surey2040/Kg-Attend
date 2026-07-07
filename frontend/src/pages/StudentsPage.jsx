import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { listStudents } from '../services/api.js';
import { Search, GraduationCap } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await listStudents();
        setStudents(data);
      } catch (err) {
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />

      <main className="flex-1 min-w-0 pb-10">
        <TopBar connected={true} />

        <div className="px-8 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-red/10 border border-signal-red/20 text-signal-red">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Student Directory</h2>
                <p className="text-sm text-slate-400">Total Registered: {students.length}</p>
              </div>
            </div>

            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full pl-10 pr-4 py-2 bg-ink-900 border border-ink-border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-signal-red transition"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-2.5 text-xs text-red-300 mb-6">
              {error}
            </p>
          )}

          <div className="rounded-2xl border border-ink-border bg-ink-850/60 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-border bg-ink-900/40 text-slate-400 font-semibold">
                    <th className="px-6 py-4">Roll Number</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Batch</th>
                    <th className="px-6 py-4">Attended / Total</th>
                    <th className="px-6 py-4">Attendance %</th>
                    <th className="px-6 py-4">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Loading students data...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-ink-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-300 font-semibold">{s.rollNo}</td>
                        <td className="px-6 py-4 text-white font-medium">{s.name}</td>
                        <td className="px-6 py-4 text-slate-400">{s.batchName}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {s.attendedSessions} / {s.totalSessions}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              s.attendancePercentage >= 75
                                ? 'bg-signal-green/10 text-signal-green border border-signal-green/20'
                                : s.attendancePercentage >= 50
                                ? 'bg-signal-amber/10 text-signal-amber border border-signal-amber/20'
                                : 'bg-signal-red/10 text-signal-red border border-signal-red/20'
                            }`}
                          >
                            {s.attendancePercentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          {s.lastScanTime ? new Date(s.lastScanTime).toLocaleString() : 'Never'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
