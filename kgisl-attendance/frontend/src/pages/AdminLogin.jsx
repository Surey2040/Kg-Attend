import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, KeyRound, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginFaculty, loginAdmin } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      try {
        const res = await loginAdmin(email, password);
        const { token, refreshToken, user } = res;
        login(token, refreshToken, user);
        navigate('/admin/dashboard');
        return;
      } catch (adminErr) {
        if (adminErr.response?.status === 401 && adminErr.response?.data?.message?.includes('Password')) {
          throw adminErr; // Wrong password for admin
        }
        // Fallback to faculty login if admin not found
        const res = await loginFaculty(email, password);
        const { token, refreshToken, user } = res;
        login(token, refreshToken, user);
        navigate('/faculty/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="w-full flex flex-col px-2 pb-0 pt-2">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-wide mb-2">Welcome Back</h2>
          <p className="text-sm text-slate-300 font-medium">Sign in to administration</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="relative bg-black/60 border border-white/10 focus-within:border-white/30 focus-within:bg-black/80 rounded-xl transition-all shadow-inner">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 bg-transparent text-sm font-medium text-white placeholder-slate-400 focus:outline-none rounded-xl"
            />
          </div>

          <div className="relative bg-black/60 border border-white/10 focus-within:border-white/30 focus-within:bg-black/80 rounded-xl transition-all shadow-inner">
            <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-12 py-3 bg-transparent text-sm font-medium text-white placeholder-slate-400 focus:outline-none rounded-xl"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
            </button>
          </div>

          <div className="flex justify-start px-1 pt-1">
            <a href="#" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
              Forgot Password?
            </a>
          </div>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-3.5 font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2">
            {loading ? 'Logging in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
          </button>
        </form>

        <div className="flex items-center gap-3 my-7">
          <div className="h-[1px] bg-slate-600/50 flex-1"></div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">OR CONTINUE WITH</span>
          <div className="h-[1px] bg-slate-600/50 flex-1"></div>
        </div>

        <button className="w-full py-3 bg-[#e2e8f0] hover:bg-white text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-colors shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="mt-8 text-center text-xs font-medium text-slate-400">
          Don't have an account? <a href="#" className="text-blue-400 hover:text-blue-300">Sign Up</a>
        </div>
      </div>
      
    </>
  );
}
