import { useEffect, useRef, useState } from 'react';
import { Users2, ShieldAlert, Timer, GraduationCap } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import TimetableSelector from '../components/TimetableSelector.jsx';
import StatusRing from '../components/StatusRing.jsx';
import QRPanel from '../components/QRPanel.jsx';
import RecentScans from '../components/RecentScans.jsx';
import StatTile from '../components/StatTile.jsx';
import AgentChat from '../components/AgentChat.jsx';
import ManualAttendance from '../components/ManualAttendance.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { startSession, endSession, refreshSession, listSubjects, listRooms, listBatches, getActiveSession, getTodayScans } from '../services/api.js';
import { getSocket, disconnectSocket } from '../services/socket.js';
import { hapticHeavy, hapticMedium } from '../utils/haptics.js';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const currentSessionIdRef = useRef(null);

  const isAdmin = user?.email === 'admin@kgisliim.ac.in';

  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [subjectId, setSubjectId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [batchId, setBatchId] = useState('');
  const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [sessionActive, setSessionActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [qr, setQr] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [stats, setStats] = useState({ totalStudents: 0, present: 0, absent: 0, progressPercent: 0 });
  const [scans, setScans] = useState([]);
  const [violations, setViolations] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, b, activeSession, todayScans] = await Promise.all([
          listSubjects(), 
          listRooms(), 
          listBatches(), 
          !isAdmin ? getActiveSession() : Promise.resolve(null),
          getTodayScans().catch(() => []) 
        ]);
        
        setSubjects(s);
        setRooms(r);
        setBatches(b);
        setRoomId(r[0]?.id ?? '');
        
        if (todayScans && todayScans.length > 0) {
          if (isAdmin) {
            setScans(todayScans);
          } else if (!isAdmin && activeSession) {
            setScans(todayScans.filter(s => s.sessionId === activeSession.sessionId));
          } else {
            setScans([]);
          }
        }
        
        if (!isAdmin && activeSession) {
          setSessionMeta(activeSession);
          setSessionActive(true);
          currentSessionIdRef.current = activeSession.sessionId;
          sessionStorage.setItem('activeSessionId', activeSession.sessionId);
        }
      } catch (err) {
        setCatalogError(err.message || 'Could not load catalog.');
      } finally {
        setLoadingCatalog(false);
      }
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return; // Admin doesn't need socket for QR updates

    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (currentSessionIdRef.current) {
        socket.emit('join_session', currentSessionIdRef.current);
      }
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('qr_updated', (payload) => {
      setQr(payload);
      setStats(payload.stats);
    });

    socket.on('attendance_marked', (data) => {
      setScans((prev) => [data, ...prev].slice(0, 50));
    });

    socket.on('geofence_violation', (data) => {
      setViolations((prev) => prev + 1);
      setScans((prev) => [{ ...data, isViolation: true }, ...prev].slice(0, 50));
    });

    socket.on('session_ended', () => {
      setSessionActive(false);
      setQr(null);
      setSessionMeta(null);
      currentSessionIdRef.current = null;
    });

    return () => {
      disconnectSocket();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!qr?.expiresAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [qr?.expiresAt, qr?.issuedAt]);

  async function handleStart() {
    setStarting(true);
    hapticMedium();
    setQr(null); // reset stale QR so no balance time from previous session
    setStats({ totalStudents: 0, present: 0, absent: 0, progressPercent: 0 });
    try {
      const { data: session } = await startSession({
        facultyId: user.id,
        subjectId,
        roomId,
        batchId,
      });

      setSessionMeta({
        sessionId: session.sessionId,
        startedBy: user.name,
        startedAt: new Date(session.startedAt).toLocaleTimeString(),
      });
      setSessionActive(true);
      setScans([]);
      setViolations(0);
      currentSessionIdRef.current = session.sessionId;
      sessionStorage.setItem('activeSessionId', session.sessionId);

      socketRef.current?.emit('join_session', session.sessionId);
    } catch (err) {
      alert(err.message || 'Could not start session');
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd() {
    if (!sessionMeta?.sessionId) return;
    setStarting(true);
    hapticMedium();
    try {
      await endSession(sessionMeta.sessionId);
      currentSessionIdRef.current = null;
      sessionStorage.removeItem('activeSessionId');
      setScans([]);
    } catch (err) {
      alert(err.message || 'Could not end session');
    } finally {
      setStarting(false);
    }
  }

  async function handleRefresh() {
    if (!sessionMeta?.sessionId) return;
    try {
      await refreshSession(sessionMeta.sessionId);
    } catch (err) {
      alert(err.message || 'Could not refresh session');
    }
  }

  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto scroll-smooth pb-6">
        <TopBar connected={connected} />

        {catalogError && (
          <p className="mx-4 md:mx-8 mb-4 rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-2.5 text-xs text-red-300">
            {catalogError}
          </p>
        )}

        {!isAdmin && (
          <TimetableSelector
            facultyEmail={user?.email}
            subjects={subjects}
            batches={batches}
            setSubjectId={setSubjectId}
            setBatchId={setBatchId}
            sessionActive={sessionActive}
            starting={starting}
            onStart={handleStart}
            onEnd={handleEnd}
            onRefresh={handleRefresh}
            timeLabel={timeLabel}
          />
        )}

        <div className={`mt-6 grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-[1fr_1.3fr_1fr]'} gap-6 px-4 md:px-8`}>
          
          {!isAdmin && (
            <div className="rounded-2xl glass-card p-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Session Status</h3>
                <span className="flex items-center gap-1.5 text-[11px] text-signal-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-green status-dot" />
                  {sessionActive ? 'Active' : 'Idle'}
                </span>
              </div>

              <StatusRing
                value={secondsLeft}
                max={qr?.refreshIntervalSeconds ?? 60}
                label={qr ? secondsLeft : '—'}
                sublabel="SEC · QR Expires In"
                color={secondsLeft <= 15 ? '#f43f5e' : secondsLeft <= 30 ? '#fb923c' : '#2fd97a'}
              />

              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <div className="rounded-xl border border-ink-border bg-black/60 py-3 text-center shadow-inner">
                  <p className="font-display text-2xl font-bold text-signal-green">{stats.present}</p>
                  <p className="text-[11px] text-slate-500">Present</p>
                </div>
                <div className="rounded-xl border border-ink-border bg-black/60 py-3 text-center shadow-inner">
                  <p className="font-display text-2xl font-bold text-signal-red">{stats.absent}</p>
                  <p className="text-[11px] text-slate-500">Absent</p>
                </div>
              </div>

              <div className="mt-5 w-full">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Session Progress</span>
                  <span>
                    {stats.present} / {stats.totalStudents || 1}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-ink-900">
                  <div
                    className="h-1.5 rounded-full bg-signal-green transition-all"
                    style={{ width: `${stats.progressPercent || 0}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{stats.progressPercent || 0}%</p>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="flex flex-col h-full gap-6">
              <QRPanel qr={qr} sessionMeta={sessionMeta} />
              {sessionActive && <ManualAttendance sessionId={sessionMeta?.sessionId} />}
            </div>
          )}

          <RecentScans scans={scans} />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 mb-6">
          <StatTile
            icon={GraduationCap}
            iconTone="green"
            title="Students Today"
            value={isAdmin ? scans.length : stats.totalStudents}
            subtitle="Total monitored across sessions"
          />
          
          <StatTile 
            icon={Users2} 
            iconTone="blue" 
            title={isAdmin ? "Total Scans" : "Active Sessions"} 
            value={isAdmin ? scans.length : (sessionActive ? '1' : '0')} 
            subtitle={isAdmin ? "Across campus" : "Currently running"} 
          />

          <StatTile 
            icon={ShieldAlert} 
            iconTone="red" 
            title="Proxy Attempts" 
            value={violations} 
            subtitle="Blocked automatically" 
          />
          
          <StatTile 
            icon={Timer} 
            iconTone="blue" 
            title="Scan Speed" 
            value="—" 
            subtitle="Avg. completion time" 
          />
        </div>
      </main>

      <AgentChat />
    </div>
  );
}
