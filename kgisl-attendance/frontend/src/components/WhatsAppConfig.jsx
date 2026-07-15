import { useState, useEffect, useRef } from 'react';
import { getWhatsAppQr, getWhatsAppStatus, sendWhatsAppMessage } from '../services/api';
import { MessageCircle, Smartphone, SmartphoneNfc, AlertCircle, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export default function WhatsAppConfig() {
  const [status, setStatus] = useState({ state: 'CONNECTING', phone: null, uptime: null });
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from KGiSL Attendance System! 👋');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const pollInterval = useRef(null);

  const fetchStatusAndQr = async () => {
    try {
      const qrRes = await getWhatsAppQr();
      
      if (qrRes.code === 'ALREADY_AUTHENTICATED') {
        setStatus({ state: qrRes.data.state, phone: qrRes.data.phone });
        setQrCode(null);
        setLoading(false);
        setError(null);
      } else if (qrRes.code === 'QR_READY') {
        setStatus({ state: qrRes.data.state });
        setQrCode(qrRes.data.qrDataUrl);
        setLoading(false);
        setError(null);
      } else if (qrRes.code === 'QR_NOT_READY') {
        setStatus({ state: qrRes.data.state });
        setQrCode(null);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
      // Fallback to just fetching status if QR endpoint fails
      try {
        const statRes = await getWhatsAppStatus();
        setStatus(statRes);
        setError(null);
      } catch (err2) {
        setError('Failed to connect to backend WhatsApp service.');
      }
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(() => {
      fetchStatusAndQr();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  useEffect(() => {
    fetchStatusAndQr();
    startPolling();
    return stopPolling;
  }, []);

  // Stop polling once ready/authenticated
  useEffect(() => {
    if (status.state === 'READY' || status.state === 'AUTHENTICATED') {
      stopPolling();
    } else {
      if (!pollInterval.current) startPolling();
    }
  }, [status.state]);

  const handleTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;
    
    setSending(true);
    setSendResult(null);
    try {
      await sendWhatsAppMessage({ phone: testPhone, message: testMessage });
      setSendResult({ success: true, message: 'Message sent successfully!' });
      setTimeout(() => setSendResult(null), 3000);
    } catch (err) {
      setSendResult({ 
        success: false, 
        message: err.response?.data?.message || err.message || 'Failed to send message' 
      });
    } finally {
      setSending(false);
    }
  };

  const getStateColor = () => {
    switch (status.state) {
      case 'READY':
      case 'AUTHENTICATED':
        return 'text-signal-green bg-signal-green/10 border-signal-green/20';
      case 'QR_READY':
        return 'text-signal-blue bg-signal-blue/10 border-signal-blue/20';
      case 'CONNECTING':
        return 'text-signal-amber bg-signal-amber/10 border-signal-amber/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const renderContent = () => {
    if (loading && !status.state) {
      return (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <RefreshCw className="animate-spin text-slate-500" size={24} />
          <p className="text-sm text-slate-400">Connecting to WhatsApp Service...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-signal-red/5 rounded-xl border border-signal-red/10">
          <AlertCircle className="text-signal-red" size={32} />
          <p className="text-sm text-red-300 text-center max-w-xs">{error}</p>
          <button 
            onClick={fetchStatusAndQr}
            className="px-4 py-2 mt-2 bg-ink-900 border border-ink-border rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Retry
          </button>
        </div>
      );
    }

    if (status.state === 'READY' || status.state === 'AUTHENTICATED') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6 bg-signal-green/5 border border-signal-green/10 rounded-xl space-y-3">
            <div className="h-16 w-16 bg-signal-green/10 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-signal-green" />
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold mb-1">WhatsApp is Connected</h4>
              <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                <Smartphone size={12} /> {status.phone || 'Ready'}
              </p>
            </div>
            {status.uptime !== null && (
              <span className="text-[10px] uppercase tracking-wider text-signal-green/70 font-semibold px-3 py-1 bg-signal-green/10 rounded-full">
                Uptime: {Math.floor(status.uptime / 60)} mins
              </span>
            )}
          </div>

          <div className="bg-ink-900 border border-ink-border rounded-xl p-4">
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageCircle size={14} /> Send Test Message
            </h5>
            <form onSubmit={handleTestMessage} className="space-y-3">
              <input
                type="text"
                placeholder="Phone Number (e.g. 919876543210)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-2 glass-input text-sm"
                required
              />
              <textarea
                placeholder="Message body"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 glass-input text-sm resize-none"
                rows={2}
                required
              />
              
              {sendResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${sendResult.success ? 'bg-signal-green/10 text-signal-green border border-signal-green/20' : 'bg-signal-red/10 text-signal-red border border-signal-red/20'}`}>
                  {sendResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {sendResult.message}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-2 bg-white text-ink-950 font-bold glass-btn text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (status.state === 'QR_READY' && qrCode) {
      return (
        <div className="flex flex-col items-center justify-center py-4 space-y-5">
          <p className="text-sm text-slate-400 text-center max-w-xs leading-relaxed">
            Scan this QR code using the WhatsApp app on your phone to connect the attendance system.
          </p>
          <div className="p-3 bg-white rounded-xl shadow-lg border-4 border-ink-800">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 rounded-lg" />
          </div>
          <div className="flex items-center gap-2 text-xs text-signal-blue font-medium bg-signal-blue/10 px-4 py-2 rounded-lg border border-signal-blue/20">
            <RefreshCw className="animate-spin" size={14} />
            Waiting for scan...
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="h-16 w-16 bg-ink-900 border border-ink-border rounded-full flex items-center justify-center">
          <RefreshCw className="animate-spin text-slate-500" size={24} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white mb-1">Starting WhatsApp Engine</p>
          <p className="text-xs text-slate-500">Generating QR code for pairing...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
            <MessageCircle size={18} />
          </div>
          <h3 className="text-lg font-bold text-white">WhatsApp Integration</h3>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getStateColor()}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${status.state === 'READY' || status.state === 'AUTHENTICATED' ? 'bg-signal-green' : 'bg-current'}`} />
          {status.state.replace('_', ' ')}
        </div>
      </div>

      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}
