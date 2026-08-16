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
import CatalogAdminPage from './pages/admin/CatalogAdminPage';
import BrigadesPage from './pages/admin/BrigadesPage';
import ProfitTracker from './pages/admin/ProfitTracker';
import InboxPage from './pages/admin/InboxPage';
import PayrollPage from './pages/admin/PayrollPage';
import ContractBuilder from './pages/admin/ContractBuilder';
import BillsPage from './pages/admin/BillsPage';
import ShowroomAdminPage from './pages/admin/ShowroomAdminPage';
import AITrainingChat from './pages/admin/AITrainingChat';
import TzelLeadsPage from './pages/admin/TzelLeadsPage';

// Pages - Sales (POS)
import POSDashboard from './pages/POSDashboard';
import Estimator from './pages/Estimator';
import POSEstimates from './pages/POSEstimates';
import Clients from './pages/Clients';
import Showroom from './pages/Showroom';
import PDFPreview from './pages/PDFPreview';
import PublicCatalogPage from './pages/PublicCatalogPage';
import PublicContract from './pages/PublicContract';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import EULA from './pages/EULA';
import ContactUs from './pages/ContactUs';
import LandingPage from './pages/LandingPage';
import Public3DViewer from './pages/Public3DViewer';

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

  const roleHome = {
    admin: '/admin',
    office: '/admin',
    salesperson: '/pos/estimator',
  };

  return (
    <Router>
      <Routes>
        {/* ==========================================
            ALWAYS-PUBLIC ROUTES (Universal access)
           ========================================== */}
        <Route path="/p/:id" element={<PDFPreview />} />
        <Route path="/3d/:id" element={<Public3DViewer />} />
        <Route path="/contract/:id" element={<PublicContract />} />
        <Route path="/catalog" element={<PublicCatalogPage />} />
        
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/privacy_policy" element={<PrivacyPolicy />} />

        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/termsofservice" element={<TermsOfService />} />
        <Route path="/terms-and-conditions" element={<TermsOfService />} />
        <Route path="/termsandconditions" element={<TermsOfService />} />
        <Route path="/terms_of_service" element={<TermsOfService />} />

        <Route path="/eula" element={<EULA />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* ==========================================
            AUTHENTICATION-DEPENDENT ROUTES
           ========================================== */}
        {!session || !profile ? (
          <>
            {/* Guest / Unauthenticated routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onAuth={signIn} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            {/* Authenticated routes */}
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
              <Route path="inbox" element={<InboxPage />} />
              <Route path="crm" element={<CRMPipeline />} />
              <Route path="estimates" element={<EstimatesList />} />
              <Route path="contract/:id" element={<ContractBuilder />} />
              <Route path="estimator" element={<Estimator />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="payments" element={<PaymentTracker />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="brigades" element={<BrigadesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="pricing" element={<PricingSettings />} />
              <Route path="materials-catalog" element={<MaterialsCatalog />} />
              <Route path="interactive-catalog" element={<CatalogAdminPage />} />
              <Route path="profit-tracker" element={<ProfitTracker />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="bills" element={<BillsPage />} />
              <Route path="settings" element={<SettingsPage role={role} />} />
              <Route path="showroom" element={<ShowroomAdminPage />} />
              <Route path="ai-training" element={<AITrainingChat />} />
              <Route path="tzel-leads" element={<TzelLeadsPage />} />
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
              <Route path="inbox" element={<InboxPage />} />
              <Route path="estimator" element={<Estimator />} />
              <Route path="estimates" element={<POSEstimates />} />
              <Route path="pipeline" element={<CRMPipeline />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="clients" element={<Clients />} />
              <Route path="showroom" element={<Showroom />} />
              <Route path="catalog" element={<PublicCatalogPage />} />
              <Route path="pricing" element={<PricingSettings />} />
              <Route path="pdf-preview" element={<PDFPreview />} />
              <Route path="settings" element={<SettingsPage role={role} />} />
            </Route>

            {/* Catch-all for authenticated users */}
            <Route path="*" element={<Navigate to={roleHome[role] || '/'} replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

