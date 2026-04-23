import { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await onAuth(email, password);
      if (result?.error) {
        setError(result.error.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo & Brand */}
        <div className="login-brand">
          <div className="login-logo-ring">
            <img src="/logo-barba.png" alt="Barba Construction" style={{ width: 52, height: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 className="login-title">BARBA PRO</h1>
          <p className="login-subtitle">SYSTEM</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@barba.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? (
              <Loader2 size={20} className="spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Access — DEV ONLY */}
        <div className="quick-access">
          <p className="quick-access-label">Acceso Rápido</p>
          <div className="quick-access-buttons">
            {[
              { label: '🔑 Admin', email: 'admin@barba.com', pw: 'Admin123!' },
              { label: '👷 Vendedor', email: 'vendedor@barba.com', pw: 'barba2026!' },
              { label: '🏗️ Supervisor', email: 'supervisor@barba.com', pw: 'barba2026!' },
              { label: '🏢 Oficina', email: 'oficina@barba.com', pw: 'barba2026!' },
            ].map((u) => (
              <button
                key={u.email}
                type="button"
                className="quick-access-btn"
                disabled={loading}
                onClick={async () => {
                  setEmail(u.email);
                  setPassword(u.pw);
                  setError('');
                  setLoading(true);
                  try {
                    const result = await onAuth(u.email, u.pw);
                    if (result?.error) setError(result.error.message || 'Error');
                  } catch { setError('Error de conexión'); }
                  finally { setLoading(false); }
                }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <p className="login-footer">
          Barba Construction © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
