import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  Package,
  Users,
  LogOut,
  Settings,
  Image as ImageIcon
} from 'lucide-react';

const navItems = [
  { to: '/pos/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: false },
  { to: '/pos/estimator', icon: Calculator, label: 'Nuevo Estimado', end: false },
  { to: '/pos/materials', icon: Package, label: 'Materiales', end: false },
  { to: '/pos/clients', icon: Users, label: 'Clientes', end: false },
  { to: '/pos/showroom', icon: ImageIcon, label: 'Showroom', end: false },
];

export default function POSLayout({ onSignOut, profile }) {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar pos-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-mark">
            <img src="/logo-barba.png" alt="Barba Construction" style={{ width: 32, height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="admin-brand">
            <span className="admin-brand-name">BARBA PRO</span>
            <span className="admin-brand-role">Ventas</span>
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
              {profile?.full_name?.[0]?.toUpperCase() || 'V'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{profile?.full_name || 'Vendedor'}</span>
              <span className="admin-user-role">Vendedor</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={onSignOut} title="Cerrar Sesion">
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

