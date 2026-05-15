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
import AuditLogPage from './pages/AuditLogPage';
import HelpPage from './pages/HelpPage';
import { useStaffStore } from './store/staffStore';
import RequirePermission from './components/ui/RequirePermission';

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
            <Route path="/patients" element={<RequirePermission permission="patient:view"><PatientList /></RequirePermission>} />
            <Route path="/patients/new" element={<RequirePermission permission="patient:create"><PatientRegistration /></RequirePermission>} />
            <Route path="/patients/:id" element={<RequirePermission permission="patient:view"><PatientDetail /></RequirePermission>} />
            <Route path="/triage" element={<RequirePermission permission="triage:view"><TriagePage /></RequirePermission>} />
            <Route path="/vitals" element={<RequirePermission permission="vitals:view"><VitalsPage /></RequirePermission>} />
            <Route path="/medications" element={<RequirePermission permission="medications:view"><MedicationsPage /></RequirePermission>} />
            <Route path="/labs" element={<RequirePermission permission="labs:view"><LabsPage /></RequirePermission>} />
            <Route path="/imaging" element={<RequirePermission permission="imaging:view"><ImagingPage /></RequirePermission>} />
            <Route path="/drug-stock" element={<RequirePermission permission="drugstock:view"><DrugStockPage /></RequirePermission>} />
            <Route path="/maternity" element={<RequirePermission permission="maternity:view"><MaternityPage /></RequirePermission>} />
            <Route path="/staff" element={<RequirePermission permission="staff:view"><StaffPage /></RequirePermission>} />
            <Route path="/reports" element={<RequirePermission permission="reports:view"><ReportsPage /></RequirePermission>} />
            <Route path="/settings" element={<RequirePermission permission="settings:view"><SettingsPage /></RequirePermission>} />
            <Route path="/audit" element={<RequirePermission permission="audit:view"><AuditLogPage /></RequirePermission>} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
