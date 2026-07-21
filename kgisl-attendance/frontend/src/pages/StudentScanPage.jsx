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
import SuccessOverlay from '../components/SuccessOverlay';
import MyAttendanceDrawer from '../components/MyAttendanceDrawer';

function getAccurateLocation(onProgress) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 'GPS_REQUIRED',
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    let best = null;
    let samples = 0;
    let settled = false;
    let watchId;

    const finish = (result, error) => {
      if (settled) return;
      settled = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timeoutId);
      if (error) reject(error);
      else resolve(result);
    };

    const timeoutId = setTimeout(() => {
      if (best) finish(best);
      else finish(null, {
        code: 'GPS_REQUIRED',
        message: 'Could not get your location. Turn on precise location and try again.'
      });
    }, 5000);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        samples += 1;

        const reading = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        if (!best || reading.accuracy < best.accuracy) best = reading;

        onProgress?.(best.accuracy, samples);

        if (best.accuracy <= 40) finish(best);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finish(null, {
            code: 'GPS_REQUIRED',
            message: 'Precise location permission is required to mark attendance.'
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 4500,
        maximumAge: 1500
      }
    );
  });
}

// --- IMAGE FORENSICS ALGORITHM v2 ---
// Multi-factor scoring to detect digital screenshots, virtual cameras,
// and WhatsApp-forwarded QR images.
//
// KEY INSIGHT: A real camera pointed at a projector or screen will ALWAYS
// introduce chromatic aberration (color fringing at edges), sensor noise
// (r!=g!=b even in "grey" areas), and raised black floors (camera lens
// captures ambient light scattering, so pure #000000 black is impossible).
//
// A screenshot or forwarded WhatsApp photo is mathematically perfect:
// - Pure #000000 black in QR dark modules
// - Perfectly equal R=G=B in anti-aliased grey pixels
// - Very low chromatic noise overall
//
// We score these signals and FAIL if the combined score exceeds threshold.
function analyzeImageForensics(videoElement, canvasElement) {
  if (!videoElement || !canvasElement) return false;
  
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;
  if (!width || !height) return false;

  canvasElement.width = width;
  canvasElement.height = height;
  const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(videoElement, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let pureBlackCount = 0;       // pixels that are exactly (0,0,0)
  let pureWhiteCount = 0;       // pixels that are exactly (255,255,255)  
  let monochromeCount = 0;      // pixels where R==G==B (digital perfect grey)
  let chromaticNoiseSum = 0;    // sum of |R-G| + |G-B| + |R-B| per pixel
  let totalPixels = 0;

  // Sample every 8th pixel (RGBA stride=4, so step=32) for performance
  for (let i = 0; i < data.length; i += 32) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalPixels++;

    if (r === 0 && g === 0 && b === 0) pureBlackCount++;
    if (r === 255 && g === 255 && b === 255) pureWhiteCount++;
    
    // Perfect monochrome — digital image characteristic
    if (r === g && g === b) monochromeCount++;

    // Chromatic noise: real cameras have different R/G/B even in "white" or "grey" zones
    // due to sensor color filters and ambient light. Screenshots have zero chromatic noise.
    chromaticNoiseSum += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
  }

  if (totalPixels === 0) return false;

  const pureBlackRatio = pureBlackCount / totalPixels;
  const pureWhiteRatio = pureWhiteCount / totalPixels;
  const monochromeRatio = monochromeCount / totalPixels;
  const avgChromaticNoise = chromaticNoiseSum / totalPixels; // real cam: >8, screenshot: <3

  // --- SCORING SYSTEM ---
  // Each suspicious signal adds to fakeScore. Threshold: >= 2 signals = fake.
  let fakeScore = 0;

  // Signal 1: Pure black exists → digital QR modules (impossible in real cam due to light bleed)
  if (pureBlackRatio > 0.01) fakeScore += 1;       // >1% pure-black pixels → very suspicious
  if (pureBlackRatio > 0.03) fakeScore += 1;       // >3% pure-black pixels → almost certainly fake

  // Signal 2: High monochrome ratio → digital rendering artifact
  if (monochromeRatio > 0.25) fakeScore += 1;      // >25% perfect-grey pixels

  // Signal 3: LOW chromatic noise → the killer signal for screenshots
  // Real cameras: avg chromatic noise is 8–25 (sensor noise + JPEG compression on actual physical scene)
  // Screenshots: avg chromatic noise is 0–4 (perfect digital rendering, no physical sensor)
  if (avgChromaticNoise < 6) fakeScore += 2;       // Very strong signal — nearly always means screenshot
  else if (avgChromaticNoise < 10) fakeScore += 1; // Moderate signal

  // Signal 4: Near-perfect white (WhatsApp QR background)
  if (pureWhiteRatio > 0.10) fakeScore += 1;       // >10% pure-white background

  // DECISION: score >= 3 means multiple strong signals of digital origin
  return fakeScore >= 3;
}

