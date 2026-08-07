import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { LoginModal } from './components/LoginModal';
import { DeliveryTracking } from './components/DeliveryTracking';
import { OwnerDashboard } from './components/OwnerDashboard';
import { MapPickerModal } from './components/MapPickerModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { DevLogsModal } from './components/DevLogsModal';
import { FloatingBottomNav } from './components/FloatingBottomNav';
import { ArrowRight } from 'lucide-react';
import type { Address } from './context/AppContext';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

const MainLayout: React.FC = () => {
  const { currentView, cart, setCartOpen, activeOrder, setView, role, orders, addNewAddress, setSelectedAddress, catalog } = useApp();
  
  // Modals state
  const [isMapOpen, setMapOpen] = useState(false);
  const [isPWAOpen, setPWAOpen] = useState(false);
  const [isDevLogsOpen, setDevLogsOpen] = useState(false);

  // Notification states
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOrderStatus, setLastOrderStatus] = useState<string | null>(null);
  const [lastOrdersCount, setLastOrdersCount] = useState<number | null>(null);

  // Developer Audit Console Trigger Listeners
  useEffect(() => {
    const triggerLogs = () => {
      setDevLogsOpen(true);
      return "Opening Developer Audit Console...";
    };

    // Attach to global window
    Object.defineProperty(window, 'showDevLogs', {
      value: triggerLogs,
      writable: true,
      configurable: true
    });
    (window as any).__HAKIMI_DEV_LOGS__ = triggerLogs;
    (window as any).devlogs = triggerLogs;

    // Log developer welcome message in browser console once
    console.log(
      "%c[DEVELOPER AUDIT SYSTEM ACTIVE] %cType %cshowDevLogs()%c or press %cCtrl+Shift+L%c or add %c#devlogs%c to URL to inspect owner logs.",
      "color: #2563eb; font-weight: bold;",
      "color: #475569;",
      "color: #10b981; font-weight: bold; font-family: monospace;",
      "color: #475569;",
      "color: #f59e0b; font-weight: bold;",
      "color: #475569;",
      "color: #8b5cf6; font-weight: bold; font-family: monospace;",
      "color: #475569;"
    );

    // 2. Keyboard shortcut (Ctrl + Shift + L)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setDevLogsOpen(prev => !prev);
      }
    };

    // 3. Hash listener (#devlogs)
    const checkHash = () => {
      if (window.location.hash === '#devlogs') {
        setDevLogsOpen(true);
      }
    };
    checkHash();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', checkHash);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  // Calculate cart subtotal & item count for floating cart bar
  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = catalog.find(prod => prod.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  // Request browser Notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = (isOwnerAlert = false) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

      if (isOwnerAlert) {
        const osc2 = audioCtx.createOscillator();
        osc2.connect(gainNode);
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12);
        osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.12);
        
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      } else {
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      }
      
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio feedback blocked by browser settings:", e);
    }
  };

  const addToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    playNotificationSound(type === 'info');

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    if (!activeOrder) {
      setLastOrderStatus(null);
      return;
    }

    if (lastOrderStatus && activeOrder.status !== lastOrderStatus) {
      let message = '';
      if (activeOrder.status === 'packing') {
        message = '📦 Order Confirmed: Hakimi staff is packing your items!';
      } else if (activeOrder.status === 'out_for_delivery') {
        message = '🛵 Order Out: Delivery partner is on their way!';
      } else if (activeOrder.status === 'delivered') {
        message = '🎁 Order Arrived: Thank you for shopping with Hakimi!';
      }

      if (message) {
        addToast(message, 'success');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Hakimi Supermarket', { body: message, icon: '/favicon.svg' });
        }
      }
    }
    setLastOrderStatus(activeOrder.status);
  }, [activeOrder?.status]);

  useEffect(() => {
    if (role !== 'owner') return;

    if (lastOrdersCount !== null && orders.length > lastOrdersCount) {
      const newestOrder = orders[0];
      const alertMsg = `🔔 NEW ORDER #${newestOrder?.id} received! (₹${newestOrder?.bill.grandTotal})`;
      addToast(alertMsg, 'info');

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Hakimi Supermarket - New Order!', {
          body: `${newestOrder?.customerName} placed an order for ₹${newestOrder?.bill.grandTotal}`,
          icon: '/favicon.svg'
        });
      }
    }
    setLastOrdersCount(orders.length);
  }, [orders.length, role]);

  const handleSelectMapAddress = (addr: Address) => {
    addNewAddress(addr);
    setSelectedAddress(addr);
    addToast('📍 Delivery pin & location address updated!', 'success');
  };

  return (
    <div className="app-shell">
      {/* Toast Banners */}
      <div style={{
        position: 'fixed',
        top: '12px',
        left: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: toast.type === 'success' ? '4px solid #16a34a' : '4px solid #2563eb',
            }}
          >
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                opacity: 0.6,
                cursor: 'pointer',
                marginLeft: '10px',
                fontWeight: 700,
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Main View Area */}
      {currentView === 'admin' ? (
        <OwnerDashboard />
      ) : currentView === 'tracking' ? (
        <DeliveryTracking />
      ) : (
        <>
          {/* Header */}
          <Navbar 
            onOpenPWA={() => setPWAOpen(true)}
            onOpenMap={() => setMapOpen(true)}
          />
          
          {/* Scrollable Product Catalog Section */}
          <div className="main-content-scroll">
            <Catalog />
          </div>

          {/* Active Order Tracker Banner */}
          {activeOrder && (
            <div 
              onClick={() => setView('tracking')}
              style={{
                position: 'fixed',
                bottom: totalItems > 0 ? '84px' : '20px',
                left: '16px',
                right: '16px',
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: 'rgba(37, 99, 235, 0.96)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 45
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '20px' }}>🛵</span>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, margin: 0 }}>Active Delivery in Progress</h4>
                  <p style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>Status: {activeOrder.status.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                Track <ArrowRight size={12} />
              </span>
            </div>
          )}

          {/* Blinkit Style Floating Cart Trigger */}
          {totalItems > 0 && (
            <div className="floating-cart-bar" onClick={() => setCartOpen(true)}>
              <div className="cart-bar-left">
                <div className="cart-count-badge">
                  {totalItems}
                </div>
                <div className="cart-bar-details">
                  <span className="cart-bar-title">{totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}</span>
                  <span className="cart-bar-subtitle">₹{cartSubtotal} + Taxes & Charges</span>
                </div>
              </div>
              <div className="cart-bar-right">
                <span>View Cart</span>
                <ArrowRight size={16} strokeWidth={3} />
              </div>
            </div>
          )}

          {/* Floating Bottom Nav Bar */}
          <FloatingBottomNav onOpenCart={() => setCartOpen(true)} />
        </>
      )}

      {/* Drawers and Modals */}
      <Cart onOpenMap={() => setMapOpen(true)} />
      <LoginModal />
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setMapOpen(false)}
        onSelectAddress={handleSelectMapAddress}
      />
      <PWAInstallModal
        isOpen={isPWAOpen}
        onClose={() => setPWAOpen(false)}
      />
      <DevLogsModal
        isOpen={isDevLogsOpen}
        onClose={() => setDevLogsOpen(false)}
      />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
