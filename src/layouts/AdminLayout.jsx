import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  DollarSign,
  CalendarDays,
  Settings,
  LogOut,
  BarChart3,
  Tag,
  PackageSearch,
  HardHat,
  Menu,
  X,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import GlobalChatbot from '../components/chat/GlobalChatbot';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/crm', icon: Users, label: 'CRM Pipeline' },
  { to: '/admin/estimates', icon: FileText, label: 'Estimados' },
  { to: '/admin/projects', icon: FolderKanban, label: 'Proyectos' },
  { to: '/admin/payments', icon: DollarSign, label: 'Pagos' },
  { to: '/admin/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/admin/brigades', icon: HardHat, label: 'Brigadas' },
  { to: '/admin/pricing', icon: Tag, label: 'Motor de Precios' },
  { to: '/admin/materials-catalog', icon: PackageSearch, label: 'Catálogo Interno' },
  { to: '/admin/interactive-catalog', icon: BookOpen, label: 'Catálogo de Clientes' },
  { to: '/admin/settings', icon: Settings, label: 'Configuracion' },
];

export default function AdminLayout({ profile, onSignOut }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('barba_privacy_mode') === 'true';
  });

  useEffect(() => {
    if (isPrivacyMode) {
      document.body.classList.add('privacy-mode');
    } else {
      document.body.classList.remove('privacy-mode');
    }
    localStorage.setItem('barba_privacy_mode', isPrivacyMode);
  }, [isPrivacyMode]);

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-brand">
          <img src="/logo-barba.png" alt="Barba Construction" className="mobile-header-logo" />
          <span className="mobile-header-title">BARBA PRO</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="p-2 text-[#888] hover:text-white transition-colors"
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            title={isPrivacyMode ? "Mostrar Precios" : "Ocultar Precios"}
          >
            {isPrivacyMode ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      <div 
        className={`admin-sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <nav className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-mark">
            <img src="/logo-barba.png" alt="Barba Construction" style={{ width: 32, height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="admin-brand">
            <span className="admin-brand-name">BARBA PRO</span>
            <span className="admin-brand-role">Administracion</span>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button className="md:hidden ml-auto p-1 text-[#888] hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <ul className="admin-nav">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="admin-sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
          </div>

          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-[#888888] hover:bg-[#1a1a1a] hover:text-[#e0e0e0]"
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
          >
            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            <span>{isPrivacyMode ? 'Mostrar Precios' : 'Ocultar Precios'}</span>
          </button>

          <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-[#1e1e1e]">
            <div className="admin-user-badge">
              <div className="admin-user-avatar">
                {profile?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{profile?.full_name || 'Admin'}</span>
                <span className="admin-user-role">CEO</span>
              </div>
            </div>
            <button className="admin-logout-btn" onClick={onSignOut} title="Cerrar Sesion">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="admin-main">
        <Outlet />
      </main>

      <GlobalChatbot />
    </div>
  );
}

