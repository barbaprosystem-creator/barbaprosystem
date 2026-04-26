import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Trash2, Loader2, X, Shield, ShieldCheck, Eye, Pencil } from 'lucide-react';

const ROLE_MAP = {
  admin: { label: 'Administrador', color: '#ef4444' },
  office: { label: 'Oficina', color: '#3b82f6' },
  salesperson: { label: 'Vendedor', color: '#10b981' },
  supervisor: { label: 'Supervisor', color: '#f59e0b' },
};

export default function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    setUsers(data || []);
    setLoading(false);
  }

  async function updateRole(userId, newRole) {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchUsers();
  }

  return (
    <div className="settings-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>Configuracion</h1></div>
      </div>

      {/* User Management */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2><Users size={20}/> Gestion de Usuarios</h2>
            <p>Administra los usuarios y sus roles en el sistema</p>
          </div>
        </div>

        <div className="crm-list">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="crm-list-row">
                  <td className="lead-name-cell">
                    <div className="user-info">
                      <div className="user-avatar">{user.full_name?.[0] || '?'}</div>
                      <span>{user.full_name}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value)}
                      style={{ borderColor: ROLE_MAP[user.role]?.color }}
                    >
                      {Object.entries(ROLE_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('es')}</td>
                  <td>
                    <span className="stage-badge" style={{ background: ROLE_MAP[user.role]?.color }}>
                      {ROLE_MAP[user.role]?.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="settings-note">
          <Shield size={16}/>
          <p>Para crear nuevos usuarios, usa el panel de Supabase Auth o el script <code>scripts/create-users.js</code></p>
        </div>
      </div>

      {/* System Config */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h2><ShieldCheck size={20}/> Configuracion del Sistema</h2>
        </div>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Nombre de Empresa</label>
            <input value="Barba Construction" disabled/>
          </div>
          <div className="setting-item">
            <label>Moneda</label>
            <input value="USD ($)" disabled/>
          </div>
          <div className="setting-item">
            <label>Zona Horaria</label>
            <input value="America/New_York (EST)" disabled/>
          </div>
          <div className="setting-item">
            <label>Financiamiento</label>
            <a href="https://www.servifinancial.com" target="_blank" rel="noopener" className="btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:8}}>
              Servi Financial &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

