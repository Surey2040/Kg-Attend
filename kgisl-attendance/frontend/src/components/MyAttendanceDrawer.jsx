import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, XCircle, Edit3, ShieldCheck, PenTool, User, Search, Filter } from 'lucide-react';
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

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Present', 'Absent'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Generate an array of dates (15 days before, 5 days after today)
  const [dateList, setDateList] = useState([]);
  const dateScrollRef = useRef(null);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = -15; i <= 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    setDateList(dates);
  }, []);

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

  // Scroll to selected date initially
  useEffect(() => {
    if (isOpen && dateScrollRef.current) {
      setTimeout(() => {
        const activeEl = dateScrollRef.current?.querySelector('.active-date');
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
    }
  }, [isOpen, dateList]);

  // Format Date for comparison
  const isSameDate = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Filter history based on selected date, tab, and search
  const filteredHistory = history.filter(record => {
    const recordDate = new Date(record.scanTime || record.createdAt || record.markedAt);
    
    if (!isSameDate(recordDate, selectedDate)) return false;
    
    if (activeTab === 'Present' && record.status !== 'PRESENT') return false;
    if (activeTab === 'Absent' && record.status !== 'ABSENT') return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (record.subjectName && record.subjectName.toLowerCase().includes(q)) ||
        (record.facultyName && record.facultyName.toLowerCase().includes(q)) ||
        (record.subjectCode && record.subjectCode.toLowerCase().includes(q))
      );
    }
    
    return true;
  });

  const getDayStr = (date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };
  
  const getDateNum = (date) => {
    return date.getDate();
  };

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
              <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <User className="text-indigo-400" size={20} />
                  <h2 className="text-lg font-bold text-white tracking-tight">Student Profile & Attendance</h2>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-6">
                
                {/* 1. Student Profile Card */}
                <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">{user?.name || 'Student Name'}</h3>
                      <p className="text-xs text-indigo-300 font-semibold">{user?.rollNo || 'Roll No: 24MCA01'}</p>
                      <p className="text-[10px] text-slate-400">KGiSL-IIM • MCA Department</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      <ShieldCheck size={12} /> Active Student
                    </span>
                  </div>
                </div>

                {/* 2. Monthly Signature Banner Callout */}
                <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-indigo-950/40 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
                      <PenTool size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">Monthly Attendance Sign-Off</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                          {currentMonthStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {signedRecord 
                          ? `Signed on ${signedRecord.signedAt}` 
                          : 'Digital Pen Tool verification required for monthly audit'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      signedRecord
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
                    }`}
                  >
                    {signedRecord ? (
                      <>
                        <ShieldCheck size={14} /> View Signature
                      </>
                    ) : (
                      <>
                        <Edit3 size={14} /> Sign with Pen Tool
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Date Ribbon Scroller */}
                <div className="w-full overflow-x-auto scrollbar-hide py-2 shrink-0 -mx-2 px-2" ref={dateScrollRef}>
                  <div className="flex gap-3 min-w-max">
                    {dateList.map((d, idx) => {
                      const active = isSameDate(d, selectedDate);
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(d)}
                          className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 ${
                            active 
                              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/40 scale-105 active-date' 
                              : 'bg-white/[0.03] text-slate-400 border border-white/5 hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-500'}`}>
                            {getDateNum(d)}
                          </span>
                          <span className={`text-xs mt-1 font-semibold ${active ? 'text-indigo-100' : 'text-slate-300'}`}>
                            {getDayStr(d)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Search and Filters */}
                <div className="shrink-0 flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 focus-within:border-indigo-500/40 transition-colors">
                  <Search size={18} className="text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search subjects, faculty..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-600"
                  />
                </div>

                <div className="flex border-b border-white/[0.08] shrink-0">
                  {['All', 'Present', 'Absent'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                        activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <motion.div 
                          layoutId="activeTabDrawer"
                          className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-500"
                          initial={false}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* 5. List View */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium text-slate-300 sticky top-0 bg-[#09090b] py-2 z-10">
                    {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="text-xs text-slate-500 ml-2">({filteredHistory.length} Record{filteredHistory.length !== 1 ? 's' : ''})</span>
                  </h3>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center text-red-400 text-sm py-10">{error}</div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3">
                      <Calendar size={32} className="opacity-20" />
                      <p className="text-sm">No records found for this date.</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {filteredHistory.map((record, index) => {
                        const isPresent = record.status === 'PRESENT';
                        const dObj = new Date(record.scanTime || record.createdAt || record.markedAt);
                        return (
                          <motion.div
                            key={record.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${
                                  isPresent 
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-slate-800/50 text-slate-400 border border-white/5'
                                }`}>
                                  {record.subjectName ? record.subjectName.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#09090b] ${
                                  isPresent ? 'bg-emerald-500' : 'bg-red-500'
                                }`}>
                                  {isPresent ? <CheckCircle2 size={10} className="text-white" /> : <XCircle size={10} className="text-white" />}
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-base font-semibold text-slate-100">{record.subjectName || 'Subject'}</h3>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                  {record.subjectCode || record.facultyName || 'Course'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-500" />
                                {dObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${
                                isPresent
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {record.status}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MonthlyAttendanceSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
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
