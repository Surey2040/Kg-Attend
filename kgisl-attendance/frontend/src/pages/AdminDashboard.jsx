import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import RecentScans from '../components/RecentScans.jsx';
import { api, getTodayScans } from '../services/api.js';
import { getSocket, disconnectSocket } from '../services/socket.js';
import { Database, PlusCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  // We exclude 'faculty' here since there is a dedicated rich AddFacultyPage
  const [activeTab, setActiveTab] = useState('batches');
  const [scans, setScans] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    getTodayScans()
      .then((data) => {
        if (data && data.length > 0) {
          setScans(data);
        }
      })
      .catch((err) => console.error('Failed to load recent scans:', err));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_admin_live');
    });
    
    socket.on('disconnect', () => setConnected(false));

    socket.on('attendance_marked', (data) => {
      setScans((prev) => [data, ...prev].slice(0, 100)); // Keep last 100
    });

    socket.on('geofence_violation', (data) => {
      setScans((prev) => [{ ...data, isViolation: true }, ...prev].slice(0, 100));
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return <MasterDataForm title="Add Student" endpoint="/admin/students" fields={['name', 'rollNo', 'batchId', 'email', 'password']} />;
      case 'batches':
        return <MasterDataForm title="Add Batch" endpoint="/admin/batches" fields={['name']} />;
      case 'subjects':
        return <MasterDataForm title="Add Subject" endpoint="/admin/subjects" fields={['name', 'code']} />;
      case 'rooms':
        return <MasterDataForm title="Add Room" endpoint="/admin/rooms" fields={['name', 'latitude', 'longitude', 'geofenceRadiusM']} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto scroll-smooth pb-10 h-full relative z-10">
        <TopBar connected={connected} />

        <div className="px-8 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-blue/10 border border-signal-blue/20 text-signal-blue">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Master Data</h2>
              <p className="text-xs text-slate-400 font-medium">Manage system records and metadata</p>
            </div>
          </div>

          <div className="flex gap-3 mb-8 border-b border-ink-border/50 pb-4 overflow-x-auto">
            {['batches', 'subjects', 'rooms', 'students'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-signal-blue text-white shadow-lg shadow-signal-blue/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
            <div className="max-w-xl">
              {renderContent()}
            </div>
            <div className="hidden xl:block h-full">
              <RecentScans scans={scans} />
            </div>
            
            {/* Show below on smaller screens */}
            <div className="xl:hidden w-full max-w-xl mt-4">
              <RecentScans scans={scans} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MasterDataForm({ title, endpoint, fields }) {
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus('Saving...');
      setError('');
      // Convert numeric fields
      const payload = { ...formData };
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
      if (payload.geofenceRadiusM) payload.geofenceRadiusM = parseInt(payload.geofenceRadiusM, 10);
      
      await api.post(endpoint, payload);
      setStatus('Success!');
      setFormData({});
    } catch (err) {
      setStatus('');
      setError(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-ink-border/50">
      <div className="flex items-center gap-2 mb-6">
        <PlusCircle size={18} className="text-signal-blue" />
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-signal-red/30 bg-signal-red/10 px-3.5 py-3 text-xs text-red-300 mb-5">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {status === 'Success!' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-signal-green/30 bg-signal-green/10 px-3.5 py-3 text-xs text-signal-green mb-5">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <p>Record created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {f.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type={f.toLowerCase().includes('password') ? 'password' : 'text'}
              className="w-full px-4 py-2.5 glass-input text-sm text-white"
              value={formData[f] || ''}
              onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
              required
              placeholder={`Enter ${f.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
            />
          </div>
        ))}
        
        <button 
          type="submit" 
          disabled={status === 'Saving...'}
          className="w-full py-3 mt-6 bg-signal-blue text-white glass-btn text-sm flex items-center justify-center font-bold"
        >
          {status === 'Saving...' ? 'Saving...' : 'Save Record'}
        </button>
      </form>
    </div>
  );
}
