import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { api } from '../services/api.js';

export default function LiveCampus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveCampus();
    // Auto refresh every 10 seconds for "Live" feel
    const interval = setInterval(fetchLiveCampus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveCampus = async () => {
    try {
      // Create this endpoint in api.js if needed, or call directly
      const res = await api.get('/admin/live-campus');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch live campus', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full relative z-10">
        <TopBar title="Live Campus Heatmap" subtitle="Real-time session monitoring" />
        
        <div className="px-4 md:px-8 mt-6 w-full">
          {loading && !data ? (
            <div className="flex justify-center mt-20">
              <div className="w-8 h-8 border-4 border-signal-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data?.sessions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 mb-10 text-white/50">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-2xl">😴</span>
              </div>
              <p>No active sessions on campus right now.</p>
            </div>
          ) : (
            <>
              {/* Top Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCard title="Active Sessions" value={data?.overall?.totalSessions} color="text-signal-blue" />
                <StatCard title="Expected Check-ins" value={data?.overall?.totalExpected} color="text-white" />
                <StatCard title="Total Present" value={data?.overall?.totalPresent} color="text-signal-green" />
                <StatCard title="Total Absent" value={data?.overall?.totalAbsent} color="text-signal-red" />
              </div>

              {/* Grid of Active Sessions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.sessions.map((session) => (
                  <div key={session.sessionId} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white/90">{session.subjectName}</h3>
                        <p className="text-sm text-white/60">{session.batchName} • {session.roomName}</p>
                      </div>
                      {session.status === 'ACTIVE' ? (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-signal-blue/10 text-signal-blue text-xs font-semibold border border-signal-blue/20">
                          <span className="w-2 h-2 rounded-full bg-signal-blue animate-pulse"></span>
                          LIVE
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-500/10 text-slate-400 text-xs font-semibold border border-slate-500/20">
                          ENDED
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-white/70 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                        {session.facultyName.charAt(0)}
                      </span>
                      {session.facultyName}
                    </div>

                    <div className="flex justify-between text-xs font-medium mb-3">
                      <span className="text-signal-green">{session.stats.present} Present</span>
                      <span className="text-signal-red">{session.stats.absent} Absent</span>
                    </div>

                    {/* GitHub Style Grid - Classroom Layout */}
                    <div className="flex flex-col gap-1.5 mt-auto bg-black/20 p-4 rounded-xl border border-white/5 items-center">
                      {/* Teacher Desk visualization */}
                      <div className="w-16 h-2 bg-white/10 rounded-sm mb-3"></div>
                      
                      {Array.from({ length: Math.ceil((session.students || []).length / 7) }).map((_, rIdx) => {
                        const rowStudents = session.students.slice(rIdx * 7, (rIdx + 1) * 7);
                        return (
                          <div key={rIdx} className="flex gap-4">
                            {/* Left: 2 seats */}
                            <div className="flex gap-1 w-[32px]">
                              {rowStudents.slice(0, 2).map((student) => (
                                <StudentBox key={student.id} student={student} />
                              ))}
                            </div>
                            
                            {/* Middle: 3 seats */}
                            <div className="flex gap-1 w-[50px]">
                              {rowStudents.slice(2, 5).map((student) => (
                                <StudentBox key={student.id} student={student} />
                              ))}
                            </div>
                            
                            {/* Right: 2 seats */}
                            <div className="flex gap-1 w-[32px]">
                              {rowStudents.slice(5, 7).map((student) => (
                                <StudentBox key={student.id} student={student} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 3D view removed as per user request */}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-sm text-white/50 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value || 0}</p>
    </div>
  );
}

// LiveClassroomView removed

function StudentBox({ student }) {
  return (
    <div
      title={`${student.rollNo} - ${student.name} (${student.isPresent ? 'Present' : 'Absent'})`}
      className={`w-[14px] h-[14px] rounded-sm transition-all duration-300 cursor-help shrink-0 ${
        student.isPresent 
          ? 'bg-[#2ea043] shadow-[0_0_4px_rgba(46,160,67,0.4)]' 
          : 'bg-signal-red/80 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      }`}
    />
  );
}
