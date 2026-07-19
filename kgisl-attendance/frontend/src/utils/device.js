/**
 * Generates a UUID for device binding.
 * Safely falls back to a math-based UUID generator if crypto.randomUUID is unavailable
 * (which happens on iOS Safari over HTTP or in non-secure contexts).
 */
export function generateDeviceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      console.warn("crypto.randomUUID failed, using fallback");
    }
  }
  
  // Fallback UUIDv4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gets or creates the device ID for the current browser/device.
 */
export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('kgisl_device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('kgisl_device_id', deviceId);
  }
  return deviceId;
}
