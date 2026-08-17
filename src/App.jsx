import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import RoleGuard from './components/common/RoleGuard';
import AdminLayout from './layouts/AdminLayout';
import POSLayout from './layouts/POSLayout';

// Pages - Admin (Lazy loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const PricingSettings = lazy(() => import('./pages/admin/PricingSettings'));
const CRMPipeline = lazy(() => import('./pages/admin/CRMPipeline'));
const EstimatesList = lazy(() => import('./pages/admin/EstimatesList'));
const ProjectsList = lazy(() => import('./pages/admin/ProjectsList'));
const PaymentTracker = lazy(() => import('./pages/admin/PaymentTracker'));
const CalendarPage = lazy(() => import('./pages/admin/CalendarPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const MaterialsCatalog = lazy(() => import('./pages/admin/MaterialsCatalog'));
const CatalogAdminPage = lazy(() => import('./pages/admin/CatalogAdminPage'));
const BrigadesPage = lazy(() => import('./pages/admin/BrigadesPage'));
const ProfitTracker = lazy(() => import('./pages/admin/ProfitTracker'));
const InboxPage = lazy(() => import('./pages/admin/InboxPage'));
const PayrollPage = lazy(() => import('./pages/admin/PayrollPage'));
const ContractBuilder = lazy(() => import('./pages/admin/ContractBuilder'));
const BillsPage = lazy(() => import('./pages/admin/BillsPage'));
const ShowroomAdminPage = lazy(() => import('./pages/admin/ShowroomAdminPage'));
const AITrainingChat = lazy(() => import('./pages/admin/AITrainingChat'));
const TzelLeadsPage = lazy(() => import('./pages/admin/TzelLeadsPage'));

// Pages - Sales & Public (Lazy loaded)
const POSDashboard = lazy(() => import('./pages/POSDashboard'));
const Estimator = lazy(() => import('./pages/Estimator'));
const POSEstimates = lazy(() => import('./pages/POSEstimates'));
const Clients = lazy(() => import('./pages/Clients'));
const Showroom = lazy(() => import('./pages/Showroom'));
const PDFPreview = lazy(() => import('./pages/PDFPreview'));
const PublicCatalogPage = lazy(() => import('./pages/PublicCatalogPage'));
const PublicContract = lazy(() => import('./pages/PublicContract'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const EULA = lazy(() => import('./pages/EULA'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Public3DViewer = lazy(() => import('./pages/Public3DViewer'));

// Loading spinner
function LoadingScreen() {
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowWarning(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loading-screen" style={{ minHeight: '100dvh', background: '#0b0b0b', color: '#fff' }}>
      <div className="loading-spinner" />
      <p style={{ color: '#aaa', fontSize: '15px', fontWeight: 500 }}>Cargando Barba Pro...</p>
      {showSlowWarning && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '12px',
            padding: '8px 18px',
            background: '#FACB00',
            color: '#000',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          🔄 Recargar ahora
        </button>
      )}
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
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
    </Router>
  );
}

