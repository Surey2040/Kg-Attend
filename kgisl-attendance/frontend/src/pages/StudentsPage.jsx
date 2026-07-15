import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { listStudents, getActiveSession, listBatches } from '../services/api.js';
import { Search, GraduationCap, Filter } from 'lucide-react';
import { GooeySearchBar } from '../components/ui/animated-search-bar';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch batches and try to auto-detect active session's batch on mount
  useEffect(() => {
    (async () => {
      try {
        const [batchesData] = await Promise.all([
          listBatches().catch(() => []),
        ]);
        setBatches(batchesData);

        const isAdmin = user?.email === 'admin@kgisliim.ac.in';
        if (!isAdmin) {
          try {
            const activeSession = await getActiveSession();
            if (activeSession && activeSession.batchId) {
              setSelectedBatchId(activeSession.batchId);
            }
          } catch (e) {
            // Ignore if no active session
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    })();
  }, [user]);

  // 2. Fetch students whenever selectedBatchId changes
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listStudents(selectedBatchId || null);
        setStudents(data);
      } catch (err) {
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedBatchId]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const currentBatchName = batches.find(b => b.id === selectedBatchId)?.name || '';

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full">
        <TopBar connected={true} />

        <div className="px-8 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-red/10 border border-signal-red/20 text-signal-red">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {currentBatchName ? `${currentBatchName} Students` : 'All Students'}
                </h2>
                <p className="text-sm text-slate-400">Total: {students.length}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-48">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Filter size={16} />
                </span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 glass-input cursor-pointer appearance-none"
                >
                  <option value="">All Sections</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name.replace('II ', '')}</option>
                  ))}
                </select>
                {/* Custom arrow for select */}
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                <GooeySearchBar 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student..."
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-2.5 text-xs text-red-300 mb-6">
              {error}
            </p>
          )}

          <div className="rounded-2xl glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th>Batch</th>
                    <th>Attended / Total</th>
                    <th>Attendance %</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={s.id}>
                        <td className="font-mono text-slate-300 font-semibold">{s.rollNo}</td>
                        <td className="text-white font-medium">{s.name}</td>
                        <td>{s.batchName}</td>
                        <td>
                          {s.attendedSessions} / {s.totalSessions}
                        </td>
                        <td>
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
                        <td className="font-mono text-xs">
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
