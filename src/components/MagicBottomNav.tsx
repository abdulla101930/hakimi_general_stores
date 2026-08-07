import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, ShoppingBag, Package } from 'lucide-react';

interface MagicBottomNavProps {
  onOpenPWA?: () => void;
}

export const MagicBottomNav: React.FC<MagicBottomNavProps> = () => {
  const { currentView, setView, isLoginOpen, cart } = useApp();

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  // If login modal is open, hide the bottom navbar so it never overlaps the OTP box
  if (isLoginOpen) return null;

  // 3 Menus only: Home, Cart, Previous Orders
  const tabs = [
    { id: 'catalog', label: 'Home', icon: Home },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: totalItems },
    { id: 'tracking', label: 'Previous Orders', icon: Package }
  ];

  // Determine active index for sliding indicator cutout
  const getActiveIndex = (): number => {
    if (currentView === 'catalog') return 0;
    if (currentView === 'cart') return 1;
    if (currentView === 'tracking') return 2;
    return 0;
  };

  const activeIndex = getActiveIndex();

  const handleTabClick = (tabId: string) => {
    setView(tabId as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="magic-nav-wrapper">
      <nav className="magic-navigation three-tabs">
        <ul>
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeIndex === idx;

            return (
              <li 
                key={tab.id} 
                className={`magic-list-item ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <button type="button" className="magic-tab-btn" aria-label={tab.label}>
                  <span className="magic-icon-box">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="magic-cart-badge">{tab.badge}</span>
                    )}
                  </span>
                  <span className="magic-text-label">{tab.label}</span>
                </button>
              </li>
            );
          })}

          {/* Smooth Curved Floating Circle Indicator for 3 tabs (90px spacing) */}
          <div 
            className="magic-indicator"
            style={{
              transform: `translateX(${activeIndex * 90}px)`
            }}
          >
            <div className="indicator-circle">
              {activeIndex === 0 && <Home size={22} color="#ffffff" strokeWidth={2.5} />}
              {activeIndex === 1 && (
                <div style={{ position: 'relative' }}>
                  <ShoppingBag size={22} color="#ffffff" strokeWidth={2.5} />
                  {totalItems > 0 && (
                    <span className="indicator-badge">{totalItems}</span>
                  )}
                </div>
              )}
              {activeIndex === 2 && <Package size={22} color="#ffffff" strokeWidth={2.5} />}
            </div>
          </div>
        </ul>
      </nav>
    </div>
  );
};
