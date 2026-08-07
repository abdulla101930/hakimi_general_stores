import React from 'react';
import { useApp } from '../context/AppContext';
import { User, Download, ChevronDown, MapPin, Wallet } from 'lucide-react';

interface NavbarProps {
  onOpenPWA?: () => void;
  onOpenMap?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPWA,
  onOpenMap
}) => {
  const { user, role, logout, setLoginOpen, currentView, setView, selectedAddress } = useApp();

  return (
    <header className="blinkit-header">
      <div className="blinkit-top-header-banner">
        <div className="blinkit-header-row">
          {/* Brand Name & Delivery Time Header */}
          <div className="blinkit-brand-title-group">
            <span className="blinkit-brand-sub">Hakimi General Store in</span>
            <h1 className="blinkit-header-main-title">
              8 minutes
              <span className="blinkit-distance-badge">
                <MapPin size={10} color="#1d4ed8" fill="#1d4ed8" />
                1 km away
              </span>
            </h1>
            <div 
              className="blinkit-location-subtitle"
              onClick={onOpenMap}
              title="Click to select delivery location"
            >
              <span style={{ color: '#0f172a', fontWeight: 800 }}>
                {selectedAddress ? `${selectedAddress.type} - ` : 'HOME - '}
              </span>
              <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {selectedAddress ? selectedAddress.details : '93 Shirien Manzil near HDFC Bank, Ratlam'}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </div>
          </div>

          {/* Right Action Icons: Wallet & User Profile */}
          <div className="blinkit-header-user-actions">
            {/* Download PWA App */}
            <button 
              type="button"
              className="blinkit-wallet-badge"
              onClick={onOpenPWA}
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer' }}
              title="Download App"
            >
              <Download size={12} />
              <span>App</span>
            </button>

            {/* Wallet badge */}
            <div className="blinkit-wallet-badge">
              <Wallet size={12} color="#2563eb" />
              <span>₹0</span>
            </div>

            {/* Account / User Avatar */}
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
};
