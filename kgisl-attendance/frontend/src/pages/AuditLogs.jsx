import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { api } from '../services/api.js';

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
    if (action.includes('LOGIN')) return 'text-signal-blue';
    if (action.includes('OVERRIDE') || action.includes('MANUAL')) return 'text-signal-red';
    if (action.includes('LEAVE') || action.includes('SUBSTITUTION')) return 'text-amber-500';
    return 'text-signal-green';
  };

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar title="Audit Logs" subtitle="System-wide activity tracker" />
        
        <div className="p-6 max-w-7xl">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/10 border-b border-white/10">
                    <th className="p-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Timestamp</th>
                    <th className="p-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Actor</th>
                    <th className="p-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Action</th>
                    <th className="p-4 text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-white/70 uppercase tracking-wider">IP / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-white/50">Loading logs...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-white/50">No audit logs found.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm whitespace-nowrap text-white/60">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm">
                          <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80 font-medium">
                            {log.actorType}
                          </span>
                          <span className="ml-2 text-white/60 text-xs">{log.actorId || 'System'}</span>
                        </td>
                        <td className={`p-4 text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </td>
                        <td className="p-4 text-sm">
                          {log.success ? (
                            <span className="text-signal-green">Success</span>
                          ) : (
                            <span className="text-signal-red">Failed {log.reasonCode && `(${log.reasonCode})`}</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-white/50 text-xs">
                          {log.ip || 'Unknown IP'}<br/>
                          <span className="text-[10px] truncate max-w-[200px] block" title={log.userAgent}>{log.userAgent || 'Unknown Device'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
