import { Component, type ErrorInfo, type ReactNode } from 'react';
import { resetAppStorageAndReload } from '../lib/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="eb-page">
          <div className="eb-card">
            <div className="eb-emoji">🛍️</div>
            <h2 className="eb-title">Hakimi Supermarket</h2>
            <h3 className="eb-subtitle">Restoring App Session</h3>
            <p className="eb-desc">
              We detected cached session data that needs to be refreshed. Tap below to automatically clear old cache
              and restore smooth performance.
            </p>
            <button type="button" className="eb-btn" onClick={resetAppStorageAndReload}>
              <span>✨</span> Fix & Reload App
            </button>
            {this.state.error && (
              <details className="eb-details">
                <summary>Technical error info</summary>
                <pre className="eb-pre">{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
