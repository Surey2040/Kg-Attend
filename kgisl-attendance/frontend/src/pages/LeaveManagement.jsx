import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LeaveManagement() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState({
    type: 'LEAVE',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchRequests();
  }, [user.role]);

  const fetchRequests = async () => {
    try {
      const endpoint = user.role === 'STUDENT' ? '/leave/my-requests' : '/leave/pending';
      const res = await api.get(endpoint);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    try {
      setStatus('Submitting...');
      await api.post('/leave/my-requests', formData);
      setStatus('Success');
      setFormData({ type: 'LEAVE', fromDate: '', toDate: '', reason: '' });
      fetchRequests();
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const reviewLeave = async (id, statusToSet) => {
    try {
      await api.post(`/leave/${id}/review`, { status: statusToSet, reviewNote: 'Reviewed via dashboard' });
      fetchRequests();
    } catch (err) {
      console.error('Review failed', err);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar title="Leave Management" subtitle={user.role === 'STUDENT' ? 'Apply for leave' : 'Review pending leaves'} />
        <div className="p-6 max-w-4xl space-y-6">
          
          {user.role === 'STUDENT' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white/90">Apply for Leave / On-Duty</h3>
              <form onSubmit={submitLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Type</label>
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="LEAVE">Leave</option>
                      <option value="ON_DUTY">On Duty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Reason</label>
                  <textarea
                    required
                    rows="3"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-[#465fff] hover:bg-[#3b50d9] text-white rounded-xl font-medium transition-all">
                  Submit Request
                </button>
                {status && <p className="text-sm mt-2 text-white/70">{status}</p>}
              </form>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-white/90">
              {user.role === 'STUDENT' ? 'My Requests' : 'Pending Requests'}
            </h3>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-white/50">No requests found.</p>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="p-4 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
                    <div>
                      {user.role !== 'STUDENT' && <p className="font-medium text-white">{req.student?.name} ({req.student?.rollNo})</p>}
                      <p className="text-sm text-white/70">
                        <span className="font-semibold text-[#465fff]">{req.type}</span> &bull; {new Date(req.fromDate).toLocaleDateString()} to {new Date(req.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-white/50 mt-1">{req.reason}</p>
                    </div>
                    <div>
                      {user.role === 'STUDENT' ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                          req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {req.status}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => reviewLeave(req.id, 'APPROVED')} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors">
                            Approve
                          </button>
                          <button onClick={() => reviewLeave(req.id, 'REJECTED')} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
