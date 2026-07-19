import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { listFaculty, createFaculty } from '../services/api.js';
import { UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AddFacultyPage() {
  const [faculties, setFaculties] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadFaculties = async () => {
    try {
      const data = await listFaculty();
      setFaculties(data);
    } catch (err) {
      setError(err.message || 'Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createFaculty({ name, email, password });
      setSuccess('Faculty registered successfully!');
      setName('');
      setEmail('');
      setPassword('');
      await loadFaculties();
    } catch (err) {
      setError(err.message || 'Failed to register faculty');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full">
        <TopBar connected={true} />

        <div className="px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Faculty Form (Left/1-col) */}
          <div className="lg:col-span-1 rounded-2xl glass-card p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-red/10 border border-signal-red/20 text-signal-red">
                <UserPlus size={18} />
              </div>
              <h3 className="text-lg font-bold text-white">Add New Faculty</h3>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-signal-red/30 bg-signal-red/10 px-3.5 py-3 text-xs text-red-300 mb-5">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 rounded-xl border border-signal-green/30 bg-signal-green/10 px-3.5 py-3 text-xs text-signal-green mb-5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Kumar"
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kgisl-iim.ac.in"
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-signal-red text-white glass-btn text-sm flex items-center justify-center gap-2 mt-6"
              >
                {submitting ? 'Creating...' : 'Register Faculty'}
              </button>
            </form>
          </div>

          {/* Faculty list table (Right/2-col) */}
          <div className="lg:col-span-2 rounded-2xl glass-card overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-ink-border/50 bg-ink-900/40">
              <h3 className="text-base font-bold text-white">Registered Faculty Profiles</h3>
              <p className="text-xs text-slate-400 mt-1">These staff profiles can host live class attendance sessions</p>
            </div>

            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr className="border-b border-ink-border bg-ink-900/20 text-slate-400 font-semibold">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        Loading directory...
                      </td>
                    </tr>
                  ) : faculties.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        No faculty registered yet.
                      </td>
                    </tr>
                  ) : (
                    faculties.map((fac) => (
                      <tr key={fac.id} className="hover:bg-ink-800/20 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{fac.name}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{fac.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-signal-blue/10 text-signal-blue border border-signal-blue/20">
                            FACULTY
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          {new Date(fac.createdAt).toLocaleDateString()}
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
