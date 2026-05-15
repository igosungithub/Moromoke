import { Clock, LogOut } from 'lucide-react';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { useStaffStore } from '../../store/staffStore';
import { useNavigate } from 'react-router-dom';

export default function IdleTimeoutBanner() {
  const { warning, secondsLeft, reset } = useIdleTimeout();
  const logout = useStaffStore((s) => s.logout);
  const navigate = useNavigate();
  if (!warning) return null;

  function signOutNow() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border-2 border-amber-300 shadow-xl rounded-xl p-4 flex items-center gap-4 w-[min(520px,calc(100vw-2rem))]">
      <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
        <Clock size={20} className="text-amber-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-900 text-sm">Inactive — automatic sign-out in {secondsLeft}s</p>
        <p className="text-xs text-amber-800 mt-0.5">Move the mouse or press a key to stay signed in. Auto-logout protects patient data.</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={reset} className="btn-primary text-xs px-3 py-2">Stay signed in</button>
        <button onClick={signOutNow} className="btn-secondary text-xs px-3 py-2"><LogOut size={12} /> Sign out</button>
      </div>
    </div>
  );
}
