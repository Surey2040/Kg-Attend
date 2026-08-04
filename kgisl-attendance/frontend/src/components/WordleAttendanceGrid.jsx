import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

// Detailed Academic Calendar Events extracted from Academic_year 2026odd (2).docx
const ACADEMIC_EVENTS = {
  // June 2026
  '2026-06-26': { code: 'MU', name: 'Muharram (Holiday)', isHoliday: true },
  
  // July 2026
  '2026-07-04': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-07-18': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-07-20': { code: 'ASG', name: 'Assignment 1 Commence', isHoliday: false },
  '2026-07-27': { code: 'LAB', name: 'CIA I Lab Exam', isHoliday: false },

  // August 2026
  '2026-08-03': { code: 'CIA', name: 'CIA Theory Exam', isHoliday: false },
  '2026-08-15': { code: 'ID', name: 'Independence Day (Holiday)', isHoliday: true },
  '2026-08-24': { code: 'ASG', name: 'Assignment II Commence', isHoliday: false },
  '2026-08-26': { code: 'MN', name: 'Miladi-un-Nabi (Holiday)', isHoliday: true },
  '2026-08-31': { code: 'LAB', name: 'CIA II Lab Exam', isHoliday: false },

  // September 2026
  '2026-09-04': { code: 'GK', name: 'Gokulashtami (Holiday)', isHoliday: true },
  '2026-09-05': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-09-07': { code: 'CIA', name: 'CIA II Exam', isHoliday: false },
  '2026-09-14': { code: 'VC', name: 'Vinayagar Chathurthi (Holiday)', isHoliday: true },
  '2026-09-19': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-09-28': { code: 'LAB', name: 'Model Lab Exam', isHoliday: false },

  // October 2026
  '2026-10-02': { code: 'GJ', name: 'Gandhi Jayanthi (Holiday)', isHoliday: true },
  '2026-10-03': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-10-12': { code: 'MT', name: 'Model Theory Exam', isHoliday: false },
  '2026-10-17': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-10-19': { code: 'SP', name: 'Saraswathi Pooja (Holiday)', isHoliday: true },
  '2026-10-20': { code: 'VJ', name: 'Vijayadhasami (Holiday)', isHoliday: true },

  // November 2026
  '2026-11-07': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
  '2026-11-08': { code: 'DW', name: 'Diwali (Holiday)', isHoliday: true },
  '2026-11-21': { code: 'SA', name: 'Saturday Holiday', isHoliday: true },
};

const SEMESTER_MONTHS = [
  { name: 'June 2026', year: 2026, monthIndex: 5, monthCode: '06' },
  { name: 'July 2026', year: 2026, monthIndex: 6, monthCode: '07' },
  { name: 'August 2026', year: 2026, monthIndex: 7, monthCode: '08' },
  { name: 'September 2026', year: 2026, monthIndex: 8, monthCode: '09' },
  { name: 'October 2026', year: 2026, monthIndex: 9, monthCode: '10' },
  { name: 'November 2026', year: 2026, monthIndex: 10, monthCode: '11' },
];

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'];

