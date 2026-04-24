import { NavLink, Outlet } from 'react-router-dom';
import {
  FolderKanban,
  Camera,
  CalendarDays,
  LogOut,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { to: '/projects', icon: FolderKanban, label: 'Mis Proyectos', end: true },
  { to: '/projects/reports', icon: ClipboardList, label: 'Reportes Diarios' },
  { to: '/projects/photos', icon: Camera, label: 'Fotos' },
  { to: '/projects/calendar', icon: CalendarDays, label: 'Agenda' },
];

export default function SupervisorLayout({ profile, onSignOut }) {
  return (
    <div className="admin-layout">
      <nav className="admin-sidebar supervisor-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-mark">
            <img src="/logo-barba.png" alt="Barba Construction" style={{ width: 32, height: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="admin-brand">
            <span className="admin-brand-name">BARBA PRO</span>
            <span className="admin-brand-role">Supervisor de Campo</span>
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
              {profile?.full_name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{profile?.full_name || 'Supervisor'}</span>
              <span className="admin-user-role">Supervisor</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={onSignOut} title="Cerrar SesiÃ³n">
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

