import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

console.log('=== MAIN.TSX LOADING ===');

// Simple Loading/Error Component
const BootLoader = () => {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('Loading App module...');
        console.log('Loading App module...');
        const { default: App } = await import('./App.tsx');

        setStatus('Loading ErrorBoundary...');
        console.log('Loading ErrorBoundary...');
        const { ErrorBoundary } = await import('./components/ErrorBoundary');

        setStatus('Loading CSS...');
        console.log('Loading CSS...');
        await import('./index.css');

        setStatus('Rendering...');

        // render the full app replacing this loader
        root.render(
          <React.StrictMode>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </React.StrictMode>
        );
        console.log('Full app mounted!');
      } catch (e: any) {
        console.error('Failed to load full app:', e);
        setError(e.toString() + "\n" + (e.stack || ''));
      }
    };

    // Small delay to ensure initial render is seen
    setTimeout(init, 100);
  }, []);

  if (error) {
    return (
      <div style={{
        background: '#1e293b',
        color: 'white',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem'
      }}>
        <h1 style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }}>Load Error</h1>
        <pre style={{
          background: '#0f172a',
          padding: '1rem',
          borderRadius: '8px',
          maxWidth: '100%',
          overflow: 'auto',
          color: '#f87171',
          fontFamily: 'monospace'
        }}>
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      color: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Saturn Browser</h1>
      <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{status}</p>
      <div style={{
        marginTop: '2rem',
        width: '200px',
        height: '4px',
        background: '#334155',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '50%',
          height: '100%',
          background: '#3b82f6',
          animation: 'indeterminate 1.5s infinite linear'
        }} />
      </div>
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

// Singleton root
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootEl);
root.render(<BootLoader />);

// IPC Listener
// @ts-ignore
if (window.ipcRenderer) {
  // @ts-ignore
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log('[Main Process]:', message)
  })
}

