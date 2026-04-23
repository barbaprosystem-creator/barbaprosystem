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
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/crm', icon: Users, label: 'CRM Pipeline' },
  { to: '/admin/estimates', icon: FileText, label: 'Estimados' },
  { to: '/admin/projects', icon: FolderKanban, label: 'Proyectos' },
  { to: '/admin/payments', icon: DollarSign, label: 'Pagos' },
  { to: '/admin/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/admin/pricing', icon: Tag, label: 'Motor de Precios' },
  { to: '/admin/settings', icon: Settings, label: 'Configuración' },
];

export default function AdminLayout({ profile, onSignOut }) {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-mark">
            <img src="/logo-barba.png" alt="Barba Construction" style={{ width: 32, height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="admin-brand">
            <span className="admin-brand-name">BARBA PRO</span>
            <span className="admin-brand-role">Administración</span>
          </div>
        </div>

        <ul className="admin-nav">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
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

        <div className="admin-sidebar-footer">
          <div className="admin-user-badge">
            <div className="admin-user-avatar">
              {profile?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{profile?.full_name || 'Admin'}</span>
              <span className="admin-user-role">CEO</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={onSignOut} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
