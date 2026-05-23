import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Trash2, Loader2, X, Shield, ShieldCheck, Eye, Pencil, Lock } from 'lucide-react';

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

  // Security PIN state
  const [newPin, setNewPin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pinStep, setPinStep] = useState(0); // 0: Idle, 1: OTP Sent, 2: Loading
  const [pinMessage, setPinMessage] = useState('');

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

  async function requestPinChange() {
    if (newPin.length < 4) return alert('El nuevo PIN debe tener al menos 4 dígitos.');
    setPinStep(2);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

    const { error } = await supabase.from('pin_reset_requests').insert({
      otp_code: code,
      new_pin: newPin,
      expires_at: expiresAt
    });

    if (error) {
      alert('Error en base de datos al solicitar cambio.');
      setPinStep(0);
      return;
    }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'lazaro.barba89@yahoo.es',
          subject: 'Código de Verificación - Cambio de PIN',
          html: `<div style="font-family:sans-serif;">
            <h2>Solicitud de Cambio de PIN</h2>
            <p>Se ha solicitado cambiar el PIN de acceso a las páginas restringidas del CRM.</p>
            <p>Si aprobaste este cambio y quieres que el nuevo PIN sea <strong>${newPin}</strong>, ingresa el siguiente código de autorización:</p>
            <h1 style="color:#facb00; background:#111; padding:10px; display:inline-block; border-radius:8px;">${code}</h1>
            <p>Este código expirará en 15 minutos.</p>
          </div>`
        })
      });
      if (!res.ok) throw new Error('Error al enviar correo');
      setPinStep(1);
      setPinMessage('Código enviado a lazaro.barba89@yahoo.es');
    } catch (err) {
      alert('Error al enviar el correo. Revisa la consola.');
      console.error(err);
      setPinStep(0);
    }
  }

  async function verifyOtpAndChangePin() {
    setPinStep(2);
    // Find valid OTP request
    const { data, error } = await supabase
      .from('pin_reset_requests')
      .select('*')
      .eq('otp_code', otpCode)
      .eq('new_pin', newPin)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      alert('El código es incorrecto o ha expirado.');
      setPinStep(1);
      return;
    }

    // Update PIN
    const { error: updError } = await supabase
      .from('system_settings')
      .upsert({ key: 'security_pin', value: newPin, updated_at: new Date().toISOString() });

    if (updError) {
      alert('Error actualizando el PIN.');
      setPinStep(1);
      return;
    }

    // Success
    alert('¡El PIN ha sido actualizado con éxito!');
    setPinStep(0);
    setNewPin('');
    setOtpCode('');
    setPinMessage('');
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

      {/* PIN Security Section */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h2><Lock size={20}/> Seguridad y Acceso Restringido</h2>
          <p>Cambia el PIN de acceso a Payroll, Profit Tracker y Reportes. (Requiere autorización por correo).</p>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] max-w-lg mt-4">
          {pinStep === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Nuevo PIN</label>
                <input 
                  type="text" 
                  value={newPin} 
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white text-lg tracking-widest"
                  placeholder="Ej: 2026"
                  maxLength={10}
                />
              </div>
              <button 
                className="btn-primary w-full" 
                onClick={requestPinChange}
                disabled={newPin.length < 4}
              >
                Solicitar Cambio
              </button>
            </div>
          )}

          {pinStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-[#10b981] bg-[#10b981]/10 p-3 rounded-lg text-sm mb-2 text-center border border-[#10b981]/20">
                {pinMessage}
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Código de Autorización de 6 dígitos</label>
                <input 
                  type="text" 
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white text-center text-xl tracking-[0.5em] font-bold"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setPinStep(0)}>Cancelar</button>
                <button 
                  className="btn-primary flex-1" 
                  onClick={verifyOtpAndChangePin}
                  disabled={otpCode.length !== 6}
                >
                  Verificar Código
                </button>
              </div>
            </div>
          )}

          {pinStep === 2 && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="animate-spin text-[#FACB00]" size={32}/>
              <p className="mt-2 text-gray-400">Procesando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

