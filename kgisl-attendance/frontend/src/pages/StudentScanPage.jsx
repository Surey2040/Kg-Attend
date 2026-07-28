import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';
import { CheckCircle2, XCircle, ScanLine, LogOut, Calendar, ShieldCheck, MapPin, Search, Maximize, AlertTriangle, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { submitScan, getSessionPublicInfo } from '../services/api.js';
import { hapticSuccess, hapticError } from '../utils/haptics.js';
import { ShootingStars } from '../components/ui/shooting-stars.jsx';
import StudentAgentChat from '../components/StudentAgentChat.jsx';
import { getOrCreateDeviceId } from '../utils/device';
import { useClassReminders } from '../hooks/useClassReminders';
import MyAttendanceDrawer from '../components/MyAttendanceDrawer';
import MonthlyAttendanceSignatureModal from '../components/MonthlyAttendanceSignatureModal';
import { getStudentMonthlySignature } from '../services/api';

function getAccurateLocation(onProgress) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 'GPS_REQUIRED',
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      reject({
        code: 'GPS_REQUIRED',
        message: 'Camera & GPS require HTTPS or localhost. Please switch to a secure HTTPS connection.'
      });
      return;
    }

    let best = null;
    let samples = 0;
    let settled = false;
    let watchId = null;
    let fallbackTimer = null;

    const finish = (result, error) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) {
        try { navigator.geolocation.clearWatch(watchId); } catch (e) { }
        watchId = null;
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);

      if (error) {
        reject(error);
      } else if (result) {
        resolve(result);
      } else {
        reject({
          code: 'GPS_REQUIRED',
          message: 'Unable to access your location. Turn on precise GPS and try again.'
        });
      }
    };

    const tryCurrentPosition = (enableHighAcc) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const reading = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          finish(reading);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            finish(null, {
              code: 'GPS_REQUIRED',
              message: 'Location permission denied. Please grant location access in browser settings.'
            });
          } else if (enableHighAcc) {
            tryCurrentPosition(false);
          } else if (best) {
            finish(best);
          } else {
            finish(null, {
              code: 'GPS_REQUIRED',
              message: 'Unable to access location. Turn on GPS/location services on your device and try again.'
            });
          }
        },
        {
          enableHighAccuracy: enableHighAcc,
          timeout: 6000,
          maximumAge: 5000,
        }
      );
    };

    fallbackTimer = setTimeout(() => {
      if (best) {
        finish(best);
      } else {
        tryCurrentPosition(false);
      }
    }, 4000);

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          samples += 1;
          const reading = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          if (!best || reading.accuracy < best.accuracy) {
            best = reading;
          }

          onProgress?.(best.accuracy, samples);

          if (best.accuracy <= 50) {
            finish(best);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            finish(null, {
              code: 'GPS_REQUIRED',
              message: 'Location permission is required to mark attendance.'
            });
          } else {
            if (best) {
              finish(best);
            } else {
              tryCurrentPosition(false);
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 3000,
        }
      );
    } catch (e) {
      tryCurrentPosition(false);
    }
  });
}

// --- IMAGE FORENSICS ALGORITHM v2 (Optimized) ---
function analyzeImageForensics(videoElement, canvasElement) {
  if (!videoElement || !canvasElement) return false;

  const width = Math.min(videoElement.videoWidth || 640, 640);
  const scale = width / (videoElement.videoWidth || width);
  const height = Math.round((videoElement.videoHeight || 480) * scale);
  if (!width || !height) return false;

  canvasElement.width = width;
  canvasElement.height = height;
  const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(videoElement, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let pureBlackCount = 0;
  let pureWhiteCount = 0;
  let monochromeCount = 0;
  let chromaticNoiseSum = 0;
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 32) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalPixels++;

    if (r === 0 && g === 0 && b === 0) pureBlackCount++;
    if (r === 255 && g === 255 && b === 255) pureWhiteCount++;

    if (r === g && g === b) monochromeCount++;

    chromaticNoiseSum += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
  }

  if (totalPixels === 0) return false;

  const pureBlackRatio = pureBlackCount / totalPixels;
  const pureWhiteRatio = pureWhiteCount / totalPixels;
  const monochromeRatio = monochromeCount / totalPixels;
  const avgChromaticNoise = chromaticNoiseSum / totalPixels;

  // Build fakeScore — only extreme digital-only signals (screenshots/forwarded QR images) score >= 5
  let fakeScore = 0;
  if (pureBlackRatio > 0.01) fakeScore += 1;
  if (pureBlackRatio > 0.05) fakeScore += 1;
  if (monochromeRatio > 0.40) fakeScore += 1;
  if (avgChromaticNoise < 3) fakeScore += 2;
  else if (avgChromaticNoise < 6) fakeScore += 1;
  if (pureWhiteRatio > 0.20) fakeScore += 1;

  // Real cameras in bright classrooms typically score 0-2 and always pass
  return fakeScore >= 5;
}

