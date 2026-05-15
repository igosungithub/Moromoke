import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import PatientQueue from './pages/PatientQueue';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import PatientRegistration from './pages/PatientRegistration';
import TriagePage from './pages/TriagePage';
import VitalsPage from './pages/VitalsPage';
import MedicationsPage from './pages/MedicationsPage';
import LabsPage from './pages/LabsPage';
import ImagingPage from './pages/ImagingPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import DrugStockPage from './pages/DrugStockPage';
import MaternityPage from './pages/MaternityPage';
import LoginPage from './pages/LoginPage';
import { useStaffStore } from './store/staffStore';

function ProtectedRoute() {
  const { isAuthenticated, currentUser } = useStaffStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.mustChangePassword) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useStaffStore();
  if (isAuthenticated && !currentUser?.mustChangePassword) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<PatientQueue />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/new" element={<PatientRegistration />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/vitals" element={<VitalsPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/labs" element={<LabsPage />} />
            <Route path="/imaging" element={<ImagingPage />} />
            <Route path="/drug-stock" element={<DrugStockPage />} />
            <Route path="/maternity" element={<MaternityPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
