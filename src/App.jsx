import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import RoleGuard from './components/common/RoleGuard';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import PricingSettings from './pages/admin/PricingSettings';
import CRMPipeline from './pages/admin/CRMPipeline';
import EstimatesList from './pages/admin/EstimatesList';
import ProjectsList from './pages/admin/ProjectsList';
import PaymentTracker from './pages/admin/PaymentTracker';
import CalendarPage from './pages/admin/CalendarPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import MaterialsCatalog from './pages/admin/MaterialsCatalog';

// Pages - Sales (POS)
import POSDashboard from './pages/POSDashboard';
import Estimator from './pages/Estimator';
import Clients from './pages/Clients';
import Materials from './pages/Materials';



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
          <Route path="materials-catalog" element={<MaterialsCatalog />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* SALES POS ROUTES */}
        <Route
          path="/pos"
          element={
            <RoleGuard allowed={['salesperson']} role={role}>
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



        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to={roleHome[role] || '/'} replace />} />
      </Routes>
    </Router>
  );
}

