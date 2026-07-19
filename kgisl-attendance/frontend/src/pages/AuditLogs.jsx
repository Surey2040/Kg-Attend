import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { api } from '../services/api.js';
import { ShieldCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('LOGIN')) return 'text-signal-blue font-bold';
    if (action.includes('OVERRIDE') || action.includes('MANUAL')) return 'text-signal-red font-bold';
    if (action.includes('LEAVE') || action.includes('SUBSTITUTION')) return 'text-amber-500 font-bold';
    return 'text-signal-green font-bold';
  };

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full relative z-10">
        <TopBar connected={true} />
        
        <div className="px-4 md:px-8 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-blue/10 border border-signal-blue/20 text-signal-blue">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Audit Logs</h2>
              <p className="text-xs text-slate-400 font-medium">System-wide activity tracker</p>
            </div>
          </div>

          <div className="max-w-7xl glass-card rounded-2xl border border-ink-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ink-900/40 border-b border-ink-border/50">
                    <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Actor</th>
                    <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Action</th>
                    <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-300 uppercase tracking-wider">IP / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/30">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Loading logs...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No audit logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm whitespace-nowrap text-slate-300 font-medium">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm">
                          <span className="px-2 py-1 bg-signal-blue/20 border border-signal-blue/30 rounded text-xs text-signal-blue font-bold">
                            {log.actorType}
                          </span>
                          <span className="ml-2 text-slate-200 font-semibold text-xs">{log.actorLabel || log.actorId || 'System'}</span>
                          {log.actorName && (
                            <span className="ml-1 text-slate-500 text-xs">({log.actorName})</span>
                          )}
                        </td>
                        <td className={`p-4 text-sm ${getActionColor(log.action)}`}>
                          {log.action}
                        </td>
                        <td className="p-4 text-sm font-bold">
                          {log.success ? (
                            <span className="text-signal-green">Success</span>
                          ) : (
                            <span className="text-signal-red">Failed {log.reasonCode && `(${log.reasonCode})`}</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-400 text-xs font-medium">
                          <span className="text-slate-300">{log.ip || 'Unknown IP'}</span><br/>
                          <span className="text-[10px] truncate max-w-[200px] block opacity-70" title={log.userAgent}>{log.userAgent || 'Unknown Device'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
