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
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-4 md:px-8 md:py-6 flex-wrap gap-4 lg:flex-nowrap">
      <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg hover:bg-ink-900 transition-colors shrink-0"
        >
          <Menu size={24} />
        </button>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-sans italic text-2xl md:text-3xl font-extrabold tracking-wider text-blue-700">KGiSL</span>
          <span className="text-2xl text-slate-500 font-light">|</span>
          <span className="font-sans text-xl md:text-2xl font-medium text-slate-200">presenceIQ</span>
        </div>
        <p className="mt-1 font-display text-sm text-slate-400 truncate">
          Welcome <span className="font-bold text-white ml-1">{user?.name || 'Faculty'}</span>
        </p>
      </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full md:w-auto mt-2 md:mt-0">
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

