import { useApp } from '../context/AppContext';
import { calculateDeliveryMetrics } from '../lib/geo';
import { User, Download, ChevronDown, MapPin } from 'lucide-react';

interface NavbarProps {
  onOpenPWA?: () => void;
  onOpenMap?: () => void;
}

export function Navbar({ onOpenPWA, onOpenMap }: NavbarProps) {
  const { user, role, logout, setLoginOpen, currentView, setView, selectedAddress } = useApp();

  const { timeText, distanceText } = calculateDeliveryMetrics(selectedAddress?.gps, selectedAddress?.details);

  return (
    <header className="blinkit-header">
      <div className="blinkit-top-header-banner">
        <div className="blinkit-header-row">
          <div className="blinkit-brand-title-group">
            <span className="blinkit-brand-sub">Hakimi General Store in</span>
            <h1 className="blinkit-header-main-title">
              {timeText}
              <span className="blinkit-distance-badge">
                <MapPin size={10} color="#1d4ed8" fill="#1d4ed8" />
                {distanceText}
              </span>
            </h1>
            <div
              className="blinkit-location-subtitle"
              onClick={onOpenMap}
              title="Click to select delivery location"
              role="button"
            >
              <span className="blinkit-location-type">
                {selectedAddress ? `${selectedAddress.type} - ` : 'HOME - '}
              </span>
              <span className="blinkit-location-text">
                {selectedAddress ? selectedAddress.details : '93 Shirien Manzil near HDFC Bank, Ratlam'}
              </span>
              <ChevronDown size={14} color="#64748b" className="blinkit-location-chevron" />
            </div>
          </div>

          <div className="blinkit-header-user-actions">
            <button
              type="button"
              className="blinkit-wallet-badge"
              onClick={onOpenPWA}
              title="Download App"
            >
              <Download size={12} />
              <span>App</span>
            </button>

            <button
              type="button"
              className="blinkit-user-avatar-btn"
              onClick={() => {
                if (user) {
                  if (role === 'owner') {
                    setView(currentView === 'admin' ? 'catalog' : 'admin');
                  } else {
                    logout();
                  }
                } else {
                  setLoginOpen(true);
                }
              }}
              title={user ? (role === 'owner' ? 'Owner Portal' : 'Logout') : 'Login'}
            >
              <User size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
