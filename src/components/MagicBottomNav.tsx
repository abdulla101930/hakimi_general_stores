import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, User, ShoppingBag, Package, ShieldCheck } from 'lucide-react';

interface MagicBottomNavProps {
  onOpenPWA?: () => void;
}

export const MagicBottomNav: React.FC<MagicBottomNavProps> = () => {
  const { currentView, setView, user, role, setLoginOpen, logout, cart } = useApp();

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  // Tab definitions
  const tabs = [
    { id: 'catalog', label: 'Home', icon: Home },
    { 
      id: 'profile', 
      label: user ? (role === 'owner' ? 'Owner' : 'Profile') : 'Login', 
      icon: User 
    },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: totalItems },
    { id: 'tracking', label: 'Orders', icon: Package },
    { id: 'admin', label: role === 'owner' ? 'Admin' : 'Owner', icon: ShieldCheck }
  ];

  // Determine active index for sliding indicator cutout
  const getActiveIndex = (): number => {
    if (currentView === 'catalog') return 0;
    if (currentView === 'cart') return 2;
    if (currentView === 'tracking') return 3;
    if (currentView === 'admin') return 4;
    return 0;
  };

  const activeIndex = getActiveIndex();

  const handleTabClick = (tabId: string) => {
    if (tabId === 'profile') {
      if (user) {
        if (role === 'owner') {
          setView(currentView === 'admin' ? 'catalog' : 'admin');
        } else {
          logout();
        }
      } else {
        setLoginOpen(true);
      }
    } else if (tabId === 'admin') {
      if (role === 'owner') {
        setView(currentView === 'admin' ? 'catalog' : 'admin');
      } else {
        setLoginOpen(true);
      }
    } else {
      setView(tabId as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="magic-nav-wrapper">
      <nav className="magic-navigation">
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

          {/* Smooth Curved Floating Circle Indicator */}
          <div 
            className="magic-indicator"
            style={{
              transform: `translateX(${activeIndex * 70}px)`
            }}
          >
            <div className="indicator-circle">
              {activeIndex === 0 && <Home size={22} color="#ffffff" strokeWidth={2.5} />}
              {activeIndex === 1 && <User size={22} color="#ffffff" strokeWidth={2.5} />}
              {activeIndex === 2 && (
                <div style={{ position: 'relative' }}>
                  <ShoppingBag size={22} color="#ffffff" strokeWidth={2.5} />
                  {totalItems > 0 && (
                    <span className="indicator-badge">{totalItems}</span>
                  )}
                </div>
              )}
              {activeIndex === 3 && <Package size={22} color="#ffffff" strokeWidth={2.5} />}
              {activeIndex === 4 && <ShieldCheck size={22} color="#ffffff" strokeWidth={2.5} />}
            </div>
          </div>
        </ul>
      </nav>
    </div>
  );
};
