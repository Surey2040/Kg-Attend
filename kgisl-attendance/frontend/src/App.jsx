import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LayoutProvider } from './context/LayoutContext.jsx';

// ... other imports ...

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
import LeaveManagement from './pages/LeaveManagement.jsx';
import { EtheralShadow } from './components/ui/EtheralShadow.jsx';

function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  
  return (
    <div className="w-full h-screen p-4 md:p-6 flex flex-col relative z-0 overflow-hidden">
      
      {/* Dark Glassmorphic Dashboard Container with subtle themed border */}
      <div className="w-full flex-1 relative z-10 flex flex-col bg-transparent backdrop-blur-xl border border-[rgba(70,95,255,0.3)] rounded-[32px] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <EtheralShadow
            color="rgba(20, 30, 70, 1)"
            animation={{ scale: 100, speed: 90 }}
            noise={{ opacity: 1, scale: 1.2 }}
            sizing="fill"
          />
        </div>
        {/* Dark overlay for readability */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-black/20"></div>
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
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
              path="/faculty/logs"
              element={
                <ProtectedRoute role="FACULTY">
                  <LogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/add-faculty"
              element={
                <ProtectedRoute role="ADMIN">
                  <AddFacultyPage />
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

