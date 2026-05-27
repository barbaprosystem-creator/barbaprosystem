import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Plus, Trash2, Loader2, X, Shield, ShieldCheck, Eye, Pencil, Lock } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const ROLE_MAP = {
  admin: { label: 'Administrator', color: '#ef4444' },
  office: { label: 'Office', color: '#3b82f6' },
  salesperson: { label: 'Salesperson', color: '#10b981' },
  supervisor: { label: 'Supervisor', color: '#f59e0b' },
};

export default function SettingsPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Security PIN state
  const [newPin, setNewPin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pinStep, setPinStep] = useState(0); // 0: Idle, 1: OTP Sent, 2: Loading
  const [pinMessage, setPinMessage] = useState('');

  // Change Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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
    if (newPin.length < 4) return alert('The new PIN must be at least 4 digits long.');
    setPinStep(2);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

    const { error } = await supabase.from('pin_reset_requests').insert({
      otp_code: code,
      new_pin: newPin,
      expires_at: expiresAt
    });

    if (error) {
      alert('Database error requesting PIN change.');
      setPinStep(0);
      return;
    }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'lazaro.barba89@yahoo.es',
          subject: 'Verification Code - PIN Change',
          html: `<div style="font-family:sans-serif;">
            <h2>PIN Change Request</h2>
            <p>A request was made to change the security PIN for restricted pages in the CRM.</p>
            <p>If you approved this change and want the new PIN to be <strong>${newPin}</strong>, enter the following authorization code:</p>
            <h1 style="color:#facb00; background:#111; padding:10px; display:inline-block; border-radius:8px;">${code}</h1>
            <p>This code will expire in 15 minutes.</p>
          </div>`
        })
      });
      if (!res.ok) throw new Error('Error sending email');
      setPinStep(1);
      setPinMessage('Code sent to lazaro.barba89@yahoo.es');
    } catch (err) {
      alert('Error sending email. Please check the console.');
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
      alert('The code is incorrect or has expired.');
      setPinStep(1);
      return;
    }

    // Update PIN
    const { error: updError } = await supabase
      .from('system_settings')
      .upsert({ key: 'security_pin', value: newPin, updated_at: new Date().toISOString() });

    if (updError) {
      alert('Error updating the PIN.');
      setPinStep(1);
      return;
    }

    // Success
    alert('The PIN has been updated successfully!');
    setPinStep(0);
    setNewPin('');
    setOtpCode('');
    setPinMessage('');
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert('Error changing password: ' + err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="crm-toolbar">
        <div className="crm-toolbar-left"><h1>{t('settings.title')}</h1></div>
      </div>

      {/* User Management */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2><Users size={20}/> User Management</h2>
            <p>Manage users and their roles in the system</p>
          </div>
        </div>

        <div className="crm-list">
          <table>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>Role</th>
                <th>{t('common.date')}</th>
                <th>{t('common.actions')}</th>
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
                  <td>{new Date(user.created_at).toLocaleDateString('en-US')}</td>
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
          <p>To create new users, use the Supabase Auth panel or the <code>scripts/create-users.js</code> script</p>
        </div>
      </div>

      {/* System Config */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h2><ShieldCheck size={20}/> System Configuration</h2>
        </div>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Company Name</label>
            <input value="Barba Construction" disabled/>
          </div>
          <div className="setting-item">
            <label>Currency</label>
            <input value="USD ($)" disabled/>
          </div>
          <div className="setting-item">
            <label>Time Zone</label>
            <input value="America/New_York (EST)" disabled/>
          </div>
          <div className="setting-item">
            <label>Financing</label>
            <a href="https://www.servifinancial.com" target="_blank" rel="noopener" className="btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:8}}>
              Servi Financial &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* PIN Security Section */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h2><Lock size={20}/> Security & Restricted Access</h2>
          <p>Change the PIN for accessing Payroll, Profit Tracker, and Reports. (Requires email authorization).</p>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] max-w-lg mt-4">
          {pinStep === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">New PIN</label>
                <input 
                  type="text" 
                  value={newPin} 
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white text-lg tracking-widest"
                  placeholder="e.g., 2026"
                  maxLength={10}
                />
              </div>
              <button 
                className="btn-primary w-full" 
                onClick={requestPinChange}
                disabled={newPin.length < 4}
              >
                Request Change
              </button>
            </div>
          )}

          {pinStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-[#10b981] bg-[#10b981]/10 p-3 rounded-lg text-sm mb-2 text-center border border-[#10b981]/20">
                {pinMessage}
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">6-digit Authorization Code</label>
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
                <button className="btn-secondary flex-1" onClick={() => setPinStep(0)}>Cancel</button>
                <button 
                  className="btn-primary flex-1" 
                  onClick={verifyOtpAndChangePin}
                  disabled={otpCode.length !== 6}
                >
                  Verify Code
                </button>
              </div>
            </div>
          )}

          {pinStep === 2 && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="animate-spin text-[#FACB00]" size={32}/>
              <p className="mt-2 text-gray-400">Processing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h2><Lock size={20}/> Change Password</h2>
          <p>Update your personal account password for accessing the CRM.</p>
        </div>
        <form onSubmit={handlePasswordChange} className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333] max-w-lg mt-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">New Password</label>
            <input 
              required
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--accent)]"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Confirm New Password</label>
            <input 
              required
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-white outline-none focus:border-[var(--accent)]"
              placeholder="Confirm password"
            />
          </div>
          <button 
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2" 
            disabled={changingPassword || newPassword.length < 6 || confirmPassword.length < 6}
          >
            {changingPassword ? <Loader2 className="animate-spin" size={16}/> : <Lock size={16}/>}
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