export default function WordleAttendanceGrid({ history = [] }) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(2); // Default to August 2026
  const [tooltip, setTooltip] = useState(null);
  const [academicConfig, setAcademicConfig] = useState({
    academicYear: '2026-2027 ODD Semester',
    totalWorkingDays: 90,
  });

  useEffect(() => {
    api.get('/admin/academic-year-config')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setAcademicConfig(res.data.data);
        }
      })
      .catch(err => console.error('Using default academic config:', err));
  }, []);

  const activeMonth = SEMESTER_MONTHS[selectedMonthIdx];
  const { year, monthIndex, monthCode, name: monthName } = activeMonth;

  // Calculate first day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayObj = new Date(year, monthIndex, 1);
  const rawFirstDayOfWeek = firstDayObj.getDay(); // 0 is Sun
  // Convert so 0 = Mon, 1 = Tue, ..., 5 = Sat, 6 = Sun
  const leadingPaddingCells = rawFirstDayOfWeek === 0 ? 6 : rawFirstDayOfWeek - 1;

  // Number of days in selected month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Generate grid tiles for selected month
  const daysGrid = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dateKey = `${year}-${monthCode}-${dayStr}`;
    const dateObj = new Date(year, monthIndex, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun

    const isSunday = dayOfWeek === 0;
    const event = ACADEMIC_EVENTS[dateKey];
    const isHoliday = !!(event?.isHoliday || isSunday);

    // Check student attendance records from history
    const record = history.find((h) => {
      const scanDate = new Date(h.scanTime);
      return (
        scanDate.getFullYear() === year &&
        scanDate.getMonth() === monthIndex &&
        scanDate.getDate() === dayNum
      );
    });

    let status = 'FUTURE';
    let label = `${monthName.split(' ')[0]} ${dayNum}, ${year}`;
    let displayCode = dayNum.toString();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPastOrToday = dateObj <= today;

    if (event) {
      displayCode = event.code;
      label = `${label}: ${event.name}`;
    }

    if (isHoliday) {
      status = 'HOLIDAY';
      if (isSunday) {
        displayCode = 'SU';
        label = `${label}: Sunday Holiday`;
      }
    } else if (record) {
      status = record.status === 'PRESENT' ? 'PRESENT' : 'ABSENT';
      displayCode = record.status === 'PRESENT' ? 'P' : 'A';
      label = `${label}: ${status}`;
    } else if (isPastOrToday) {
      // Past working day without scan record -> ABSENT
      status = 'ABSENT';
      displayCode = 'A';
      label = `${label}: Absent (No scan record)`;
    } else {
      // Future date -> Upcoming
      status = 'FUTURE';
      if (!event) {
        displayCode = dayNum.toString();
      }
      label = `${label}: Upcoming`;
    }

    return { dayNum, dateKey, status, label, displayCode, eventName: event?.name };
  });

  const presentCount = daysGrid.filter((d) => d.status === 'PRESENT').length;
  const absentCount = daysGrid.filter((d) => d.status === 'ABSENT').length;
  const holidayCount = daysGrid.filter((d) => d.status === 'HOLIDAY').length;

  return (
    <div className="w-full bg-[#09090b]/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl mb-5 text-white">
      {/* Month Selector & Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-purple-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Academic Attendance Matrix
            </h3>
            <p className="text-[10px] text-purple-300 font-semibold">
              {academicConfig.academicYear} • {academicConfig.totalWorkingDays} Working Days
            </p>
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            disabled={selectedMonthIdx === 0}
            onClick={() => setSelectedMonthIdx((prev) => Math.max(0, prev - 1))}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          <select
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-indigo-300 px-2 py-1 focus:outline-none cursor-pointer"
          >
            {SEMESTER_MONTHS.map((m, idx) => (
              <option key={m.name} value={idx} className="bg-slate-900 text-white">
                {m.name}
              </option>
            ))}
          </select>

          <button
            disabled={selectedMonthIdx === SEMESTER_MONTHS.length - 1}
            onClick={() => setSelectedMonthIdx((prev) => Math.min(SEMESTER_MONTHS.length - 1, prev + 1))}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Table Headers: M T W TH F SA SU */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-black text-slate-400 border-b border-white/10 pb-2">
        {WEEKDAY_HEADERS.map((h) => (
          <div key={h} className="py-1 tracking-wider text-indigo-300">
            {h}
          </div>
        ))}
      </div>

      {/* Days Matrix Grid (Aligned under M T W TH F SA SU) */}
      <div className="relative w-full">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 my-2">
          {/* Padded Empty Cells before 1st day of month */}
          {Array.from({ length: leadingPaddingCells }).map((_, idx) => (
            <div key={`pad-${idx}`} className="aspect-square opacity-0" />
          ))}

          {/* Actual Month Days */}
          {daysGrid.map((tile) => {
            let bgClass = 'bg-slate-800/80 border-slate-700/50 text-slate-400';

            if (tile.status === 'PRESENT') {
              bgClass = 'bg-emerald-600/40 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
            } else if (tile.status === 'ABSENT') {
              bgClass = 'bg-rose-600/40 border-rose-500/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
            } else if (tile.status === 'HOLIDAY') {
              bgClass = 'bg-amber-600/30 border-amber-500/50 text-amber-300';
            }

            return (
              <div
                key={tile.dayNum}
                onMouseEnter={() => setTooltip(tile.label)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => alert(tile.label)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${bgClass}`}
              >
                <span className="text-[10px] sm:text-xs font-extrabold">{tile.displayCode}</span>
                <span className="text-[7px] text-slate-400 font-semibold mt-0.5">{tile.dayNum}</span>
              </div>
            );
          })}
        </div>

        {tooltip && (
          <div className="text-center text-xs text-amber-300 font-semibold bg-black/90 backdrop-blur-md py-1.5 px-4 rounded-full border border-white/20 w-fit mx-auto animate-fade-in shadow-2xl my-2">
            {tooltip}
          </div>
        )}
      </div>

      {/* Legend & Summary Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap text-[10px] sm:text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/90" /> P: Present ({presentCount})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/90" /> A: Absent ({absentCount})</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/90" /> L/H: Holiday ({holidayCount})</span>
        </div>
        <span className="text-[10px] text-purple-300 font-bold">{monthName}</span>
      </div>
    </div>
  );
}
