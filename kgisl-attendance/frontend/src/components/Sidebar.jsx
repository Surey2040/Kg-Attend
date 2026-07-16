import {
  ScanLine,
  LayoutGrid,
  Users,
  BookOpen,
  CalendarDays,
  Activity,
  Settings,
  FileClock,
  ChevronDown,
  UserPlus,
  LayoutDashboard,
  Calendar,
  QrCode,
  Radio,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLayout } from '../context/LayoutContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'FACULTY' || user?.role === 'ADMIN') {
      api.get('/leave/pending')
        .then(res => {
          if (res.data?.data) {
            setPendingLeaveCount(res.data.data.length);
          }
        })
        .catch(err => console.error("Failed to fetch pending leaves", err));
    }
  }, [user]);

  const NAV = user?.role === 'ADMIN'
    ? [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { name: 'Live Campus', icon: Radio, path: '/admin/live-campus' },
        { name: 'Students', icon: Users, path: '/admin/students' },
        { name: 'Add Faculty', icon: UserPlus, path: '/admin/add-faculty' },
        { name: 'Attendance Logs', icon: FileClock, path: '/admin/logs' },
        { name: 'Audit Logs', icon: ShieldCheck, path: '/admin/audit-logs' }
      ]
    : user?.role === 'FACULTY'
    ? [
        { name: 'Attendance', icon: ScanLine, path: '/faculty/dashboard' },
        { name: 'Analytics', icon: LayoutGrid, path: '/faculty/analytics' },
        { name: 'Timetable', icon: CalendarDays, path: '/faculty/timetable' },
        { name: 'Students', icon: Users, path: '/faculty/students' },
        { name: 'Courses', icon: BookOpen, path: '/faculty/courses' },
        { name: 'Leave Requests', icon: Activity, path: '/faculty/leaves', badge: pendingLeaveCount > 0 },
        { name: 'Settings', icon: Settings, path: '/faculty/settings' }
      ]
    : [
        { name: 'Scan QR', icon: QrCode, path: '/student/scan' },
        { name: 'Leave Request', icon: Calendar, path: '/student/leaves' }
      ];

  function handleNavClick(path) {
    if (
      path !== '/faculty/dashboard' &&
      sessionStorage.getItem('activeSessionId')
    ) {
      alert('⚠️ Please close the active session before navigating away!');
      return;
    }
    navigate(path);
  }

  return (
    <>
      {isSidebarOpen && (
        <div 
          className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-out ${isSidebarOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`hidden md:flex w-64 shrink-0 glass-sidebar flex-col z-50 fixed inset-y-6 left-6 rounded-2xl transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSidebarOpen ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-16 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="px-5 pt-6 pb-5 border-b border-ink-border flex flex-col items-center">
          
          <div className="w-full glass-card rounded-xl h-20 flex items-center justify-center relative overflow-hidden group border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
            <div className="absolute -top-12 -right-6 w-24 h-24 bg-signal-blue/20 blur-2xl rounded-full group-hover:bg-signal-blue/40 transition-colors duration-700" />
            <div className="absolute -bottom-10 -left-6 w-24 h-24 bg-signal-red/10 blur-2xl rounded-full" />
            <img src="/logo.png" alt="KGiSL Logo" className="w-[110%] h-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] relative z-10" />
          </div>
          
          <p className="text-[9px] font-bold tracking-[0.25em] text-slate-400 uppercase mt-4 text-center">MCA Department</p>
        </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV.map(({ icon: Icon, name, path, badge }, index) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={name}
              onClick={() => handleNavClick(path)}
              style={{ transitionDelay: isSidebarOpen ? `${index * 40 + 100}ms` : '0ms' }}
              className={`w-full flex items-center gap-3 relative glass-nav-item transform transition-all duration-500 ease-out ${
                isActive ? 'active' : ''
              } ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
            >
              <Icon size={17} className={isActive ? 'text-signal-red' : ''} />
              <span className="flex-1 text-left">{name}</span>
              {badge && (
                <span className="absolute right-3 w-2 h-2 rounded-full bg-signal-red shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={logout}
        style={{ transitionDelay: isSidebarOpen ? `${NAV.length * 40 + 100}ms` : '0ms' }}
        className={`m-3 flex items-center gap-3 px-3 py-2.5 text-left glass-nav-item transform transition-all duration-500 ease-out ${isSidebarOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-blue/20 text-signal-blue text-sm font-semibold">
          {user?.name?.charAt(0) ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-slate-200">{user?.name ?? 'User'}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <ChevronDown size={14} className="text-slate-500" />
      </button>
    </aside>
    </>
  );
}