export default function StudentScanPage() {
  const { user, logout } = useAuth();
  const webcamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const rafRef = useRef(null);
  const lastScannedTokenRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const isDetectingRef = useRef(false);
  const lastScanTimeRef = useRef(0);

  const [status, setStatus] = useState('idle'); // idle | scanning | submitting | success | error
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);

  // Monthly Signature Login Prompt Banner
  const [showLoginSignPrompt, setShowLoginSignPrompt] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const pendingMonth = 'July 2026';

  useEffect(() => {
    if (user) {
      const key = `attendance_sig_${user?.id || 'student'}_${pendingMonth.replace(' ', '_')}`;
      const saved = localStorage.getItem(key);
      if (!saved) {
        setShowLoginSignPrompt(true);
      } else {
        setShowLoginSignPrompt(false);
      }
    }
  }, [user]);

  useClassReminders();

  const stopScanning = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleDecoded = useCallback(
    async (rawValue, isScreenshot = false) => {
      let qrPayload = null;
      try {
        qrPayload = JSON.parse(rawValue);
      } catch (e) {
        return; // Skip invalid JSON scanned payloads silently
      }

      if (
        !qrPayload ||
        !qrPayload.sessionId ||
        !qrPayload.token ||
        !qrPayload.issuedAt ||
        !qrPayload.expiresAt ||
        !qrPayload.nonce ||
        !qrPayload.signature
      ) {
        return;
      }

      if (isSubmittingRef.current) return;

      if (isScreenshot) {
        if (lastScannedTokenRef.current !== 'fake_' + qrPayload.token) {
          lastScannedTokenRef.current = 'fake_' + qrPayload.token;
          setStatus('error');
          hapticError();
          setMessage('Invalid Scan: Screenshot or forwarded image detected. Please scan the live projector screen.');
        }
        return;
      }

      if (lastScannedTokenRef.current === qrPayload.token) {
        return;
      }

      isSubmittingRef.current = true;
      lastScannedTokenRef.current = qrPayload.token;
      stopScanning();
      setStatus('submitting');
      setMessage('Verifying your location…');

      try {
        const { data: sessionInfo } = await getSessionPublicInfo(qrPayload.sessionId);

        const gps = await getAccurateLocation((accuracy, samples) => {
          console.log(`Getting location... Accuracy: ${accuracy}m (Samples: ${samples})`);
        });

        const deviceId = getOrCreateDeviceId();

        const response = await submitScan({
          batchId: sessionInfo.batchId,
          subjectId: sessionInfo.subjectId,
          deviceId: deviceId,
          gps: {
            lat: gps.lat,
            lng: gps.lng,
            accuracy: gps.accuracy,
          },
          qr: qrPayload,
        });

        setSuccessData({
          studentName: response.data?.studentName || user?.name || 'Student',
          rollNo: response.data?.rollNo || user?.rollNo || '',
          roomName: response.data?.detectedRoom || sessionInfo.roomName,
          sessionName: response.data?.sessionName || sessionInfo.subjectName || '',
          subjectName: response.data?.subjectName || sessionInfo.subjectName || '',
          status: response.data?.status || 'PRESENT',
          markedAt: response.data?.markedAt || new Date().toISOString(),
          distance: response.data?.distance,
          locationStatus: response.data?.locationStatus,
        });

        setStatus('success');
        hapticSuccess();
        setMessage('Attendance marked successfully.');
      } catch (err) {
        lastScannedTokenRef.current = null;
        setStatus('error');
        hapticError();
        let errorMsg = err.message || 'Could not mark attendance. Try scanning again.';

        const errCode = err.response?.data?.code || err.code;
        const errMsg = err.response?.data?.message || err.message;

        if (errCode) {
          if (errCode === 'OUTSIDE_GEOFENCE' || errCode === 'GEOFENCE_REJECTED' || errCode === 'OUTSIDE_ALLOWED_LOCATION') {
            errorMsg = 'You are outside the allowed attendance location.';
          } else if (errCode === 'POOR_GPS_ACCURACY') {
            errorMsg = 'Location accuracy is too low. Please move to an open area and try again.';
          } else if (errCode === 'INVALID_GPS' || errCode === 'GPS_REQUIRED') {
            errorMsg = err.message || 'Unable to access your live location. Enable GPS and try again.';
          } else if (errCode === 'DEVICE_NOT_AUTHORIZED') {
            errorMsg = 'Attendance cannot be marked from this device.';
          } else if (errCode === 'QR_EXPIRED') {
            errorMsg = 'This QR code has expired. Scan the latest QR code.';
          } else if (errCode === 'INVALID_QR_SIGNATURE') {
            errorMsg = 'The QR code is invalid or has been modified.';
          } else if (errCode === 'ATTENDANCE_ALREADY_MARKED') {
            errorMsg = 'Attendance has already been marked for this session.';
          } else if (errCode === 'SESSION_NOT_ACTIVE') {
            errorMsg = 'Attendance session is not active.';
          } else if (errCode === 'INTERNAL_ERROR') {
            errorMsg = `Server encountered an issue: ${errMsg}`;
          } else {
            errorMsg = errMsg || errorMsg;
          }
        }
        setMessage(errorMsg);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [stopScanning, user]
  );

  const tick = useCallback(async () => {
    const webcam = webcamRef.current;
    if (!webcam) return;
    const video = webcam.video;

    const now = Date.now();
    // Throttle QR detection to max once every 120ms (~8 FPS) for high performance & zero lag
    if (now - lastScanTimeRef.current >= 120 && video && video.readyState === video.HAVE_ENOUGH_DATA && !isDetectingRef.current) {
      lastScanTimeRef.current = now;
      isDetectingRef.current = true;
      try {
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            if (barcode.rawValue) {
              const isFake = analyzeImageForensics(video, canvasRef.current);
              handleDecoded(barcode.rawValue, isFake);
              isDetectingRef.current = false;
              rafRef.current = requestAnimationFrame(tick);
              return;
            }
          }
        }

        // Fallback to jsQR with downscaled resolution (max 640px)
        const canvas = canvasRef.current;
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;
        const maxW = 640;
        const scale = Math.min(1, maxW / videoWidth);
        const targetW = Math.round(videoWidth * scale);
        const targetH = Math.round(videoHeight * scale);

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          const isFake = analyzeImageForensics(video, canvasRef.current);
          handleDecoded(code.data, isFake);
          isDetectingRef.current = false;
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      } catch (e) { }
      isDetectingRef.current = false;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecoded]);

  const handleUserMedia = useCallback(() => {
    // Apply hardware camera track auto-zoom (1.5x - 2.0x) so students can scan from distance
    const webcam = webcamRef.current;
    if (webcam && webcam.video && webcam.video.srcObject) {
      try {
        const stream = webcam.video.srcObject;
        const track = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
        if (track && track.getCapabilities) {
          const capabilities = track.getCapabilities();
          if (capabilities.zoom) {
            const minZ = capabilities.zoom.min || 1;
            const maxZ = capabilities.zoom.max || 3;
            const targetZ = Math.min(maxZ, Math.max(minZ, 1.8));
            track.applyConstraints({ advanced: [{ zoom: targetZ }] }).catch(() => void 0);
          }
        }
      } catch (e) {}
    }
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
    <div
      className="min-h-screen w-full overflow-y-auto relative bg-[#09090b]"
    >
      {/* Static Stars Background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
                                radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                                radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0)),
                                radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
                                radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
                                radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0))`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Lightweight Canvas Shooting Stars Layer */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <ShootingStars
          starColor="#9E00FF"
          trailColor="#2EB9DF"
          minSpeed={15}
          maxSpeed={35}
          minDelay={1500}
          maxDelay={3500}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8 pb-16 min-h-screen">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAttendanceDrawerOpen(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
              >
                <Calendar size={12} /> My Attendance
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Monthly Signature Login Notification Banner */}
          {showLoginSignPrompt && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/70 to-slate-950 border border-purple-500/40 shadow-2xl shadow-purple-950/50 flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <ShieldCheck size={16} className="text-purple-400" />
                  <span>Monthly Attendance Sign-Off</span>
                </div>
                <button onClick={() => setShowLoginSignPrompt(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Today you need to sign your monthly attendance record for <span className="font-bold text-purple-300">{pendingMonth}</span>!
              </p>
              <button
                onClick={() => setIsSignModalOpen(true)}
                className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShieldCheck size={14} /> Sign Attendance Now
              </button>
            </div>
          )}

          {/* Scanner Card */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-xl p-5 shadow-xl">
            <h1 className="text-lg font-semibold text-white tracking-tight">Mark Attendance</h1>

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-400">Scan the live QR shown by your faculty.</p>
            </div>

            {/* Camera frame */}
            <div className="mt-5 scan-frame relative mx-auto w-full aspect-square max-w-[260px] overflow-hidden rounded-xl bg-black">
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
                  className="h-full w-full object-cover"
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <ScanLine size={32} className="text-slate-600" />
                </div>
              )}

              {status === 'scanning' && (
                <div className="sweep animate-scanline" style={{ animationDuration: '2.4s' }} />
              )}
            </div>

            {cameraError && (
              <p className="mt-3 text-[11px] text-red-400 text-center leading-relaxed">{cameraError}</p>
            )}

            {status === 'idle' && (
              <button
                onClick={startScanning}
                className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] py-3 text-sm font-medium text-white transition-all duration-200 shadow-lg shadow-indigo-900/40"
              >
                Start Scanning
              </button>
            )}

            {status === 'submitting' && (
              <p className="mt-5 text-center text-sm text-slate-400 animate-pulse">{message}</p>
            )}

            {/* Success state */}
            {status === 'success' && successData && (
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 text-left backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-4">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                  <p className="text-sm font-semibold text-emerald-400">Attendance Marked</p>
                </div>

                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Name</span>
                    <span className="text-slate-200 font-medium">{successData.studentName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Roll No</span>
                    <span className="text-slate-200 font-medium">{successData.rollNo}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Subject</span>
                    <span className="text-slate-200 font-medium">{successData.subjectName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Status</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">{successData.status}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Location</span>
                    <span className="text-slate-200 font-medium">Room {successData.roomName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Time</span>
                    <span className="text-slate-200 font-medium">
                      {new Date(successData.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">Distance</span>
                    <span className="text-slate-200 font-medium">
                      {successData.distance != null ? `${successData.distance} m from class` : 'Nearby'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">GPS Accuracy</span>
                    <span className="text-slate-200 font-medium">
                      {successData.locationStatus?.match(/Acc:\s*(\d+(\.\d+)?)m/) ? `±${successData.locationStatus.match(/Acc:\s*(\d+(\.\d+)?)m/)[1]} m` : '±10 m'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-center">
                <XCircle size={20} className="text-red-400" />
                <p className="text-sm text-red-300 leading-relaxed">{message}</p>
                <button
                  onClick={startScanning}
                  className="mt-1 rounded-lg bg-red-600 hover:bg-red-500 px-5 py-2 text-xs font-medium text-white transition-all active:scale-95"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Leave link */}
          <div className="mt-5 text-center">
            <Link
              to="/student/leaves"
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
            >
              <Calendar size={14} />
              Apply for Leave / On-Duty
            </Link>
          </div>

        </div>
      </div>

      {/* Chat Agent Bottom UI */}
      <div className="fixed bottom-0 w-full flex justify-center z-20 mb-safe pointer-events-none">
        <div className="pointer-events-auto">
          <StudentAgentChat />
        </div>
      </div>

      <MyAttendanceDrawer
        isOpen={isAttendanceDrawerOpen}
        onClose={() => setIsAttendanceDrawerOpen(false)}
      />

      <MonthlyAttendanceSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => {
          setIsSignModalOpen(false);
          const key = `attendance_sig_${user?.id || 'student'}_${pendingMonth.replace(' ', '_')}`;
          if (localStorage.getItem(key)) {
            setShowLoginSignPrompt(false);
          }
        }}
        studentData={user}
      />
    </div>
  );
}
