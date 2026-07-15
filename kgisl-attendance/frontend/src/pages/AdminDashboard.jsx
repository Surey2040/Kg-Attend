import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('faculty');

  const renderContent = () => {
    switch (activeTab) {
      case 'faculty':
        return <MasterDataForm title="Add Faculty" endpoint="/admin/faculty" fields={['name', 'email', 'password']} />;
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
    <div className="flex h-full w-full bg-[#0a0a0a] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopBar title="Admin Dashboard" subtitle="Master Data Management" />
        <div className="p-6 max-w-4xl">
          <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
            {['faculty', 'students', 'batches', 'subjects', 'rooms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-[#465fff] text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function MasterDataForm({ title, endpoint, fields }) {
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus('Saving...');
      // Convert numeric fields
      const payload = { ...formData };
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
      if (payload.geofenceRadiusM) payload.geofenceRadiusM = parseInt(payload.geofenceRadiusM, 10);
      
      await api.post(endpoint, payload);
      setStatus('Success!');
      setFormData({});
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-xl font-semibold mb-4 text-white/90">{title}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f}>
            <label className="block text-sm text-white/60 mb-1 capitalize">{f}</label>
            <input
              type={f.includes('password') ? 'password' : 'text'}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#465fff]"
              value={formData[f] || ''}
              onChange={(e) => setFormData({ ...formData, [f]: e.target.value })}
              required
            />
          </div>
        ))}
        <button type="submit" className="px-6 py-3 bg-[#465fff] hover:bg-[#3b50d9] text-white rounded-xl font-medium transition-all">
          Save
        </button>
        {status && <p className="text-sm mt-2 text-white/70">{status}</p>}
      </form>
    </div>
  );
}
