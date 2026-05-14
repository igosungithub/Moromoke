import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function NotificationToast() {
  const { notifications, dismissNotification } = useUIStore();

  if (notifications.length === 0) return null;

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-yellow-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const borders = {
    success: 'border-green-400',
    error: 'border-red-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400',
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`bg-white rounded-lg shadow-lg border-l-4 ${borders[n.type]} p-4 flex items-start gap-3 animate-in slide-in-from-right`}
        >
          <div className="flex-shrink-0 mt-0.5">{icons[n.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{n.title}</p>
            {n.message && <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>}
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
