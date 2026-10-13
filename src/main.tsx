import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { sanitizeAppStorage } from './lib/storage.ts';

sanitizeAppStorage();

const SW_VERSION = 'v10-location-maps';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`./sw.js?version=${SW_VERSION}`)
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => console.warn('Service worker registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if (typeof window !== 'undefined' && typeof (window as any).__hideBootSplash === 'function') {
  setTimeout(() => {
    (window as any).__hideBootSplash?.();
  }, 100);
}

