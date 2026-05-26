import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Package,
  Users,
  LogOut,
  Settings,
  Image as ImageIcon,
  Menu,
  X,
  Activity,
  Calendar,
  Tag,
  FileText,
  MessageSquare
} from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';

export default function POSLayout({ onSignOut, profile }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { to: '/pos/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'),     end: false },
    { to: '/pos/inbox',     icon: MessageSquare,    label: t('nav.inbox'),         end: false },
    { to: '/pos/estimator', icon: Calculator,       label: t('nav.createEstimate'), end: false },
    { to: '/pos/estimates', icon: FileText,         label: t('nav.estimatesList'),  end: false },
    { to: '/pos/pipeline',  icon: Activity,         label: 'Pipeline',             end: false },
    { to: '/pos/calendar',  icon: Calendar,         label: t('nav.calendar'),      end: false },
    { to: '/pos/clients',   icon: Users,            label: t('crm.leads'),         end: false },
    { to: '/pos/showroom',  icon: ImageIcon,        label: t('nav.showroom'),      end: false },
    { to: '/pos/catalog',   icon: Package,          label: t('nav.clientCatalog'), end: false },
    { to: '/pos/pricing',   icon: Tag,              label: t('nav.pricing'),        end: false },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-header-brand">
          <img src="/logo-barba.png" alt="Barba Construction" className="mobile-header-logo" />
          <span className="mobile-header-title">BARBA PRO</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      <div 
        className={`admin-sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <nav className={`admin-sidebar pos-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-mark">
            <img src="/logo-barba.png" alt="Barba Construction" style={{ width: 32, height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="admin-brand">
            <span className="admin-brand-name">BARBA PRO</span>
            <span className="admin-brand-role">Ventas</span>
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
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="admin-sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div className="flex items-center justify-between mb-2">
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between w-full pt-2 border-t border-[#1e1e1e]">
            <div className="admin-user-badge">
              <div className="admin-user-avatar">
                {profile?.full_name?.[0]?.toUpperCase() || 'V'}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{profile?.full_name || 'Vendedor'}</span>
                <span className="admin-user-role">Vendedor</span>
              </div>
            </div>
            <button className="admin-logout-btn" onClick={onSignOut} title={t('nav.signout')}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

