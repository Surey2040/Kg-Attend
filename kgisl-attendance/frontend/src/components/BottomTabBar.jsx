import { ScanLine, LayoutGrid, CalendarDays, Users, Activity, Settings, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function BottomTabBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const NAV = user?.role === 'ADMIN'
    ? [
        { name: 'Dashboard', icon: LayoutGrid, path: '/admin/dashboard' },
        { name: 'Students', icon: Users, path: '/admin/students' },
        { name: 'Audit', icon: ShieldCheck, path: '/admin/audit-logs' }
      ]
    : user?.role === 'FACULTY'
    ? [
        { name: 'Attendance', icon: ScanLine, path: '/faculty/dashboard' },
        { name: 'Analytics', icon: LayoutGrid, path: '/faculty/analytics' },
        { name: 'Timetable', icon: CalendarDays, path: '/faculty/timetable' },
        { name: 'Students', icon: Users, path: '/faculty/students' },
        { name: 'Leaves', icon: Activity, path: '/faculty/leaves' }
      ]
    : [
        { name: 'Scan QR', icon: ScanLine, path: '/student/scan' },
        { name: 'Leaves', icon: Activity, path: '/student/leaves' }
      ];

  function handleNavClick(path) {
    if (path !== '/faculty/dashboard' && sessionStorage.getItem('activeSessionId')) {
      alert('⚠️ Please close the active session before navigating away!');
      return;
    }
    navigate(path);
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around shadow-2xl">
      {NAV.map(({ icon: Icon, name, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => handleNavClick(path)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-indigo-400 scale-110' : ''} />
            <span className="text-[10px] font-semibold tracking-wider mt-1">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
