import { useEffect, useRef } from 'react';

/**
 * Auto-save hook that debounces saves
 * @param {Object} data - The data to save
 * @param {Function} saveFn - The save function  
 * @param {number} delay - Debounce delay in ms (default 3000)
 * @param {boolean} enabled - Whether auto-save is enabled
 */
export default function useAutoSave(data, saveFn, delay = 3000, enabled = true) {
  const timeoutRef = useRef(null);
  const savedDataRef = useRef(null);

  useEffect(() => {
    if (!enabled || !saveFn) return;

    const dataStr = JSON.stringify(data);
    if (dataStr === savedDataRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn(data);
        savedDataRef.current = dataStr;
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFn, delay, enabled]);
}
