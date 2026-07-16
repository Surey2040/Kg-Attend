import { Wifi, MapPin, ShieldCheck, Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLayout } from '../context/LayoutContext.jsx';

function StatusPill({ icon: Icon, label, value, tone = 'green' }) {
  const toneClasses = {
    green: 'text-signal-green',
    blue: 'text-signal-blue',
  }[tone];

  return (
    <div className="flex items-center gap-2 rounded-lg glass-card px-3 py-1.5 border-opacity-50">
      <Icon size={15} className={toneClasses} />
      <div className="leading-tight">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className={`text-xs font-medium ${toneClasses}`}>{value}</p>
      </div>
    </div>
  );
}

const TITLE_MAP = {
  '/faculty/dashboard': 'Attendance',
  '/faculty/analytics': 'Dashboard',
  '/faculty/students': 'Students Database',
  '/faculty/courses': 'Courses Catalog',
  '/faculty/timetable': 'Timetable',
  '/faculty/reports': 'Reports & Analytics',
  '/faculty/notifications': 'Notifications Hub',
  '/faculty/settings': 'System Settings',
  '/faculty/logs': 'System Logs',
  '/faculty/add-faculty': 'Add Faculty Management',
};

export default function TopBar({ connected, notificationCount = 3 }) {
  const location = useLocation();
  const { user } = useAuth();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();
  const title = TITLE_MAP[location.pathname] || 'Smart Attendance';

  return (
    <header className="flex items-center justify-between px-8 py-6 flex-wrap gap-4 lg:flex-nowrap">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg hover:bg-ink-900 transition-colors"
        >
          <Menu size={24} />
        </button>
      <div>
        <h1 className="font-serif italic text-3xl font-medium tracking-wide text-gradient-heading">{title}</h1>
        <div className="mt-2 inline-flex items-center rounded-full bg-black/40 border border-white/10 px-3 py-1.5 shadow-inner">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-400">
            Welcome back, <span className="font-bold text-white tracking-widest ml-1">{user?.name || 'Faculty'}</span>
          </p>
        </div>
      </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusPill icon={Wifi} label="Network" value="IIM Wi-Fi" tone="blue" />
        <StatusPill icon={MapPin} label="Location" value="Within Campus" tone="green" />
        <StatusPill
          icon={ShieldCheck}
          label="Session Security"
          value={connected ? 'Active' : 'Reconnecting…'}
          tone={connected ? 'green' : 'blue'}
        />
      </div>
    </header>
  );
}

