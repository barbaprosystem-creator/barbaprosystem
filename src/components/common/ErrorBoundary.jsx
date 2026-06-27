import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App Error Boundary caught:', error, info);

    // Auto-reload on ChunkLoadError or dynamically imported module fetch errors (common after new deployments)
    const isChunkError = 
      error?.name === 'ChunkLoadError' || 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('error loading dynamically imported module') ||
      error?.message?.includes('ChunkLoadError');
      
    if (isChunkError) {
      try {
        const hasRefreshed = sessionStorage.getItem('chunk-error-refreshed') === 'true';
        if (!hasRefreshed) {
          sessionStorage.setItem('chunk-error-refreshed', 'true');
          console.warn('ChunkLoadError detected. Reloading page to fetch the latest application version...');
          window.location.reload();
        }
      } catch (e) {
        console.error('Failed to handle ChunkLoadError auto-reload:', e);
      }
    }
  }

  handleReload = () => {
    // Reset state and reload — do NOT clear localStorage/session
    this.setState({ hasError: false, error: null });
    try {
      sessionStorage.setItem('chunk-error-refreshed', 'false');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0f1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Space Grotesk', sans-serif",
          padding: '24px',
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(245,158,11,0.1)',
              border: '2px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: '32px',
            }}>
              ⚠️
            </div>

            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              Algo salió mal
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
              La aplicación encontró un error inesperado. Tu sesión y datos están seguros.
            </p>
            <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '28px', fontFamily: 'monospace', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', wordBreak: 'break-all' }}>
              {this.state.error?.message || 'Error desconocido'}
            </p>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000', fontWeight: 700, fontSize: '15px',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              }}
            >
              🔄 Recargar la aplicación
            </button>
            <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '12px' }}>
              No necesitas cerrar sesión ni borrar datos del sitio
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
