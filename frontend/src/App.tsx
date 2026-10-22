
import { Routes, Route, Navigate } from 'react-router';

import MainLayout from './layouts/MainLayout';
import IntervenantLayout from './layouts/IntervenantLayout';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MissionsPage from './pages/MissionsPage';
import ProspectsPage from './pages/ProspectsPage';
import IntervenantsPage from './pages/IntervenantsPage';
import KpiPage from './pages/KPIPage';
import MyMissionsPage from './pages/MyMissionsPage';
import IntervenantHomePage from './pages/IntervenantHomePage';
import WelcomePage from './pages/WelcomePage';

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/welcome" replace />} />

      <Route element={<ProtectedRoute bureauOnly />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/prospects" element={<ProspectsPage />} />
          <Route path="/intervenants" element={<IntervenantsPage />} />
          <Route path="/kpi" element={<KpiPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<IntervenantLayout />}>
          <Route
            path="/intervenant"
            element={<IntervenantHomePage />}
          />
          <Route
            path="/intervenant/missions"
            element={<MyMissionsPage />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
