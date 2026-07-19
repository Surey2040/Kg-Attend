import { useEffect, useRef } from 'react';
import { TIME_SLOTS, FACULTY_TIMETABLE } from '../utils/timetableData';
import { useAuth } from '../context/AuthContext';

// Simple helper to get current "Day Order" based on day of week (Monday = I, Friday = V)
function getCurrentDayOrder() {
  const day = new Date().getDay(); // 0 = Sun, 1 = Mon ...
  const mapping = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
  return mapping[day] || null;
}

// Convert "9.10" to minutes from midnight
function timeStringToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split('.').map(Number);
  // Assume all times are daytime. If hours < 7, it's PM, so add 12.
  const adjustedHours = hours < 7 ? hours + 12 : hours;
  return adjustedHours * 60 + minutes;
}

export function useClassReminders() {
  const { user } = useAuth();
  const notifiedPeriodsRef = useRef(new Set());

  useEffect(() => {
    // Only run for students with a batch
    if (!user || user.role !== 'STUDENT' || !user.batchName) return;

    // Request notification permission if not already granted or denied
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkTimetable = () => {
      const currentDayOrder = getCurrentDayOrder();
      if (!currentDayOrder) return; // Weekend or no day order

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Find all classes for the student today
      const todaysClasses = [];

      Object.values(FACULTY_TIMETABLE).forEach(facultySchedule => {
        const todaySchedule = facultySchedule[currentDayOrder] || [];
        todaySchedule.forEach(slot => {
          if (slot.batch === user.batchName) {
            slot.period.forEach(p => {
              todaysClasses.push({ period: p, subject: slot.subject });
            });
          }
        });
      });

      // Check if any class starts in exactly 5 minutes
      todaysClasses.forEach(cls => {
        const timeSlotString = TIME_SLOTS[cls.period];
        if (!timeSlotString) return;

        const startTimeStr = timeSlotString.split(' - ')[0]; // e.g. "9.10"
        const startMinutes = timeStringToMinutes(startTimeStr);

        // If class starts in 5 mins (or within a small window) and we haven't notified yet
        if (startMinutes - currentMinutes <= 5 && startMinutes - currentMinutes > 0) {
          const notificationKey = `${currentDayOrder}-${cls.period}`;
          if (!notifiedPeriodsRef.current.has(notificationKey)) {
            notifiedPeriodsRef.current.add(notificationKey);

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Class Reminder`, {
                body: `Next class is ${cls.subject}. Get ready to scan!`,
                icon: '/kgisl-logo.png' // Adjust if needed
              });
            }
          }
        }
      });
    };

    // Check immediately, then every 30 seconds
    checkTimetable();
    const interval = setInterval(checkTimetable, 30000);

    return () => clearInterval(interval);
  }, [user]);
}
