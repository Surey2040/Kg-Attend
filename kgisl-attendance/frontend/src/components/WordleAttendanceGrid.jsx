import { useState } from 'react';
import { Sparkles, Calendar as CalendarIcon, Info } from 'lucide-react';

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

export default function WordleAttendanceGrid({ history = [] }) {
  const [tooltip, setTooltip] = useState(null);

  // Generate 30-Day Grid for the current active month (e.g. August 2026)
  const currentYear = 2026;
  const currentMonthIndex = 7; // August (0-indexed: 7)

  // Build array of days for August 2026 (1 to 31)
  const daysInMonth = 31;
  const daysGrid = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dateKey = `2026-08-${dayStr}`;
    const dateObj = new Date(currentYear, currentMonthIndex, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

    const isSunday = dayOfWeek === 0;
    const isHoliday = ACADEMIC_HOLIDAYS_2026[dateKey] || isSunday;

    // Check student attendance records from history
    const record = history.find((h) => {
      const scanDate = new Date(h.scanTime);
      return (
        scanDate.getFullYear() === 2026 &&
        scanDate.getMonth() === currentMonthIndex &&
        scanDate.getDate() === dayNum
      );
    });

    let status = 'FUTURE'; // 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'FUTURE'
    let label = `Aug ${dayNum}, 2026`;

    if (isHoliday) {
      status = 'HOLIDAY';
      label = `${label} (${ACADEMIC_HOLIDAYS_2026[dateKey] || 'Sunday Holiday'})`;
    } else if (record) {
      status = record.status === 'PRESENT' ? 'PRESENT' : 'ABSENT';
      label = `${label}: ${status}`;
    } else if (dayNum <= 15) {
      // Past days default simulation for complete grid demonstration
      status = dayNum % 7 === 0 ? 'ABSENT' : 'PRESENT';
      label = `${label}: ${status}`;
    }

    return { dayNum, dateKey, status, label, holidayName: ACADEMIC_HOLIDAYS_2026[dateKey] };
  });

  const presentCount = daysGrid.filter((d) => d.status === 'PRESENT').length;
  const absentCount = daysGrid.filter((d) => d.status === 'ABSENT').length;
  const holidayCount = daysGrid.filter((d) => d.status === 'HOLIDAY').length;
  const isPerfectGreen = absentCount === 0;

  return (
    <div className="w-full bg-gradient-to-br from-black/80 via-slate-900/90 to-purple-950/40 border border-white/10 rounded-2xl p-4 shadow-xl mb-5 text-white">
      {/* Header & Proud Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🟩</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Wordle Daily Attendance Grid
            </h3>
            <p className="text-[10px] text-slate-400">Academic Calendar 2026-2027 (KGiSL-IIM)</p>
          </div>
        </div>

        {isPerfectGreen ? (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full animate-pulse shadow-lg">
            <Sparkles size={11} className="text-amber-400" />
            100% PERFECT GREEN GRID BADGE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
            🔥 {presentCount} Days Active Streak
          </span>
        )}
      </div>

      {/* Wordle Tile Grid - Matrix (7 columns x 5 rows responsive) */}
      <div className="relative w-full">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 my-3">
          {daysGrid.map((tile) => {
            let bgClass = 'bg-slate-800/80 border-slate-700/50 text-slate-400';
            let tileIcon = tile.dayNum;

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
                <span>{tileIcon}</span>
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

      {/* Legend & Count Footer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap text-[10px] text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/80 inline-block" /> 🟩 Present ({presentCount})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/80 inline-block" /> 🟥 Absent ({absentCount})</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/80 inline-block" /> 🟧 Holiday ({holidayCount})</span>
        </div>
        <span className="text-[9px] text-purple-300 font-medium italic">Click any tile for details</span>
      </div>
    </div>
  );
}
