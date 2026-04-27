import { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage({ onAuth }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await onAuth(email, password);
      if (result?.error) setError(result.error.message || 'Credenciales invalidas');
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const quickUsers = [
    { label: 'Admin',      email: 'admin@barba.com',      pw: 'Admin123!' },
    { label: 'Vendedor',   email: 'ventas1@barba.com',    pw: 'Ventas123!' },
    { label: 'Oficina',    email: 'office@barba.com',     pw: 'Office123!' },
  ];

  return (
    <div className="login-page">

      {/* LEFT - Brand Panel */}
      <div className="login-left">
        <div className="login-brand-mark">
          <img
            src="/logo-barba.png"
            alt="Barba Construction"
            className="login-logo-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="login-brand-text">
            <h1>Barba Construction</h1>
            <span>Pro System</span>
          </div>
        </div>

        <div className="login-headline">
          Gestion<br />
          <em>inteligente</em><br />
          de obras
        </div>

        <p className="login-tagline">
          Estimaciones, proyectos, clientes y<br />
          pagos &mdash; todo en un solo lugar.
        </p>

        <div className="login-services">
          {['Roofing', 'Siding', 'Windows', 'Gutters'].map(s => (
            <span key={s} className="login-service-tag">{s}</span>
          ))}
        </div>
      </div>

      {/* RIGHT - Form Panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-gold-line" />
            <h2>Iniciar Sesion</h2>
            <p>Accede a tu panel de control</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@barba.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contrasena</label>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <>
                  <LogIn size={17} />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access */}
          <div className="quick-access">
            <p className="quick-access-label">Acceso Rapido</p>
            <div className="quick-access-buttons">
              {quickUsers.map((u) => (
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
                    } catch {
                      setError('Error de conexion');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <p className="login-footer">
            Barba Construction &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}