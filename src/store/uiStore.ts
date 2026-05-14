import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  notifications: Notification[];
  toggleSidebar: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: string;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ notifications: [newNotification, ...state.notifications.slice(0, 9)] }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== newNotification.id),
      }));
    }, 5000);
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
