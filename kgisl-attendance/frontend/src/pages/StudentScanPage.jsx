import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';
import { CheckCircle2, XCircle, ScanLine, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { submitScan, getSessionPublicInfo } from '../services/api.js';

// Simple stable per-browser device fingerprint (persisted locally) used as
// the `deviceId` the backend cross-checks against the student's bound device.
function getDeviceId() {
  let id = localStorage.getItem('kgisl_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('kgisl_device_id', id);
  }
  return id;
}

export default function StudentScanPage() {
  const { user, logout } = useAuth();
  const webcamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const rafRef = useRef(null);
  const scanningLockRef = useRef(false);

  const [status, setStatus] = useState('idle'); // idle | scanning | submitting | success | error
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');

  const stopScanning = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleDecoded = useCallback(
    async (rawValue) => {
      if (scanningLockRef.current) return;
      scanningLockRef.current = true;
      stopScanning();
      setStatus('submitting');
      setMessage('Verifying your location…');

      try {
        const qrPayload = JSON.parse(rawValue);

        // The QR itself deliberately never carries batch/subject (see backend
        // spec: "QR must NEVER contain attendance information"). We only know
        // the sessionId at this point, so we look up the non-sensitive
        // batch/subject the session belongs to before submitting the scan.
        const { data: sessionInfo } = await getSessionPublicInfo(qrPayload.sessionId);

        const gps = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
            () => reject(new Error('Location permission is required to mark attendance.')),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });

        await submitScan({
          deviceId: getDeviceId(),
          gpsLat: gps.lat,
          gpsLng: gps.lng,
          gpsAccuracy: gps.accuracy,
          qrPayload: qrPayload,
        });

        setStatus('success');
        setMessage('Attendance marked successfully.');
      } catch (err) {
        setStatus('error');
        let errorMsg = err.message || 'Could not mark attendance. Try scanning again.';
        
        const errCode = err.response?.data?.code || err.code;
        const errMsg = err.response?.data?.message || err.message;

        if (errCode) {
          if (errCode === 'OUTSIDE_GEOFENCE' || errCode === 'GEOFENCE_REJECTED') {
            errorMsg = 'Attendance rejected. You are outside the allowed attendance location.';
          } else if (errCode === 'POOR_GPS_ACCURACY') {
            errorMsg = 'Location accuracy is too low. Please move to an open area and try again.';
          } else if (errCode === 'INVALID_GPS' || errCode === 'GPS_REQUIRED') {
            errorMsg = 'Unable to access your live location. Enable GPS and try again.';
          } else if (errCode === 'INTERNAL_ERROR') {
            errorMsg = 'Database connection issue. Please connect to a VPN or non-blocked network and try again.';
          } else {
            errorMsg = errMsg || errorMsg;
          }
        }
        setMessage(errorMsg);
      } finally {
        scanningLockRef.current = false;
      }
    },
    [stopScanning, user]
  );

  const tick = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;
    const video = webcam.video;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data) {
        handleDecoded(code.data);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecoded]);

  const handleUserMedia = useCallback(() => {
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const handleUserMediaError = useCallback((err) => {
    console.error('Camera media error:', err);
    let msg = 'Camera access is required to scan the attendance QR.';
    if (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please click the camera/lock icon in your browser address bar to allow camera access, and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Your camera is already being used by another application or tab.';
      } else {
        msg = `Camera error (${err.name}): ${err.message || 'Access failed.'}`;
      }
    }
    setCameraError(msg);
    setStatus('idle');
  }, []);

  function startScanning() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isHttp = window.location.protocol === 'http:';
      const isNotLocalhost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      
      if (isHttp && isNotLocalhost) {
        setCameraError(
          `Camera blocked: Browser restricts camera access to secure contexts (HTTPS). ` +
          `Since you are accessing via IP (${window.location.hostname}), please use HTTPS, tunnel via Ngrok, or test on localhost.`
        );
      } else {
        setCameraError('Camera API is not supported or is blocked by your browser/device settings.');
      }
      setStatus('idle');
      return;
    }
    setStatus('scanning');
    setMessage('');
    setCameraError('');
  }

  useEffect(() => stopScanning, [stopScanning]);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-medium text-slate-200">{user?.name}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300">
            <LogOut size={13} /> Sign out
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-ink-border bg-ink-850/60 shadow-card p-6">
          <h1 className="font-display text-xl font-semibold text-white">Mark Attendance</h1>
          <p className="mt-1 text-sm text-slate-400">Scan the live QR shown by your faculty.</p>

          <div className="mt-6 scan-frame relative mx-auto w-full aspect-square max-w-[280px] overflow-hidden rounded-2xl bg-black">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />

            {status === 'scanning' ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'environment' }}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                className="h-full w-full object-cover animate-[fadeIn_0.5s_ease]"
                playsInline
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
                <ScanLine size={36} className="text-slate-600" />
              </div>
            )}

            {status === 'scanning' && (
              <div className="sweep animate-scanline" style={{ animationDuration: '2.4s' }} />
            )}
          </div>

          {cameraError && <p className="mt-4 text-xs text-signal-red">{cameraError}</p>}

          {status === 'idle' && (
            <button
              onClick={startScanning}
              className="mt-6 w-full rounded-lg bg-signal-red py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Start Scanning
            </button>
          )}

          {status === 'submitting' && (
            <p className="mt-6 text-center text-sm text-slate-400 animate-pulse">{message}</p>
          )}

          {status === 'success' && (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-signal-green/30 bg-signal-green/10 px-4 py-4 text-center">
              <CheckCircle2 size={22} className="text-signal-green" />
              <p className="text-sm text-signal-green">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-4 text-center">
              <XCircle size={22} className="text-signal-red" />
              <p className="text-sm text-red-300">{message}</p>
              <button
                onClick={startScanning}
                className="mt-2 rounded-lg bg-signal-red px-4 py-2 text-xs font-medium text-white hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
