export const vibrate = (pattern = 50) => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors on unsupported devices
    }
  }
};

export const hapticLight = () => vibrate(30);
export const hapticMedium = () => vibrate(50);
export const hapticHeavy = () => vibrate(80);
export const hapticSuccess = () => vibrate([30, 50, 30]);
export const hapticError = () => vibrate([50, 50, 50, 50]);
