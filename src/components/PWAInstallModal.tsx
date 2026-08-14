import { X, Download, Smartphone, Share, PlusSquare, Check, MoreVertical } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  const { installed, isIOS, showManualGuide, handleInstallClick } = usePwaInstall();

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop active" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="drawer-content active" style={{ zIndex: 9995, maxHeight: '85%' }}>
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
            className="pwa-logo-img"
          />

          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            Hakimi General Store Ratlam
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
            Install our fast mobile app on your home screen for instant ordering & live delivery updates!
          </p>

          {installed ? (
            <div className="pwa-installed-banner">
              <Check size={18} />
              <span>App is installed on your device!</span>
            </div>
          ) : isIOS ? (
            <div className="pwa-ios-guide">
              <h4>
                🍎 iPhone & iPad Instructions (Safari):
              </h4>
              <ol>
                <li>
                  Tap the <strong>Share icon</strong> <Share size={14} className="pwa-inline-icon" /> in Safari.
                </li>
                <li>
                  Scroll down & tap <strong>"Add to Home Screen"</strong> <PlusSquare size={14} className="pwa-inline-icon" />.
                </li>
                <li>
                  Tap <strong>Add</strong> in top right!
                </li>
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
                <div className="pwa-manual-guide">
                  <h4>
                    <MoreVertical size={14} />
                    <span>How to Add to Home Screen in Chrome:</span>
                  </h4>
                  <ol>
                    <li>
                      Tap the <strong>3 dots menu (⋮)</strong> in your browser top-right corner.
                    </li>
                    <li>
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </li>
                    <li>
                      Confirm <strong>Install</strong> to get the app icon on your phone!
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
