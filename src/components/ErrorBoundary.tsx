import { Component, type ErrorInfo, type ReactNode } from 'react';
import { resetAppStorageAndReload } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  private handleReset = () => {
    resetAppStorageAndReload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️</div>
            
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#60a5fa' }}>
              Hakimi Supermarket
            </h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#f87171' }}>
              Restoring App Session
            </h3>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              We detected cached session data that needs to be refreshed. Tap below to automatically clear old cache and restore smooth performance.
            </p>

            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'transform 0.1s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>✨</span> Fix & Reload App
            </button>

            {this.state.error && (
              <details style={{ marginTop: '20px', textAlign: 'left', fontSize: '11px', color: '#64748b' }}>
                <summary style={{ cursor: 'pointer', outline: 'none' }}>Technical error info</summary>
                <pre style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#0f172a',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
