import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, LogOut, User, Share2, ShoppingBag, Download } from 'lucide-react';

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenPWA?: () => void;
  onOpenMap?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPWA,
  onOpenMap
}) => {
  const { user, logout, setLoginOpen, currentView, setView, cart, setCartOpen, selectedAddress } = useApp();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Hakimi General Stores & Supermarket',
        text: 'Order fresh groceries, food, and hygiene products delivered in minutes!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Application link copied to clipboard!');
    }
  };

  const totalCartItems = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <header className="header-container" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Brand Logo & Name */}
        <div 
          onClick={() => currentView !== 'admin' && setView('catalog')}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '18px', 
            fontWeight: 800, 
            margin: 0,
            color: 'var(--primary)',
            letterSpacing: '-0.5px'
          }}>
            HAKIMI <span style={{ color: '#0f172a' }}>STORES</span>
          </h1>
          <div 
            onClick={(e) => { e.stopPropagation(); onOpenMap?.(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, cursor: 'pointer' }}
          >
            <MapPin size={12} color="var(--primary)" />
            <span style={{ 
              fontSize: '10px', 
              color: 'var(--text-secondary)',
              maxWidth: '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600
            }}>
              {selectedAddress ? selectedAddress.details : 'Pin Delivery Location'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Download PWA App Button */}
          <button 
            type="button"
            onClick={onOpenPWA}
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              borderRadius: '20px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Download App"
          >
            <Download size={13} />
            <span>App</span>
          </button>

          {currentView === 'catalog' && totalCartItems > 0 && (
            <button 
              onClick={() => setCartOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '6px'
              }}
            >
              <ShoppingBag size={20} color="var(--primary)" />
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: '16px'
              }}>
                {totalCartItems}
              </span>
            </button>
          )}

          <button 
            onClick={handleShare}
            className="btn-icon-action"
            title="Share App"
          >
            <Share2 size={16} />
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'var(--bg-input)',
                padding: '4px 8px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)'
              }}>
                <User size={13} color="var(--primary)" />
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-secondary)',
                  maxWidth: '55px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600
                }}>
                  {user.phone === '+919657152532' || user.phone === '9657152532' ? 'Owner' : user.name.split(' ')[0]}
                </span>
              </div>
              <button 
                onClick={logout} 
                className="btn-icon-action" 
                title="Log Out"
                style={{ color: 'var(--error)' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setLoginOpen(true)}
              style={{
                backgroundColor: 'var(--primary)',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <User size={12} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
