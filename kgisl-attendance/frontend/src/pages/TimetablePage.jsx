import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { CalendarDays } from 'lucide-react';

const PERIODS = [
  { name: 'First', time: '9:10 AM - 10:00 AM' },
  { name: 'Second', time: '10:00 AM - 10:50 AM' },
  { name: 'Third', time: '11:10 AM - 12:00 PM' },
  { name: 'Fourth', time: '12:00 PM - 12:50 PM' },
  { name: 'Fifth', time: '1:40 PM - 2:30 PM' },
  { name: 'Sixth', time: '2:30 PM - 3:20 PM' },
  { name: 'Seven', time: '3:30 PM - 4:20 PM' },
];

const TIMETABLE_ROWS = [
  {
    day: 'I',
    periods: ['33-B\nSURENDREN', '33-B\nSURENDREN', '3-EA\nDr.YEMUNARANE', '3-EA\nDr.YEMUNARANE', 'Plac\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE'],
  },
  {
    day: 'II',
    periods: ['33-A\nR.G', '33-A\nR.G', '33C\nSARANYA', '33C\nSARANYA', 'Plac\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE'],
  },
  {
    day: 'III',
    periods: ['33-P\nR.G', '33-P\nR.G', '33-P\nR.G', '33-A\nR.G', 'Plac\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE'],
  },
  {
    day: 'IV',
    periods: ['33D\nDr.YEMUNARANE', '33D\nDr.YEMUNARANE', '33D\nDr.YEMUNARANE', '33C\nSARANYA', 'Plac\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE'],
  },
  {
    day: 'V',
    periods: ['33-Q\nSURENDREN', '33-Q\nSURENDREN', '33-Q\nSURENDREN', '33-B\nSURENDREN', 'Plac\nDr.YEMUNARANE', 'Plac\nDr.YEMUNARANE', 'TECH\nDr.YEMUNARANE'],
  },
];

const SUBJECTS_INFO = [
  { sno: 1, code: 'Plac', name: 'Aptitude and Communication', short: 'Plac', marks: 100, hours: 6, staff: 'Yemunarane Kumaravel', initial: 'Dr.YEMUNARANE' },
  { sno: 2, code: 'Tech', name: 'Technical', short: 'TECH', marks: 100, hours: 9, staff: 'Yemunarane Kumaravel', initial: 'Dr.YEMUNARANE' },
  { sno: 3, code: '33Q', name: 'Artificial Intelligence and Machine Learning Lab', short: '33-Q', marks: 100, hours: 3, staff: 'D Surendren', initial: 'SURENDREN' },
  { sno: 4, code: '33P', name: 'Open Source Computing Lab', short: '33-P', marks: 100, hours: 3, staff: 'Gomathi R', initial: 'R.G' },
  { sno: 5, code: '33B', name: 'Artificial Intelligence and Machine Learning (33B)', short: '33-B', marks: 100, hours: 3, staff: 'D Surendren', initial: 'SURENDREN' },
  { sno: 6, code: '3EA', name: 'PHP Programming - 3EA', short: '3-EA', marks: 100, hours: 2, staff: 'Yemunarane Kumaravel', initial: 'Dr.YEMUNARANE' },
  { sno: 7, code: '33A', name: 'Open Source Computing (33A)', short: '33-A', marks: 100, hours: 3, staff: 'Gomathi R', initial: 'R.G' },
  { sno: 8, code: '33C', name: 'Network security and cryptography', short: '33C', marks: 100, hours: 3, staff: 'Saranya S', initial: 'SARANYA' },
  { sno: 9, code: '33D', name: 'Cloud Computing', short: '33D', marks: 100, hours: 3, staff: 'Yemunarane Kumaravel', initial: 'Dr.YEMUNARANE' },
];

export default function TimetablePage() {
  return (
    <div className="flex h-full w-full bg-transparent overflow-hidden">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full">
        <TopBar connected={true} />

        <div className="px-8 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-amber/10 border border-signal-amber/20 text-signal-amber">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Department Timetable</h2>
              <p className="text-sm text-slate-400">Class schedule & subject hours distribution</p>
            </div>
          </div>

          {/* Timetable Grid Table */}
          <div className="rounded-2xl glass-card overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="glass-table text-center">
                <thead>
                  <tr className="border-b border-ink-border bg-ink-900 text-slate-400 font-semibold">
                    <th className="px-4 py-5 border-r border-ink-border/50">Day Order / Period</th>
                    {PERIODS.map((p, idx) => (
                      <th key={idx} className="px-4 py-3 border-r border-ink-border/50 last:border-r-0 leading-tight">
                        <div className="text-white font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.time}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/50">
                  {TIMETABLE_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-ink-800/20 transition-colors">
                      <td className="px-4 py-5 bg-ink-900/40 text-white font-bold border-r border-ink-border/50 font-display">
                        {row.day}
                      </td>
                      {row.periods.map((cell, cidx) => {
                        const [code, teacher] = cell.split('\n');
                        return (
                          <td key={cidx} className="px-4 py-4 border-r border-ink-border/50 last:border-r-0 leading-tight">
                            <span className="font-semibold text-slate-200 block text-xs">{code}</span>
                            <span className="text-[10px] text-slate-500 block mt-1 font-medium">{teacher}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects Details reference */}
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Subject References</h3>
            <div className="overflow-x-auto">
              <table className="glass-table">
                <thead>
                  <tr className="border-b border-ink-border text-slate-400 font-semibold">
                    <th className="pb-3 pr-4">S.No</th>
                    <th className="pb-3 px-4">Subject Code</th>
                    <th className="pb-3 px-4">Subject Name</th>
                    <th className="pb-3 px-4">Short</th>
                    <th className="pb-3 px-4 text-center">Marks</th>
                    <th className="pb-3 px-4 text-center">Hours/Week</th>
                    <th className="pb-3 pl-4">Staff Handled By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/40">
                  {SUBJECTS_INFO.map((sub) => (
                    <tr key={sub.sno} className="hover:bg-ink-800/10 transition-colors">
                      <td className="py-3 pr-4 text-slate-500 font-mono">{sub.sno}</td>
                      <td className="py-3 px-4 font-mono text-signal-amber font-semibold">{sub.code}</td>
                      <td className="py-3 px-4 text-white font-medium">{sub.name}</td>
                      <td className="py-3 px-4 text-slate-400 font-semibold">{sub.short}</td>
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{sub.marks}</td>
                      <td className="py-3 px-4 text-center text-slate-400 font-mono font-semibold">{sub.hours}</td>
                      <td className="py-3 pl-4 text-slate-300">
                        {sub.staff} <span className="text-[10px] text-slate-500 ml-1 font-mono">({sub.initial})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
