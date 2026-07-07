import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { loginStudent } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, refreshToken, user } = await loginStudent(email, password);
      login(token, refreshToken, user);
      navigate('/student/scan');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-signal-red/10 border border-signal-red/25">
          <GraduationCap size={22} className="text-signal-red" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-white">Student Portal</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to scan and mark your attendance.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Email</label>
            <div className="mt-1.5 relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="surender.m@students.kgisl-iim.ac.in"
                className="w-full rounded-lg border border-ink-border bg-ink-850 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-signal-red/60 focus:ring-1 focus:ring-signal-red/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400">Password</label>
            <div className="mt-1.5 relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-ink-border bg-ink-850 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-signal-red/60 focus:ring-1 focus:ring-signal-red/40"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-signal-red py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
