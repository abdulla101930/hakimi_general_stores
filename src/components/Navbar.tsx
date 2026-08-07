import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, User, Download, ChevronDown, Zap } from 'lucide-react';

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
      <div className="blinkit-header-top">
        {/* Brand & Delivery Location Picker */}
        <div className="brand-location-box">
          <div className="brand-delivery-tag">
            <Zap size={11} fill="#d97706" color="#d97706" />
            <span>Delivery in 8 Mins</span>
          </div>

          <button 
            type="button"
            className="location-picker-btn"
            onClick={onOpenMap}
            title="Click to change location"
          >
            <MapPin size={14} color="var(--primary)" />
            <span style={{ fontWeight: 800 }}>
              {selectedAddress ? `${selectedAddress.type}: ` : 'Location: '}
            </span>
            <span>
              {selectedAddress ? selectedAddress.details : 'Select Location'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>
        </div>

        {/* Right Header Actions */}
        <div className="header-actions">
          {/* Download Mobile PWA Button */}
          <button 
            type="button"
            className="btn-header-icon"
            onClick={onOpenPWA}
          >
            <Download size={14} />
            <span>App</span>
          </button>

          {/* User Account / Merchant Switcher */}
          {user ? (
            <button 
              type="button"
              className="btn-header-icon"
              onClick={() => {
                if (role === 'owner') {
                  setView(currentView === 'admin' ? 'catalog' : 'admin');
                } else {
                  logout();
                }
              }}
              style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
            >
              <User size={14} />
              <span>{role === 'owner' ? (currentView === 'admin' ? 'Store Catalog' : 'Owner Portal') : 'Account'}</span>
            </button>
          ) : (
            <button 
              type="button"
              className="btn-header-icon"
              onClick={() => setLoginOpen(true)}
              style={{ background: 'var(--primary)', color: '#ffffff', border: 'none' }}
            >
              <User size={14} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
