/**
 * Gets or creates a unique device ID (UUID) for the current browser/device.
 * This ensures strict device locking for attendance, solving iOS canvas fingerprinting issues.
 */
export function getOrCreateDeviceId() {
  const DEVICE_ID_KEY = 'kgisl_device_id';
  
  // Try to get from local storage first
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  // If not in storage (e.g. they opened the PWA for the first time), generate it!
  if (!deviceId) {
    // Generate Random UUID (Crypto API if available, else fallback)
    deviceId = crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}
