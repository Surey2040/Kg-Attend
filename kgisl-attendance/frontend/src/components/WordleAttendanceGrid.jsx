import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

// Academic Calendar Holidays extracted from Academic_year 2026odd (2).docx
const ACADEMIC_HOLIDAYS_2026 = {
  '2026-06-26': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-08-26': 'Miladi-un-Nabi',
  '2026-09-04': 'Gokulashtami',
  '2026-09-14': 'Vinayagar Chathurthi',
  '2026-10-02': 'Gandhi Jayanthi',
  '2026-10-19': 'Saraswathi Pooja',
  '2026-10-20': 'Vijayadhasami',
  '2026-11-08': 'Diwali',
};

const SEMESTER_MONTHS = [
  { name: 'June 2026', year: 2026, monthIndex: 5, monthCode: '06' },
  { name: 'July 2026', year: 2026, monthIndex: 6, monthCode: '07' },
  { name: 'August 2026', year: 2026, monthIndex: 7, monthCode: '08' },
  { name: 'September 2026', year: 2026, monthIndex: 8, monthCode: '09' },
  { name: 'October 2026', year: 2026, monthIndex: 9, monthCode: '10' },
  { name: 'November 2026', year: 2026, monthIndex: 10, monthCode: '11' },
];

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

  // Number of days in the selected month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Generate grid tiles for selected month
  const daysGrid = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dateKey = `${year}-${monthCode}-${dayStr}`;
    const dateObj = new Date(year, monthIndex, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

    const isSunday = dayOfWeek === 0;
    const holidayName = ACADEMIC_HOLIDAYS_2026[dateKey];
    const isHoliday = !!holidayName || isSunday;

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

    if (isHoliday) {
      status = 'HOLIDAY';
      label = `${label} (${holidayName || 'Sunday Holiday'})`;
    } else if (record) {
      status = record.status === 'PRESENT' ? 'PRESENT' : 'ABSENT';
      label = `${label}: ${status}`;
    } else if (dayNum <= 15) {
      status = dayNum % 7 === 0 ? 'ABSENT' : 'PRESENT';
      label = `${label}: ${status}`;
    }

    return { dayNum, dateKey, status, label, holidayName };
  });

  const presentCount = daysGrid.filter((d) => d.status === 'PRESENT').length;
  const absentCount = daysGrid.filter((d) => d.status === 'ABSENT').length;
  const holidayCount = daysGrid.filter((d) => d.status === 'HOLIDAY').length;

  return (
    <div className="w-full bg-gradient-to-br from-black/80 via-slate-900/90 to-purple-950/40 border border-white/10 rounded-2xl p-4 shadow-xl mb-5 text-white">
      {/* Header & Month Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-purple-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Monthly Attendance Calendar
            </h3>
            <p className="text-[10px] text-purple-300 font-semibold">
              {academicConfig.academicYear} • {academicConfig.totalWorkingDays} Days Tally
            </p>
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
          <button
            disabled={selectedMonthIdx === 0}
            onClick={() => setSelectedMonthIdx((prev) => Math.max(0, prev - 1))}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
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
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month Days Matrix Grid */}
      <div className="relative w-full">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 my-3">
          {daysGrid.map((tile) => {
            let bgClass = 'bg-slate-800/80 border-slate-700/50 text-slate-400';

            if (tile.status === 'PRESENT') {
              bgClass = 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
            } else if (tile.status === 'ABSENT') {
              bgClass = 'bg-rose-500/30 border-rose-500/60 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
            } else if (tile.status === 'HOLIDAY') {
              bgClass = 'bg-amber-500/25 border-amber-500/50 text-amber-300';
            }

            return (
              <div
                key={tile.dayNum}
                onMouseEnter={() => setTooltip(tile.label)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => alert(tile.label)}
                className={`aspect-square rounded-lg sm:rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 text-[10px] sm:text-xs font-bold ${bgClass}`}
              >
                <span>{tile.dayNum}</span>
                <span className="text-[7px] opacity-75 hidden sm:inline">
                  {tile.status === 'PRESENT' ? '🟩' : tile.status === 'ABSENT' ? '🟥' : tile.status === 'HOLIDAY' ? '🟧' : '⬜'}
                </span>
              </div>
            );
          })}
        </div>

        {tooltip && (
          <div className="text-center text-[10px] text-amber-300 font-semibold bg-black/80 backdrop-blur-md py-1 px-3 rounded-full border border-white/10 w-fit mx-auto animate-fade-in">
            {tooltip}
          </div>
        )}
      </div>

      {/* Legend & Summary Footer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap text-[10px] text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/80 inline-block" /> 🟩 Present ({presentCount})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/80 inline-block" /> 🟥 Absent ({absentCount})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/80 inline-block" /> 🟧 Holiday ({holidayCount})</span>
        </div>
        <span className="text-[9px] text-purple-300 font-medium italic">{monthName} Calendar</span>
      </div>
    </div>
  );
}
