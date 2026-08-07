import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, PlusSquare, Check, MoreVertical } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
        }
        setDeferredPrompt(null);
        (window as any).deferredPwaPrompt = null;
      } catch (err) {
        console.error('Install prompt error:', err);
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  return (
    <>
      <div className="drawer-backdrop active" style={{ zIndex: 300 }} onClick={onClose} />
      <div className="drawer-content active" style={{ zIndex: 301, maxHeight: '85%' }}>
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
          <img 
            src="./logo.png" 
            alt="Hakimi General Store Logo"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 12px',
              border: '3px solid var(--primary)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2)'
            }}
          />

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            Hakimi General Store Ratlam
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
            Install our fast mobile app on your home screen for instant ordering & live delivery updates!
          </p>

          {installed ? (
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <Check size={18} />
              <span>App is installed on your device!</span>
            </div>
          ) : isIOS ? (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              textAlign: 'left'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                🍎 iPhone & iPad Instructions (Safari):
              </h4>
              <ol style={{ fontSize: '12px', color: 'var(--text-main)', paddingLeft: '18px', lineHeight: '1.8' }}>
                <li>Tap the <strong>Share icon</strong> <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> in Safari.</li>
                <li>Scroll down & tap <strong>"Add to Home Screen"</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.</li>
                <li>Tap <strong>Add</strong> in top right!</li>
              </ol>
            </div>
          ) : (
            <div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleInstallClick}
                style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '12px' }}
              >
                <Download size={18} />
                <span>Install App Directly</span>
              </button>

              {showManualGuide && (
                <div style={{
                  backgroundColor: '#fffbebfb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  textAlign: 'left',
                  marginTop: '8px'
                }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MoreVertical size={14} />
                    <span>How to Add to Home Screen in Chrome:</span>
                  </h4>
                  <ol style={{ fontSize: '11px', color: '#92400e', paddingLeft: '16px', lineHeight: '1.6' }}>
                    <li>Tap the <strong>3 dots menu (⋮)</strong> in your browser top-right corner.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>Confirm <strong>Install</strong> to get the app icon on your phone!</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
