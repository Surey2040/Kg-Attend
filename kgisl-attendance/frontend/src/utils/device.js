/**
 * Fast deterministic hash function (cyrb53)
 */
const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * Extracts WebGL renderer information (GPU)
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    
    return `${vendor}~${renderer}`;
  } catch (e) {
    return 'webgl-error';
  }
}

/**
 * Generates a deterministic device fingerprint based on hardware/software signatures.
 * This guarantees the same iPhone will generate the exact same ID whether it's in 
 * Safari or opened as a Home Screen PWA.
 */
export function generateDeviceFingerprint() {
  const components = [];
  
  // 1. User Agent (OS, Browser version)
  components.push(navigator.userAgent || '');
  
  // 2. Screen metrics (Resolution, color depth, pixel ratio)
  if (window.screen) {
    // Sort width/height so landscape/portrait rotation doesn't change the ID
    const w = window.screen.width;
    const h = window.screen.height;
    components.push(`${Math.min(w, h)}x${Math.max(w, h)}`);
    components.push(window.screen.colorDepth || '');
  }
  components.push(window.devicePixelRatio || '');
  
  // 3. Hardware concurrency (CPU Cores) & Memory
  components.push(navigator.hardwareConcurrency || '');
  components.push(navigator.deviceMemory || '');
  
  // 4. Timezone offset
  components.push(new Date().getTimezoneOffset());
  
  // 5. WebGL / GPU Fingerprint (Crucial for iOS uniqueness e.g. Apple A15 GPU)
  components.push(getWebGLFingerprint());

  // Combine all strings into a single long string and hash it
  const rawFingerprint = components.join('|||');
  
  // Return the hashed fingerprint as a hex string (e.g., 'fp_9a2b4c8d')
  const hash = cyrb53(rawFingerprint).toString(16);
  return `fp_${hash}`;
}

/**
 * Gets or creates the device ID for the current browser/device.
 */
export function getOrCreateDeviceId() {
  const DEVICE_ID_KEY = 'kgisl_device_id';
  
  // Try to get from local storage first (for speed)
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  // If not in storage (e.g. they opened the PWA for the first time), generate it!
  if (!deviceId || !deviceId.startsWith('fp_')) {
    deviceId = generateDeviceFingerprint();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}
