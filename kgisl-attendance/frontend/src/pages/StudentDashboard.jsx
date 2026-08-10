import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Filter, CheckCircle2, XCircle, Clock, MapPin, QrCode, LogOut, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentHistory } from '../services/api';
import MyAttendanceDrawer from '../components/MyAttendanceDrawer';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Present', 'Absent'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);

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
    
    // Fetch History
    getStudentHistory()
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Scroll to selected date initially
  useEffect(() => {
    if (dateScrollRef.current) {
      const activeEl = dateScrollRef.current.querySelector('.active-date');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [dateList]);

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

  const getMonthYearStr = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDayStr = (date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };
  
  const getDateNum = (date) => {
    return date.getDate();
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col pb-24 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-pink-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-10 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold tracking-tight text-white">{getMonthYearStr(selectedDate)}</h1>
              <ChevronDown size={18} className="text-slate-400 mt-1" />
            </div>
            <p className="text-sm text-slate-400 mt-1.5">
              You have total {filteredHistory.length} class{filteredHistory.length !== 1 ? 'es' : ''} today
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => setIsAttendanceDrawerOpen(true)}
               className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
             >
               <User size={18} className="text-slate-300" />
             </button>
             <button
               onClick={logout}
               className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-colors"
             >
               <LogOut size={18} className="text-red-400" />
             </button>
          </div>
        </div>

        {/* Date Ribbon */}
        <div className="w-full overflow-x-auto scrollbar-hide py-3 px-5 mb-2" ref={dateScrollRef}>
          <div className="flex gap-3 min-w-max">
            {dateList.map((d, idx) => {
              const active = isSameDate(d, selectedDate);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 ${
                    active 
                      ? 'bg-[#c52c5d] text-white shadow-lg shadow-pink-900/30 scale-105 active-date' 
                      : 'bg-[#1a1a1c] text-slate-400 border border-white/5 hover:bg-[#252528]'
                  }`}
                >
                  <span className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-500'}`}>
                    {getDateNum(d)}
                  </span>
                  <span className={`text-xs mt-1 font-semibold ${active ? 'text-pink-100' : 'text-slate-300'}`}>
                    {getDayStr(d)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 mb-6">
          <div className="flex items-center gap-3 bg-[#131315] border border-white/[0.05] rounded-full px-4 py-3 focus-within:border-pink-500/40 transition-colors">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search subjects, faculty..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-slate-600"
            />
            <button className="text-slate-500 hover:text-white transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 mb-6 flex border-b border-white/[0.08]">
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
                  layoutId="activeTab"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#c52c5d]"
                  initial={false}
                />
              )}
            </button>
          ))}
        </div>

        {/* List View */}
        <div className="px-5 flex-1 flex flex-col gap-4 overflow-y-auto pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
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
                    className="flex items-center justify-between p-4 bg-[#111113] border border-white/[0.03] rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar/Icon representing Subject */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                          isPresent 
                            ? 'bg-gradient-to-br from-[#c52c5d]/20 to-[#c52c5d]/5 text-[#c52c5d] border border-[#c52c5d]/20'
                            : 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400 border border-white/5'
                        }`}>
                          {record.subjectName ? record.subjectName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        {/* Status small badge */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111113] ${
                          isPresent ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {isPresent ? <CheckCircle2 size={10} className="text-white" /> : <XCircle size={10} className="text-white" />}
                        </div>
                      </div>
                      
                      {/* Details */}
                      <div>
                        <h3 className="text-base font-semibold text-slate-100">{record.subjectName || 'Subject'}</h3>
                        <p className="text-xs font-medium text-slate-400 mb-1">
                          {record.facultyName || record.subjectCode || 'Assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Time & Status Chip */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm font-semibold text-slate-200">
                        {dObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        isPresent
                          ? 'bg-[#1b2b20] text-emerald-400 border border-emerald-500/20'
                          : 'bg-[#2a161b] text-red-400 border border-red-500/20'
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

      {/* Floating Action Button for Scanning */}
      <button
        onClick={() => navigate('/student/scan')}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-tr from-[#c52c5d] to-pink-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(197,44,93,0.4)] hover:scale-105 active:scale-95 transition-all"
      >
        <QrCode size={24} />
      </button>

      {/* Side Drawer Profile */}
      <MyAttendanceDrawer
        isOpen={isAttendanceDrawerOpen}
        onClose={() => setIsAttendanceDrawerOpen(false)}
      />
    </div>
  );
}
