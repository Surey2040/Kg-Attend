import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, Home, FileText, Grid, Clock, BarChart2, Sparkles, Plus, PenTool, ShieldAlert, Users2, GraduationCap, Timer, Settings } from 'lucide-react';
import AgentChat from '../components/AgentChat.jsx';
import MonthlySignatureAuditView from '../components/MonthlySignatureAuditView.jsx';
import YoloHeadcountModal from '../components/YoloHeadcountModal.jsx';
import TimetableSelector from '../components/TimetableSelector.jsx';
import QRPanel from '../components/QRPanel.jsx';
import StatusRing from '../components/StatusRing.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { startSession, endSession, refreshSession, listSubjects, listRooms, listBatches, getActiveSession, getTodayScans } from '../services/api.js';
import { getSocket, disconnectSocket } from '../services/socket.js';
import { hapticMedium } from '../utils/haptics.js';

const DonutChart = ({ present, absent }) => {
  const total = present + absent || 1;
  const presentPct = (present / total) * 100;
  const strokeDasharray = `${presentPct} ${100 - presentPct}`;
  
  return (
    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 36 36" className="transform -rotate-90">
        {/* Background circle */}
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
        {/* Progress circle */}
        {present > 0 && (
          <circle 
            cx="18" cy="18" r="15.915" 
            fill="transparent" 
            stroke="#6366f1" 
            strokeWidth="4" 
            strokeDasharray={strokeDasharray} 
            strokeDashoffset="0"
            strokeLinecap="round"
          ></circle>
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-800">{Math.round((present/total)*100) || 0}%</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{total} Total</span>
      </div>
    </div>
  );
};

export default function FacultyDashboard() {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const currentSessionIdRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [batches, setBatches] = useState([]);
  
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'signatures'
  const [subjectId, setSubjectId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [isCombined, setIsCombined] = useState(false);
  const [combinedBatchIds, setCombinedBatchIds] = useState([]);
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
  
  const [isYoloModalOpen, setIsYoloModalOpen] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');

  // Fetch Data
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [s, r, b, activeSession, todayScans] = await Promise.all([
          listSubjects(), listRooms(), listBatches(), 
          getActiveSession(), getTodayScans().catch(() => []) 
        ]);
        if (!isMounted) return;
        setSubjects(s); setRooms(r); setBatches(b);
        setRoomId(r[0]?.id ?? '');
        
        if (todayScans && todayScans.length > 0 && activeSession) {
          setScans(todayScans.filter(scan => scan.sessionId === activeSession.sessionId));
        }
        
        if (activeSession) {
          setSessionMeta(activeSession);
          setSessionActive(true);
          currentSessionIdRef.current = activeSession.sessionId;
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // WebSocket
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      if (currentSessionIdRef.current) socket.emit('join_session', currentSessionIdRef.current);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('qr_updated', (payload) => { setQr(payload); setStats(payload.stats); });
    socket.on('attendance_marked', (data) => setScans(prev => [data, ...prev].slice(0, 50)));
    socket.on('geofence_violation', (data) => {
      setViolations(prev => prev + 1);
      setScans(prev => [{ ...data, isViolation: true }, ...prev].slice(0, 50));
    });
    socket.on('session_ended', () => {
      setSessionActive(false); setQr(null); setSessionMeta(null); currentSessionIdRef.current = null;
    });
    return () => disconnectSocket();
  }, []);

  // Timer
  useEffect(() => {
    if (!qr?.expiresAt) { setSecondsLeft(0); return; }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [qr?.expiresAt]);

  const handleStart = async () => {
    setStarting(true); hapticMedium(); setQr(null);
    setStats({ totalStudents: 0, present: 0, absent: 0, progressPercent: 0 });
    try {
      const { data: session } = await startSession({
        facultyId: user.id, subjectId, roomId, 
        batchId: isCombined ? combinedBatchIds[0] : batchId, isCombined, combinedBatchIds
      });
      setSessionMeta({ sessionId: session.sessionId, startedBy: user.name, startedAt: new Date(session.startedAt).toLocaleTimeString() });
      setSessionActive(true); setScans([]); setViolations(0);
      currentSessionIdRef.current = session.sessionId;
      socketRef.current?.emit('join_session', session.sessionId);
    } catch (err) { alert(err.message || 'Could not start session'); } finally { setStarting(false); }
  };

  const handleEnd = async () => {
    if (!sessionMeta?.sessionId) return;
    setStarting(true); hapticMedium();
    try { await endSession(sessionMeta.sessionId); currentSessionIdRef.current = null; setScans([]); }
    catch (err) { alert(err.message || 'Could not end session'); } finally { setStarting(false); }
  };

  const handleAiSearch = (e) => {
    e.preventDefault();
    // Dispatch event to open agent chat
    window.dispatchEvent(new Event('open-agent-chat'));
  };

  return (
    <div className="flex h-full w-full bg-[#f4f7fa] text-slate-800 font-sans absolute inset-0 z-50 overflow-hidden">
      
      {/* Light Sidebar */}
      <div className="w-[80px] bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-8 shrink-0 shadow-sm z-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <GraduationCap size={20} />
        </div>
        <div className="flex flex-col gap-6 w-full items-center">
          <button className="text-indigo-600 bg-indigo-50 p-3 rounded-xl transition-colors"><Home size={22} /></button>
          <button className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 p-3 rounded-xl transition-colors"><FileText size={22} /></button>
          <button className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 p-3 rounded-xl transition-colors"><Grid size={22} /></button>
          <button className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 p-3 rounded-xl transition-colors"><Clock size={22} /></button>
          <button className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 p-3 rounded-xl transition-colors"><BarChart2 size={22} /></button>
        </div>
        <div className="mt-auto flex flex-col gap-6 w-full items-center">
          <button 
            onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
            className="text-amber-500 bg-amber-50 p-3 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <Sparkles size={22} />
          </button>
          <button className="text-slate-400 hover:text-indigo-600 hover:bg-slate-50 p-3 rounded-xl transition-colors"><Settings size={22} /></button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <form onSubmit={handleAiSearch} className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Ask Genius AI..." 
              value={aiSearchQuery}
              onChange={(e) => setAiSearchQuery(e.target.value)}
              onClick={() => window.dispatchEvent(new Event('open-agent-chat'))}
              className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-12 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <span className="px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-400 bg-slate-50">⌘</span>
              <span className="px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-bold text-slate-400 bg-slate-50">F</span>
            </div>
          </form>
          
          <div className="flex items-center gap-4 ml-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm overflow-hidden">
              <User size={18} />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* Welcome & Actions */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Faculty'}!
            </h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeTab === 'live' ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'border-transparent text-slate-500 hover:bg-white/50'}`}
              >
                <QrCode size={14} className="inline mr-1.5" /> Sessions
              </button>
              <button 
                onClick={() => setActiveTab('signatures')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeTab === 'signatures' ? 'bg-white border-slate-200 shadow-sm text-slate-800' : 'border-transparent text-slate-500 hover:bg-white/50'}`}
              >
                <PenTool size={14} className="inline mr-1.5" /> Audits
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              {sessionActive && (
                <button 
                  onClick={() => setIsYoloModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Camera size={14} /> Verify (YOLO)
                </button>
              )}
              <button 
                onClick={() => !sessionActive ? document.getElementById('timetable-selector').scrollIntoView({ behavior: 'smooth' }) : handleEnd()}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${sessionActive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
              >
                {sessionActive ? <span className="flex items-center gap-1.5">End Session</span> : <><Plus size={14} /> New Session</>}
              </button>
            </div>
          </div>

          {activeTab === 'signatures' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <MonthlySignatureAuditView user={user} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column (Main Content) */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                
                {/* Active/New Session Card */}
                <div id="timetable-selector" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {sessionActive ? <><QrCode size={16} className="text-indigo-500"/> Active Session</> : <><Calendar size={16} className="text-indigo-500"/> Start New Session</>}
                    </h2>
                    {sessionActive && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                      </span>
                    )}
                  </div>

                  {!sessionActive ? (
                    <TimetableSelector
                      facultyEmail={user?.email} subjects={subjects} batches={batches}
                      subjectId={subjectId} setSubjectId={setSubjectId} setBatchId={setBatchId}
                      isCombined={isCombined} setIsCombined={setIsCombined}
                      combinedBatchIds={combinedBatchIds} setCombinedBatchIds={setCombinedBatchIds}
                      sessionActive={sessionActive} starting={starting} onStart={handleStart} onEnd={handleEnd} onRefresh={refreshSession} timeLabel={timeLabel}
                    />
                  ) : (
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1 w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <QRPanel qr={qr} sessionMeta={sessionMeta} />
                      </div>
                      <div className="w-full md:w-48 shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <StatusRing
                          value={secondsLeft} max={qr?.refreshIntervalSeconds ?? 60}
                          label={qr ? secondsLeft : '—'} sublabel="SEC · QR Expires In"
                          color={secondsLeft <= 15 ? '#ef4444' : secondsLeft <= 30 ? '#f59e0b' : '#10b981'}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Scans Table (All Documents style) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex-1 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Users2 size={16} className="text-slate-400" /> Recent Scans
                    </h2>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{scans.length} Students</span>
                  </div>
                  
                  {scans.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center"><QrCode size={20} className="opacity-50" /></div>
                      <p className="text-xs">No scans yet. Start a session!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 pt-2 font-semibold">Student Name</th>
                            <th className="pb-3 pt-2 font-semibold">Roll No</th>
                            <th className="pb-3 pt-2 font-semibold">Time</th>
                            <th className="pb-3 pt-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {scans.map((scan, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-semibold text-slate-700 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                  {scan.studentName?.charAt(0) || 'S'}
                                </div>
                                {scan.studentName}
                              </td>
                              <td className="py-3 text-slate-500 font-mono">{scan.rollNo}</td>
                              <td className="py-3 text-slate-500">{new Date(scan.scannedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</td>
                              <td className="py-3">
                                {scan.isViolation ? (
                                  <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-semibold text-[10px]">Violation</span>
                                ) : (
                                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[10px]">Present</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Sidebar */}
              <div className="flex flex-col gap-6">
                
                {/* Activity Feed */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex-1 min-h-[250px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-800">Activity Feed</h2>
                    <span className="text-slate-400"><Timer size={14} /></span>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto pr-2 max-h-[300px]">
                    {scans.slice(0, 5).map((scan, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="mt-0.5">
                          {scan.isViolation ? (
                            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><ShieldAlert size={12} /></div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={12} /></div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-700">
                            <span className="font-bold text-slate-800">{scan.studentName}</span> {scan.isViolation ? 'attempted proxy scan.' : 'marked attendance.'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(scan.scannedAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {scans.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
                    )}
                  </div>
                </div>

                {/* Storage Overview -> Attendance Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-800">Attendance Overview</h2>
                    <button className="text-slate-400 hover:text-slate-600">•••</button>
                  </div>
                  
                  <DonutChart present={stats.present} absent={stats.absent || (stats.totalStudents - stats.present)} />

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-slate-600 font-medium">Present</span>
                      </div>
                      <span className="font-bold text-slate-800">{stats.present}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                        <span className="text-slate-600 font-medium">Absent</span>
                      </div>
                      <span className="font-bold text-slate-800">{stats.absent || Math.max(0, stats.totalStudents - stats.present)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      <AgentChat />
      
      <YoloHeadcountModal 
        isOpen={isYoloModalOpen}
        onClose={() => setIsYoloModalOpen(false)}
        sessionId={sessionMeta?.sessionId}
        qrCount={stats.present}
      />
    </div>
  );
}
