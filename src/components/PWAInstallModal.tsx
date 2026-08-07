import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, PlusSquare, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for Android / Chrome PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("Application install trigger sent to browser. If no pop-up appeared, open browser options and select 'Add to Home Screen'.");
    }
  };

  return (
    <>
      <div className="drawer-backdrop active" style={{ zIndex: 300 }} onClick={onClose} />
      <div className="drawer-content active" style={{ zIndex: 301, maxHeight: '80%' }}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={20} color="var(--primary)" />
            <h3 className="drawer-title">Download Hakimi App</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="scrollable" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#eff6ff',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            border: '2px solid var(--primary)',
            fontSize: '32px'
          }}>
            🛒
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Hakimi Supermarket Mobile App
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
            Install our lightweight app on your phone for instant grocery orders, live tracking & offline access!
          </p>

          {installed ? (
            <div style={{
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              padding: '12px',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <Check size={18} />
              <span>App is already installed on your device!</span>
            </div>
          ) : isIOS ? (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              padding: '14px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                🍎 Instructions for iPhone & iPad (Safari):
              </h4>
              <ol style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: '1.8' }}>
                <li>Tap the <strong>Share button</strong> <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> at the bottom of Safari screen.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Tap <strong>Add</strong> on the top right to download app to your home screen!</li>
              </ol>
            </div>
          ) : (
            <div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleInstallClick}
                style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              >
                <Download size={18} />
                <span>Install App on Device</span>
              </button>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Works on Android, Windows, and Chrome devices.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
