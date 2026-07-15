import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Layers } from 'lucide-react';
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
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Day Order</p>
          <select
            value={dayOrder}
            onChange={(e) => setDayOrder(e.target.value)}
            disabled={sessionActive}
            className="w-full bg-transparent text-sm font-medium text-slate-100 outline-none cursor-pointer disabled:opacity-50"
          >
            {DAY_ORDERS.map(day => (
              <option key={day} value={day} className="bg-ink-850 text-slate-100">
                Day {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-8 w-px bg-ink-border hidden md:block" />

      <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
        <BookOpen size={16} className="text-slate-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Select Class</p>
          <select
            value={selectedClassIndex}
            onChange={(e) => handleClassSelect(e.target.value)}
            disabled={sessionActive || todayClasses.length === 0}
            className="w-full truncate bg-transparent text-sm font-medium text-slate-100 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="">
              {todayClasses.length === 0 ? "No classes scheduled today" : "-- Select Class --"}
            </option>
            {todayClasses.map((cls, idx) => (
              <option key={idx} value={idx} className="bg-ink-850 text-slate-100">
                Period {cls.period.join(' & ')} - {cls.subject} ({cls.batch})
              </option>
            ))}
          </select>
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
          {starting ? 'Starting…' : 'Start Session'}
        </button>
      )}
    </div>
  );
}
