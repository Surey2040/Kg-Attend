import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Layers, ChevronDown } from 'lucide-react';
import { FACULTY_TIMETABLE, DAY_ORDERS } from '../utils/timetableData.js';

export default function TimetableSelector({
  facultyEmail,
  subjects,
  batches,
  setSubjectId,
  setBatchId,
  sessionActive,
  starting,
  onStart,
  onEnd,
  timeLabel
}) {
  const [dayOrder, setDayOrder] = useState('I');
  const [selectedClassIndex, setSelectedClassIndex] = useState('');
  
  const timetable = FACULTY_TIMETABLE[facultyEmail] || {};
  const todayClasses = timetable[dayOrder] || [];

  // When day order or today classes change, reset selection
  useEffect(() => {
    setSelectedClassIndex('');
    setSubjectId('');
    setBatchId('');
  }, [dayOrder]);

  const handleClassSelect = (index) => {
    setSelectedClassIndex(index);
    if (index === '') {
      setSubjectId('');
      setBatchId('');
      return;
    }
    const cls = todayClasses[index];
    
    // Find matching subject ID from catalog
    const matchedSubject = subjects.find(s => s.name === cls.subject);
    if (matchedSubject) setSubjectId(matchedSubject.id);
    
    // Find matching batch ID from catalog
    const matchedBatch = batches.find(b => b.name === cls.batch);
    if (matchedBatch) setBatchId(matchedBatch.id);
  };

  return (
    <div className="mx-8 flex flex-wrap items-center gap-6 rounded-xl glass-card px-6 py-4">
      <div className="flex items-center gap-2.5 min-w-[140px]">
        <Calendar size={16} className="text-slate-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Day Order</p>
          <div className="relative">
            <select
              value={dayOrder}
              onChange={(e) => setDayOrder(e.target.value)}
              disabled={sessionActive}
              className="w-full appearance-none bg-black/30 border border-white/10 hover:border-white/20 focus:border-signal-blue/50 focus:ring-1 focus:ring-signal-blue/50 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-100 outline-none cursor-pointer disabled:opacity-50 transition-all shadow-inner"
            >
              {DAY_ORDERS.map(day => (
                <option key={day} value={day} className="bg-ink-900 text-slate-100">
                  Day {day}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/5 rounded-md pointer-events-none">
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-ink-border hidden md:block" />

      <div className="flex items-center gap-2.5 flex-1 min-w-[250px]">
        <BookOpen size={18} className="text-slate-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Select Class</p>
          <div className="relative">
            <select
              value={selectedClassIndex}
              onChange={(e) => handleClassSelect(e.target.value)}
              disabled={sessionActive || todayClasses.length === 0}
              className="w-full appearance-none truncate bg-black/30 border border-white/10 hover:border-white/20 focus:border-signal-blue/50 focus:ring-1 focus:ring-signal-blue/50 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-100 outline-none cursor-pointer disabled:opacity-50 transition-all shadow-inner"
            >
              <option value="">
                {todayClasses.length === 0 ? "No classes scheduled today" : "Choose a session..."}
              </option>
              {todayClasses.map((cls, idx) => (
                <option key={idx} value={idx} className="bg-ink-900 text-slate-100">
                  Period {cls.period.join(' & ')} - {cls.subject} ({cls.batch})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-white/5 rounded-md pointer-events-none">
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-ink-border hidden md:block" />

      <div className="flex items-center gap-2.5 min-w-[140px]">
        <Clock size={16} className="text-slate-500 shrink-0" />
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Time</p>
          <p className="text-sm font-medium text-slate-100">{timeLabel}</p>
        </div>
      </div>

      {sessionActive ? (
        <button
          onClick={onEnd}
          className="flex items-center gap-2 bg-signal-red px-4 py-2.5 text-sm text-white ml-auto glass-btn"
        >
          End Session
        </button>
      ) : (
        <button
          onClick={onStart}
          disabled={starting || selectedClassIndex === ''}
          className="flex items-center gap-2 bg-signal-green px-4 py-2.5 text-sm text-ink-950 ml-auto glass-btn disabled:opacity-60"
        >
          {starting ? 'Start Session' : 'Start Session'}
        </button>
      )}
    </div>
  );
}
