import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToast from '../ui/NotificationToast';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/queue': 'Patient Queue',
  '/patients': 'Patients',
  '/triage': 'Triage Assessment',
  '/vitals': 'Vitals',
  '/medications': 'Medications',
  '/labs': 'Lab Results',
  '/imaging': 'Imaging',
  '/staff': 'Staff Management',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/');
  const basePath = '/' + pathSegments[1];
  const title = pageTitles[basePath] || 'Moromoke EMR';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <NotificationToast />
    </div>
  );
}
