import { useState, useEffect, useRef } from 'react';

// --- EMITTER (FACULTY SIDE) ---

let emitterAudioCtx = null;
let oscillator = null;
const TARGET_FREQUENCY = 12000;

export function startAcousticEmitter(frequency = TARGET_FREQUENCY) {
  if (oscillator) return; // Already running

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    emitterAudioCtx = new AudioContext();
    oscillator = emitterAudioCtx.createOscillator();
    
    // Use a sine wave at the target frequency (16kHz by default)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, emitterAudioCtx.currentTime);

    // Optional: Lower the volume slightly so it doesn't cause hardware distortion,
    // but keep it high enough to be picked up across a classroom.
    const gainNode = emitterAudioCtx.createGain();
    gainNode.gain.setValueAtTime(0.8, emitterAudioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(emitterAudioCtx.destination);
    
    oscillator.start();
    
    // Resume context on iOS Safari if suspended
    if (emitterAudioCtx.state === 'suspended') {
      const resume = () => {
        emitterAudioCtx.resume();
        document.removeEventListener('touchstart', resume);
        document.removeEventListener('click', resume);
      };
      document.addEventListener('touchstart', resume);
      document.addEventListener('click', resume);
    }

    // [Acoustic Sync] Emitter started
  } catch (err) {
    console.error('[Acoustic Sync] Failed to start emitter:', err);
  }
}

export function stopAcousticEmitter() {
  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {
      // Ignore
    }
    oscillator = null;
  }
  if (emitterAudioCtx) {
    emitterAudioCtx.close().catch(() => {});
    emitterAudioCtx = null;
  }
  // [Acoustic Sync] Emitter stopped
}

// --- LISTENER (STUDENT SIDE) ---

export function useAcousticListener(targetFrequency = TARGET_FREQUENCY) {
  const [isListening, setIsListening] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Only run if browser supports Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Web Audio API or getUserMedia not supported.');
      return;
    }

    let isMounted = true;

    async function startListening() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: false, 
            noiseSuppression: false, 
            autoGainControl: false 
          } 
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        
        // High FFT size for better frequency resolution
        analyserRef.current.fftSize = 2048; 
        
        const source = audioCtxRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        // Resume context on iOS Safari if suspended
        if (audioCtxRef.current.state === 'suspended') {
          const resume = () => {
            if (audioCtxRef.current) audioCtxRef.current.resume();
            document.removeEventListener('touchstart', resume);
            document.removeEventListener('click', resume);
          };
          document.addEventListener('touchstart', resume);
          document.addEventListener('click', resume);
        }
        
        setIsListening(true);
        // [Acoustic Sync] Listener started

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const sampleRate = audioCtxRef.current.sampleRate;
        
        // Calculate which bin corresponds to our target frequency
        // Bin Frequency = binIndex * (sampleRate / fftSize)
        const hzPerBin = sampleRate / analyserRef.current.fftSize;
        const targetBin = Math.round(targetFrequency / hzPerBin);

        const checkFrequency = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Check amplitude at the target bin (and adjacent bins for safety due to iOS sample rate differences)
          let maxAmplitude = 0;
          for (let i = -3; i <= 3; i++) {
            const val = dataArray[targetBin + i] || 0;
            if (val > maxAmplitude) maxAmplitude = val;
          }

          // Threshold: 0 is silence, 255 is max volume.
          // Lowered to 25 for strict iOS noise cancellation and hardware filtering
          if (maxAmplitude > 25) {
            setIsVerified(true);
          }
          
          rafRef.current = requestAnimationFrame(checkFrequency);
        };

        checkFrequency();

      } catch (err) {
        console.error('[Acoustic Sync] Microphone access denied or failed', err);
      }
    }

    startListening();

    return () => {
      isMounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [targetFrequency]);

  return { isListening, isVerified };
}