export default function StudentScanPage() {
  const { user, logout } = useAuth();
  const webcamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const rafRef = useRef(null);
  const lastScannedTokenRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const isDetectingRef = useRef(false);

  const [status, setStatus] = useState('idle'); // idle | scanning | submitting | success | error
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);

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

      // 4. Validate that required QR fields exist before submitting
      if (
        !qrPayload ||
        !qrPayload.sessionId ||
        !qrPayload.token ||
        !qrPayload.issuedAt ||
        !qrPayload.expiresAt ||
        !qrPayload.nonce ||
        !qrPayload.signature
      ) {
        return; // Skip if payload does not have required QR fields
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

      // If we reach here, acoustic sync is verified.
      // Prevent duplicate successful submissions
      if (lastScannedTokenRef.current === qrPayload.token) {
        return;
      }

      isSubmittingRef.current = true;
      lastScannedTokenRef.current = qrPayload.token;
      stopScanning();
      setStatus('submitting');
      setMessage('Verifying your location…');

      try {
        // 8. Fetch the public session information using sessionId
        // 9. Obtain batchId and subjectId from the session information
        const { data: sessionInfo } = await getSessionPublicInfo(qrPayload.sessionId);

        // 5. Obtain the current GPS coordinates using the robust watchPosition method
        // 6. Include GPS accuracy
        const gps = await getAccurateLocation((accuracy, samples) => {
          // Optional: Update UI with scanning progress if needed
          console.log(`Getting location... Accuracy: ${accuracy}m (Samples: ${samples})`);
        });

        // 7. Read the locally stored device ID
        const deviceId = getOrCreateDeviceId();

        // Submit attendance scan request following the exact required contract
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
          roomName: sessionInfo.roomName,
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
        // 13. Resume scanning after a failed or expired QR attempt (reset lock)
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
            errorMsg = 'Unable to access your live location. Enable GPS and try again.';
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

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && !isDetectingRef.current) {
      isDetectingRef.current = true;
      try {
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            const videoWidth = video.videoWidth;
            const barcodeWidth = barcode.boundingBox.width;

            // SMART AUTO-ZOOM
            if (barcodeWidth < videoWidth * 0.2) {
              const stream = video.srcObject;
              if (stream) {
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                if (capabilities.zoom) {
                  const currentZoom = track.getSettings().zoom || 1;
                  const targetZoom = Math.min(currentZoom * 2, capabilities.zoom.max || 3);
                  if (targetZoom > currentZoom) {
                    await track.applyConstraints({ advanced: [{ zoom: targetZoom }] }).catch(() => { });
                  }
                }
              }
            }

            if (barcode.rawValue) {
              const isFake = analyzeImageForensics(video, canvasRef.current);
              handleDecoded(barcode.rawValue, isFake);
              isDetectingRef.current = false;
              // Continue the loop so it can retry if acoustic sync was pending
              rafRef.current = requestAnimationFrame(tick);
              return;
            }
          }
        }

        // Fallback to jsQR
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          const isFake = analyzeImageForensics(video, canvasRef.current);
          handleDecoded(code.data, isFake);
          isDetectingRef.current = false;
          // Continue the loop so it can retry if acoustic sync was pending
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
      } catch (e) { }
      isDetectingRef.current = false;
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

      {/* Subtle ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Shooting Stars Layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <ShootingStars
          starColor="#9E00FF"
          trailColor="#2EB9DF"
          minSpeed={15}
          maxSpeed={35}
          minDelay={1000}
          maxDelay={3000}
        />
        <ShootingStars
          starColor="#FF0099"
          trailColor="#FFB800"
          minSpeed={10}
          maxSpeed={25}
          minDelay={2000}
          maxDelay={4000}
        />
        <ShootingStars
          starColor="#00FF9E"
          trailColor="#00B8FF"
          minSpeed={20}
          maxSpeed={40}
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
            {status === 'success' && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-400 font-medium">{message}</p>
                </div>

                {successData && (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start pb-3 border-b border-white/[0.06]">
                      <div>
                        <p className="text-sm font-semibold text-white">{successData.studentName}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{successData.rollNo}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md uppercase tracking-wider">
                        {successData.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Subject</p>
                        <p className="text-xs font-medium text-slate-200 mt-0.5 line-clamp-1">{successData.subjectName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Location</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-emerald-400" />
                          <p className="text-xs font-medium text-emerald-400">
                            Verified <span className="text-[10px] text-emerald-500/80">({successData.distance != null ? `${successData.distance}m` : 'Nearby'})</span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Classroom</p>
                        <p className="text-xs font-medium text-slate-200 mt-0.5 truncate">{successData.roomName || successData.sessionName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Time</p>
                        <p className="text-xs font-medium text-slate-200 mt-0.5">{new Date(successData.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                )}
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

      <SuccessOverlay
        isVisible={status === 'success'}
        data={successData}
        onClose={() => setStatus('idle')}
      />

      <MyAttendanceDrawer
        isOpen={isAttendanceDrawerOpen}
        onClose={() => setIsAttendanceDrawerOpen(false)}
      />
    </div>
  );
}
