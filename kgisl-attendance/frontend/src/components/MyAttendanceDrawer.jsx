import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, XCircle, Edit3, ShieldCheck, PenTool } from 'lucide-react';
import { getStudentHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MonthlyAttendanceSignatureModal from './MonthlyAttendanceSignatureModal';

export default function MyAttendanceDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signedRecord, setSignedRecord] = useState(null);

  const currentMonthStr = 'July 2026';
  const storageKey = `attendance_sig_${user?.id || 'student'}_${currentMonthStr.replace(' ', '_')}`;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      getStudentHistory()
        .then(data => {
          setHistory(data);
        })
        .catch(() => {
          setError('Could not fetch attendance history.');
        })
        .finally(() => {
          setLoading(false);
        });

      // Check signature state
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setSignedRecord(JSON.parse(saved));
        } catch (e) {
          setSignedRecord(null);
        }
      } else {
        setSignedRecord(null);
      }
    }
  }, [isOpen, storageKey]);

  // Group history by date vertically, then horizontal list of periods (subjects)
  const groupedData = history.reduce((acc, record) => {
    const dateObj = new Date(record.scanTime);
    const dateStr = dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push({
      ...record,
      timeStr: dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    });
    return acc;
  }, {});

  const dates = Object.keys(groupedData);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] bg-[#09090b] border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="text-purple-400" size={20} />
                  <h2 className="text-lg font-semibold text-white tracking-tight">My Attendance</h2>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-6">
                {/* Monthly Signature Banner Callout */}
                <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-950 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-purple-950/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
                      <PenTool size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">Monthly Attendance Sign-Off</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                          {currentMonthStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {signedRecord 
                          ? `Signed on ${signedRecord.signedAt}` 
                          : 'iOS Markup Pen verification required for monthly audit'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      signedRecord
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                    }`}
                  >
                    {signedRecord ? (
                      <>
                        <ShieldCheck size={14} /> View Signature
                      </>
                    ) : (
                      <>
                        <Edit3 size={14} /> Sign with iOS Pen
                      </>
                    )}
                  </button>
                </div>

                {loading && <div className="text-center text-slate-400 text-sm py-10 animate-pulse">Loading history...</div>}
                {error && <div className="text-center text-red-400 text-sm py-10">{error}</div>}
                {!loading && !error && dates.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-10">No attendance records found.</div>
                )}

                {!loading && !error && dates.map(date => (
                  <div key={date} className="flex flex-col gap-3">
                    {/* Vertical Date Header */}
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 sticky top-0 bg-[#09090b] py-1 z-10">
                      {date}
                    </h3>
                    
                    {/* Horizontal Scrollable Periods */}
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                      {groupedData[date].map((record) => (
                        <div key={record.id} className="flex-none w-48 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] flex flex-col gap-1.5 shrink-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-slate-200 truncate pr-2" title={record.subjectName}>
                              {record.subjectCode}
                            </span>
                            {record.status === 'PRESENT' ? (
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle size={14} className="text-red-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 truncate" title={record.subjectName}>
                            {record.subjectName}
                          </span>
                          <div className="flex items-center gap-1 mt-auto pt-2 text-[10px] text-slate-400">
                            <Clock size={10} />
                            {record.timeStr}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Monthly Attendance Signature Modal */}
      <MonthlyAttendanceSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          // Refresh signature record
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            try { setSignedRecord(JSON.parse(saved)); } catch (e) {}
          }
        }}
        studentData={user}
        historyData={history}
      />
    </>
  );
}
