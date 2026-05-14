import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
