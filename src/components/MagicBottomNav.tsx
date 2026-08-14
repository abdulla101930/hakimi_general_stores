import { useApp } from '../context/AppContext';
import { Home, ShoppingBag, Package } from 'lucide-react';

interface MagicBottomNavProps {
  isModalOpen?: boolean;
}

const TAB_COUNT = 3;

export function MagicBottomNav({ isModalOpen }: MagicBottomNavProps) {
  const { currentView, setView, isLoginOpen, isCartOpen, cart } = useApp();

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  if (isLoginOpen || isCartOpen || isModalOpen) return null;

  const tabs = [
    { id: 'catalog' as const, label: 'Home', icon: Home },
    { id: 'cart' as const, label: 'Cart', icon: ShoppingBag, badge: totalItems },
    { id: 'tracking' as const, label: 'Previous Orders', icon: Package }
  ];

  const activeIndex = currentView === 'cart' ? 1 : currentView === 'tracking' ? 2 : 0;
  const indicatorLeft = ((activeIndex + 0.5) / TAB_COUNT) * 100;

  const handleTabClick = (tabId: string) => {
    setView(tabId as 'catalog' | 'cart' | 'tracking');
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

          <div className="magic-indicator" style={{ left: `${indicatorLeft}%` }}>
            <div className="indicator-circle">
              {activeIndex === 0 && <Home size={22} color="#ffffff" strokeWidth={2.5} />}
              {activeIndex === 1 && (
                <span className="indicator-icon-wrap">
                  <ShoppingBag size={22} color="#ffffff" strokeWidth={2.5} />
                  {totalItems > 0 && <span className="indicator-badge">{totalItems}</span>}
                </span>
              )}
              {activeIndex === 2 && <Package size={22} color="#ffffff" strokeWidth={2.5} />}
            </div>
          </div>
        </ul>
      </nav>
    </div>
  );
}
