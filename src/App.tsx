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
import { ShoppingBag, ArrowRight } from 'lucide-react';
import type { Address } from './context/AppContext';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

const MainLayout: React.FC = () => {
  const { currentView, cart, setCartOpen, activeOrder, setView, role, orders, addNewAddress, setSelectedAddress } = useApp();
  
  // Modals state
  const [isMapOpen, setMapOpen] = useState(false);
  const [isPWAOpen, setPWAOpen] = useState(false);

  // Notification states
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOrderStatus, setLastOrderStatus] = useState<string | null>(null);
  const [lastOrdersCount, setLastOrdersCount] = useState<number | null>(null);

  // Request browser Notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Audio helper function to trigger HTML5 beep alerts dynamically
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

  // 1. Customer: Listen for status updates of active order
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

  // 2. Owner: Real-time alert when new customer order arrives
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

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  const handleSelectMapAddress = (addr: Address) => {
    addNewAddress(addr);
    setSelectedAddress(addr);
    addToast('📍 Delivery pin & location address updated!', 'success');
  };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>

      {/* Global In-App Toast Banners */}
      <div style={{
        position: 'absolute',
        top: '16px',
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
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-card)',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '11px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: toast.type === 'success' ? '4px solid var(--primary)' : '4px solid var(--accent)',
              animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
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

      {/* Dynamic View rendering */}
      {currentView === 'admin' ? (
        <OwnerDashboard />
      ) : currentView === 'tracking' ? (
        <DeliveryTracking />
      ) : (
        <>
          {/* Navbar */}
          <Navbar 
            onOpenPWA={() => setPWAOpen(true)}
            onOpenMap={() => setMapOpen(true)}
          />
          
          {/* Main Catalog View */}
          <Catalog />

          {/* Active Order Tracker Banner */}
          {activeOrder && (
            <div 
              onClick={() => setView('tracking')}
              style={{
                position: 'absolute',
                bottom: totalItems > 0 ? '76px' : '16px',
                left: '16px',
                right: '16px',
                backgroundColor: 'rgba(37, 99, 235, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--border-radius-md)',
                padding: '10px 14px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                zIndex: 35,
                animation: 'pulseGlow 2s infinite'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '16px' }}>🛵</span>
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>Active Delivery in Progress</h4>
                  <p style={{ fontSize: '9px', opacity: 0.9, marginTop: '1px' }}>Status: {activeOrder.status.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                Track <ArrowRight size={10} />
              </span>
            </div>
          )}

          {/* Bottom Cart Trigger */}
          {totalItems > 0 && (
            <div className="bottom-bar">
              <div className="cart-summary-trigger" onClick={() => setCartOpen(true)}>
                <div className="cart-trigger-left">
                  <ShoppingBag size={18} />
                  <span className="cart-trigger-items">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                </div>
                <span className="cart-trigger-right">
                  <span>View Cart</span>
                  <ArrowRight size={14} strokeWidth={3} />
                </span>
              </div>
            </div>
          )}
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
    </>
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
