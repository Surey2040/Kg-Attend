import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ScanLine,
  LayoutGrid,
  Users,
  CalendarDays,
  Settings,
  LayoutDashboard,
  Radio,
  FileClock,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { hapticLight } from '../utils/haptics.js';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.role === 'STUDENT') return null;

  const adminNav = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Live', icon: Radio, path: '/admin/live-campus' },
    { name: 'Students', icon: Users, path: '/admin/students' },
    { name: 'Audit', icon: ShieldCheck, path: '/admin/audit-logs' },
    { name: 'Faculty', icon: UserPlus, path: '/admin/add-faculty' }
  ];

  const facultyNav = [
    { name: 'Home', icon: ScanLine, path: '/faculty/dashboard' },
    { name: 'Analytics', icon: LayoutGrid, path: '/faculty/analytics' },
    { name: 'Timetable', icon: CalendarDays, path: '/faculty/timetable' },
    { name: 'Students', icon: Users, path: '/faculty/students' },
    { name: 'Settings', icon: Settings, path: '/faculty/settings' }
  ];

  // Pick top 5 items for bottom nav (space constraints)
  const navItems = user.role === 'ADMIN' ? adminNav.slice(0, 5) : facultyNav.slice(0, 5);

  const handleNav = (path) => {
    hapticLight();
    navigate(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-ink-border/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all ${
                isActive ? 'text-signal-blue' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-signal-blue/10' : ''}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-signal-blue' : ''}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
