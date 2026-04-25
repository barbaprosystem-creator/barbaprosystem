import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import RoleGuard from './components/common/RoleGuard';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';
import SupervisorLayout from './layouts/SupervisorLayout';

// Pages âEUR" Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import PricingSettings from './pages/admin/PricingSettings';
import CRMPipeline from './pages/admin/CRMPipeline';
import EstimatesList from './pages/admin/EstimatesList';
import ProjectsList from './pages/admin/ProjectsList';
import PaymentTracker from './pages/admin/PaymentTracker';
import CalendarPage from './pages/admin/CalendarPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Pages âEUR" Sales (POS)
import POSDashboard from './pages/POSDashboard';
import Estimator from './pages/Estimator';
import Clients from './pages/Clients';
import Materials from './pages/Materials';

// Pages âEUR" Supervisor
import SupervisorProjects from './pages/supervisor/SupervisorProjects';
import DailyReports from './pages/supervisor/DailyReports';
import PhotoUpload from './pages/supervisor/PhotoUpload';
import SupervisorCalendar from './pages/supervisor/SupervisorCalendar';

// Loading spinner
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Cargando Barba Pro...</p>
    </div>
  );
}

export default function App() {
  const { session, profile, loading, signIn, signOut, role } = useAuth();

    if (loading) return <LoadingScreen />;
  if (!session) return <LoginPage onAuth={signIn} />;
  if (!profile) return <LoadingScreen />;

  const roleHome = {
    admin: '/admin',
    office: '/admin',
    salesperson: '/pos/estimator',
    supervisor: '/projects',
  };

  return (
    <Router>
      <Routes>
        {/* ROOT REDIRECT */}
        <Route path="/" element={<Navigate to={roleHome[role] || '/pos/estimator'} replace />} />

        {/* ADMIN / OFFICE ROUTES */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowed={['admin', 'office']} role={role}>
              <AdminLayout profile={profile} onSignOut={signOut} />
            </RoleGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="crm" element={<CRMPipeline />} />
          <Route path="estimates" element={<EstimatesList />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="payments" element={<PaymentTracker />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="pricing" element={<PricingSettings />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* SALES POS ROUTES */}
        <Route
          path="/pos"
          element={
            <RoleGuard allowed={['admin', 'salesperson', 'office']} role={role}>
              <POSLayout setRole={null} onSignOut={signOut} profile={profile} />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="estimator" replace />} />
          <Route path="dashboard" element={<POSDashboard />} />
          <Route path="estimator" element={<Estimator />} />
          <Route path="clients" element={<Clients />} />
          <Route path="materials" element={<Materials />} />
        </Route>

        {/* SUPERVISOR ROUTES */}
        <Route
          path="/projects"
          element={
            <RoleGuard allowed={['admin', 'supervisor', 'office']} role={role}>
              <SupervisorLayout profile={profile} onSignOut={signOut} />
            </RoleGuard>
          }
        >
          <Route index element={<SupervisorProjects />} />
          <Route path="reports" element={<DailyReports />} />
          <Route path="photos" element={<PhotoUpload />} />
          <Route path="calendar" element={<SupervisorCalendar />} />
        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to={roleHome[role] || '/'} replace />} />
      </Routes>
    </Router>
  );
}

