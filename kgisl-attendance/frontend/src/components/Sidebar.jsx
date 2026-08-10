import {
  ScanLine,
  LayoutGrid,
  Users,
  BookOpen,
  CalendarDays,
  Activity,
  Settings,
  FileClock,
  UserPlus,
  LayoutDashboard,
  Calendar,
  QrCode,
  Radio,
  ShieldCheck,
  Sparkles
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
          className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-out ${isSidebarOpen ? 'bg-black/60 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`hidden md:block shrink-0 transition-all duration-500 ease-out ${isSidebarOpen ? 'w-20' : 'w-0'}`} />
      <aside className={`flex w-20 shrink-0 bg-[#09090b] flex-col z-50 fixed inset-y-0 left-0 h-full md:h-screen shadow-xl border-r border-white/5 transform transition-all duration-500 ease-out ${isSidebarOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'}`}>
        
        <div className="flex-1 px-4 py-8 flex flex-col items-center gap-6 overflow-y-auto custom-scrollbar">
          {NAV.map(({ icon: Icon, name, path, badge }, index) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={name}
                onClick={() => handleNavClick(path)}
                title={name}
                className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-signal-blue text-white shadow-lg shadow-signal-blue/40' 
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {badge && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-signal-red shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pb-8 flex flex-col items-center gap-6">
          <button 
            title="AI Assistant"
            onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
            className="relative group w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-black"
          >
            <div className="absolute inset-0 rounded-full siri-orb" />
            <div className="absolute inset-[2px] rounded-full bg-black z-10 flex items-center justify-center overflow-hidden">
               <div className="w-10 h-10 rounded-full siri-core blur-md" />
            </div>
          </button>
          
          <button
            onClick={logout}
            title="Profile / Logout"
            className="relative flex items-center justify-center w-14 h-14 rounded-full border border-white/10 hover:border-white/20 transition-all overflow-hidden bg-black/40"
          >
            <div className="flex h-full w-full items-center justify-center text-signal-blue text-lg font-bold">
              {user?.name?.charAt(0) ?? 'U'}
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}

