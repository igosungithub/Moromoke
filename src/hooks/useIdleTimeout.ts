import { useEffect, useRef, useState } from 'react';
import { useStaffStore } from '../store/staffStore';

const IDLE_MS = 30 * 60 * 1000;       // 30 minutes total idle window
const WARN_MS = 1 * 60 * 1000;        // 1 minute warning before logout
const EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;

// Auto-logout when the signed-in user has been idle for IDLE_MS, with a
// WARN_MS warning window. Returns { secondsLeft } during the warning window
// so the UI can show a countdown; otherwise null.
export function useIdleTimeout(): { warning: boolean; secondsLeft: number; reset: () => void } {
  const isAuthenticated = useStaffStore((s) => s.isAuthenticated);
  const logout = useStaffStore((s) => s.logout);
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const lastActivity = useRef(Date.now());
  const tickRef = useRef<number | null>(null);

  function reset() {
    lastActivity.current = Date.now();
    setWarning(false);
    setSecondsLeft(0);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    lastActivity.current = Date.now();

    const onActivity = () => { if (!warning) lastActivity.current = Date.now(); };
    for (const ev of EVENTS) document.addEventListener(ev, onActivity, { passive: true });

    function tick() {
      const idleMs = Date.now() - lastActivity.current;
      if (idleMs >= IDLE_MS) {
        // Time up — sign out
        logout();
        setWarning(false);
      } else if (idleMs >= IDLE_MS - WARN_MS) {
        setWarning(true);
        setSecondsLeft(Math.max(0, Math.ceil((IDLE_MS - idleMs) / 1000)));
      } else if (warning) {
        setWarning(false);
      }
    }

    tickRef.current = window.setInterval(tick, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      for (const ev of EVENTS) document.removeEventListener(ev, onActivity);
    };
  }, [isAuthenticated, logout, warning]);

  return { warning, secondsLeft, reset };
}
