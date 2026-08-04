import { useState, useEffect } from 'react';
import { Calendar, Save, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function AdminAcademicYearConfig() {
  const [academicYear, setAcademicYear] = useState('2026-2027 ODD Semester');
  const [totalWorkingDays, setTotalWorkingDays] = useState(90);
  const [startDate, setStartDate] = useState('2026-06-04');
  const [endDate, setEndDate] = useState('2026-11-30');
  const [notes, setNotes] = useState('Official KGiSL-IIM Academic Calendar odd semester 2026-2027');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadConfig = () => {
    setLoading(true);
    api.get('/admin/academic-year-config')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const cfg = res.data.data;
          setAcademicYear(cfg.academicYear || '2026-2027 ODD Semester');
          setTotalWorkingDays(cfg.totalWorkingDays || 90);
          setStartDate(cfg.startDate || '2026-06-04');
          setEndDate(cfg.endDate || '2026-11-30');
          setNotes(cfg.notes || '');
        }
      })
      .catch((err) => {
        console.error('Error fetching academic year config:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      academicYear,
      totalWorkingDays: Number(totalWorkingDays),
      startDate,
      endDate,
      notes,
    };

    api.post('/admin/academic-year-config', payload)
      .then((res) => {
        if (res.data?.success) {
          setMessage(`🎉 Academic Year & Working Days successfully updated! All student attendance tally % updated.`);
          loadConfig();
        } else {
          setError(res.data?.message || 'Failed to update academic config.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Error saving academic year config.');
      });
  };

  return (
    <div className="w-full bg-[#09090b]/90 border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
          <Layers size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Academic Year & Calendar Working Days Config</h2>
          <p className="text-xs text-slate-400">
            Set active Academic Year and Total Working Days (All student attendance percentages will tally against this value)
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSaveConfig} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Year Label</label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2026-2027 ODD Semester"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Total Academic Calendar Working Days (Denominator Formula)
          </label>
          <input
            type="number"
            value={totalWorkingDays}
            onChange={(e) => setTotalWorkingDays(e.target.value)}
            placeholder="90"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none font-bold text-emerald-400 text-base"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Formula applied for every student: <span className="text-purple-300 font-semibold">(Attended Days / {totalWorkingDays}) * 100</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Semester Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Semester End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Calendar Description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-600/30 transition-all duration-200"
          >
            <Save size={16} />
            Save & Recalculate Attendance Tally
          </button>
        </div>
      </form>
    </div>
  );
}
