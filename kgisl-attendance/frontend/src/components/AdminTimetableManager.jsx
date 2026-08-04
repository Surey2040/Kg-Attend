import { useState, useEffect } from 'react';
import { Clock, Calendar, Users, BookOpen, MapPin, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AdminTimetableManager() {
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [facultyId, setFacultyId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1); // 1 = Mon, 5 = Fri
  const [startTime, setStartTime] = useState('09:10');
  const [endTime, setEndTime] = useState('10:00');

  const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
  ];

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/faculty'),
      api.get('/faculty/subjects'),
      api.get('/faculty/batches'),
      api.get('/faculty/rooms'),
      api.get('/timetable'),
    ])
      .then(([facRes, subRes, batRes, roomRes, ttRes]) => {
        if (facRes.data?.data) setFaculties(facRes.data.data);
        if (subRes.data?.data) setSubjects(subRes.data.data);
        if (batRes.data?.data) setBatches(batRes.data.data);
        if (roomRes.data?.data) setRooms(roomRes.data.data);
        if (ttRes.data?.data) setAllocations(ttRes.data.data);
      })
      .catch((err) => {
        console.error('Error loading master data:', err);
        setError('Failed to load master data for timetable.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignTimetable = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!facultyId || !subjectId || !batchId || !roomId) {
      setError('Please select Faculty, Subject, Batch, and Room.');
      return;
    }

    const selectedFaculty = faculties.find((f) => f.id === facultyId);
    const selectedSubject = subjects.find((s) => s.id === subjectId);
    const selectedBatch = batches.find((b) => b.id === batchId);
    const selectedRoom = rooms.find((r) => r.id === roomId);

    const payload = [
      {
        facultyEmail: selectedFaculty.email,
        subjectCode: selectedSubject.code,
        batchName: selectedBatch.name,
        roomName: selectedRoom.name,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      },
    ];

    api.post('/timetable/import', payload)
      .then((res) => {
        if (res.data?.success) {
          setMessage(`🎉 Period successfully assigned to ${selectedFaculty.name} for ${selectedBatch.name}!`);
          loadData();
        } else {
          setError(res.data?.message || 'Assignment failed.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to assign timetable.');
      });
  };

  return (
    <div className="w-full bg-[#09090b]/90 border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
          <Calendar size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Admin Timetable & Faculty Period Allocation</h2>
          <p className="text-xs text-slate-400">
            Assign timetable periods to faculties for 1st Year (2026 Batch) & 2nd Year (2025 Batch)
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

      <form onSubmit={handleAssignTimetable} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Select Faculty</label>
          <select
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose Faculty --</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Student Batch</label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose Batch --</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (e.g. 1st Year / 2nd Year)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Course</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Classroom / Lab Venue</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose Room --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Day of Week</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {DAYS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="09:10"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="10:00"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
          >
            <Plus size={16} />
            Assign Period to Faculty Timetable
          </button>
        </div>
      </form>

      {/* Allocated Timetable Overview List */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
          <span>Active Allocated Periods ({allocations.length})</span>
          <span className="text-[10px] text-slate-400 font-normal">Synced across all Faculty Dashboards</span>
        </h3>

        {allocations.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No periods assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-slate-400 font-bold bg-white/5">
                  <th className="p-3">Faculty</th>
                  <th className="p-3">Batch (Year)</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Day & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-semibold text-white">{a.faculty?.name || fEmail}</td>
                    <td className="p-3">
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {a.batch?.name}
                      </span>
                    </td>
                    <td className="p-3 text-indigo-300">{a.subject?.name} ({a.subject?.code})</td>
                    <td className="p-3">{a.room?.name}</td>
                    <td className="p-3 font-medium text-emerald-400">
                      Day {a.dayOfWeek} ({a.startTime} - {a.endTime})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
