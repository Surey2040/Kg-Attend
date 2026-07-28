import { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Mail, Printer, Calendar, ShieldCheck, 
  RefreshCw, Users, FileSpreadsheet, Send, Search, Sparkles
} from 'lucide-react';
import { getFacultyMonthlySignatures, sendFacultySignatureEmail, listBatches } from '../services/api';

export default function MonthlySignatureAuditView({ user }) {
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Email status
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);

  // Load Batches
  useEffect(() => {
    listBatches()
      .then(b => {
        setBatches(b || []);
        if (b && b.length > 0) {
          setSelectedBatchId(b[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load Monthly Signatures Audit Data
  const loadAuditData = () => {
    setLoading(true);
    setError('');
    getFacultyMonthlySignatures(selectedBatchId, selectedMonth)
      .then(data => {
        setAuditData(data);
      })
      .catch(err => {
        setError(err?.message || 'Could not load monthly signature report.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAuditData();
  }, [selectedBatchId, selectedMonth]);

  // Trigger Email Dispatch to Faculty
  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailNotice(null);
    try {
      const res = await sendFacultySignatureEmail(selectedBatchId, selectedMonth, user?.email);
      setEmailNotice({
        type: 'success',
        message: res.message || `Signature audit report emailed to ${user?.email || 'faculty'}`,
      });
    } catch (err) {
      setEmailNotice({
        type: 'error',
        message: err?.message || 'Failed to dispatch email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Trigger Native Print / PDF Download
  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = (auditData?.students || []).filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-[#09090b] border border-white/10 rounded-2xl p-5 md:p-6 space-y-6 shadow-2xl">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-purple-400" size={22} />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Monthly Student Attendance Signatures Audit
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Section-wise digital signatures, attendance verification & automated faculty reports
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-black/60 border border-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="July 2026">July 2026 (Current)</option>
            <option value="June 2026">June 2026</option>
            <option value="May 2026">May 2026</option>
          </select>

          {/* Batch / Section Dropdown */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-black/60 border border-white/15 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Email Button */}
          <button
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
          >
            {isSendingEmail ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Send Report to Email
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
          >
            <Printer size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Email Status Notification Banner */}
      {emailNotice && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
          emailNotice.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{emailNotice.message}</span>
          <button onClick={() => setEmailNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Summary KPI Tiles */}
      {auditData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-400">Class Section</p>
            <p className="text-base font-bold text-white truncate">{auditData.batchName}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5">
            <p className="text-[11px] text-slate-400">Total Students</p>
            <p className="text-base font-bold text-white">{auditData.totalStudents}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5">
            <p className="text-[11px] text-emerald-300">Signed Students</p>
            <p className="text-base font-bold text-emerald-400">{auditData.signedCount}</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
            <p className="text-[11px] text-amber-300">Pending Signatures</p>
            <p className="text-base font-bold text-amber-400">{auditData.pendingCount}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Roll No or Student Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <p className="text-xs text-slate-500">
          Showing {filteredStudents.length} of {auditData?.totalStudents || 0} students
        </p>
      </div>

      {/* Main Student Signatures Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
          Loading monthly student signatures from database...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-400 text-xs">
          {error}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No student signatures match your query.
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Handwritten Signature</th>
                <th className="py-3 px-4 text-center">Date & Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-200">
              {filteredStudents.map((student) => (
                <tr key={student.id || student.rollNo} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{student.rollNo}</td>
                  <td className="py-3 px-4 font-medium">{student.studentName}</td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span className={student.attendancePercentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}>
                      {student.attendancePercentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {student.status === 'SIGNED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 size={12} /> SIGNED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <XCircle size={12} /> PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {student.signatureDataUrl ? (
                      <div className="inline-block p-1.5 rounded-lg bg-black border border-white/10">
                        <img
                          src={student.signatureDataUrl}
                          alt={`${student.studentName} Signature`}
                          className="h-10 max-w-[140px] object-contain filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Not signed yet</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-slate-400 font-mono">
                    {student.signedAt ? (
                      <div>
                        <div>{student.signedAt}</div>
                        <div className="text-purple-400 text-[9px] truncate max-w-[120px] mx-auto">{student.hash}</div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
