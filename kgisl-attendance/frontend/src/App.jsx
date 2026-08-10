import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LayoutProvider } from './context/LayoutContext.jsx';

import PortalSelect from './pages/PortalSelect.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import StudentScanPage from './pages/StudentScanPage.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import TimetablePage from './pages/TimetablePage.jsx';
import AddFacultyPage from './pages/AddFacultyPage.jsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LogsPage from './pages/LogsPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import LeaveManagement from './pages/LeaveManagement.jsx';
import LiveCampus from './pages/LiveCampus.jsx';

function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role && user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="w-full min-h-screen md:h-screen p-0 md:p-5 flex flex-col relative z-0 bg-[#09090b] text-white overflow-hidden">
      {/* Subtle ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="w-full flex-1 relative z-10 flex flex-col bg-white/[0.03] backdrop-blur-2xl md:border border-white/10 rounded-none md:rounded-[24px] overflow-hidden shadow-2xl">
        <div className="relative z-10 flex-1 flex flex-col h-full min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function TechnicalProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== 'FACULTY') return <Navigate to="/" replace />;

  const isTechnicalOrAdmin = user?.email === 'teachnicalteam@gmail.com' || user?.email === 'admin@kgisliim.ac.in';
  if (!isTechnicalOrAdmin) return <Navigate to="/faculty/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <LayoutProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PortalSelect />} />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute role="FACULTY">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/analytics"
              element={
                <ProtectedRoute role="FACULTY">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <ProtectedRoute role="FACULTY">
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/courses"
              element={
                <ProtectedRoute role="FACULTY">
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/timetable"
              element={
                <ProtectedRoute role="FACULTY">
                  <TimetablePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/settings"
              element={
                <ProtectedRoute role="FACULTY">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute role="ADMIN">
                  <LogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-faculty"
              element={
                <ProtectedRoute role="ADMIN">
                  <AddFacultyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute role="ADMIN">
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/scan"
              element={
                <ProtectedRoute role="STUDENT">
                  <StudentScanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/live-campus"
              element={
                <ProtectedRoute role="ADMIN">
                  <LiveCampus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute role="ADMIN">
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/leaves"
              element={
                <ProtectedRoute role="FACULTY">
                  <LeaveManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/leaves"
              element={
                <ProtectedRoute role="STUDENT">
                  <LeaveManagement />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LayoutProvider>
    </AuthProvider>
  );
}
