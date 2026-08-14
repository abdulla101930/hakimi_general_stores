import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Catalog } from './components/Catalog';
import { Cart } from './components/Cart';
import { Toasts } from './components/Toasts';
import { LoginModal } from './components/LoginModal';
import { DeliveryTracking } from './components/DeliveryTracking';
import { OwnerDashboard } from './components/OwnerDashboard';
import { MapPickerModal } from './components/MapPickerModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { DevLogsModal } from './components/DevLogsModal';
import { MaintenancePage } from './components/MaintenancePage';
import { CartPage } from './components/CartPage';
import { MagicBottomNav } from './components/MagicBottomNav';
import { useToast } from './hooks/useToast';
import { startOwnerRingingAlarm, stopOwnerRingingAlarm, showNotification } from './lib/sound';
import { ArrowRight } from 'lucide-react';
import type { Address } from './types';

function MainLayout() {
  const { currentView, cart, activeOrder, setView, role, orders, addNewAddress, setSelectedAddress, isMaintenanceMode } = useApp();

  const [isMapOpen, setMapOpen] = useState(false);
  const [isPWAOpen, setPWAOpen] = useState(false);
  const [isDevLogsOpen, setDevLogsOpen] = useState(false);

  const { toasts, addToast, dismissToast } = useToast();
  const [lastOrderStatus, setLastOrderStatus] = useState<string | null>(null);
  const [lastOrdersCount, setLastOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    const triggerLogs = () => {
      setDevLogsOpen(true);
      return 'Opening Developer Audit Console...';
    };

    const devWindow = window as unknown as Record<string, unknown>;
    devWindow.showDevLogs = triggerLogs;
    devWindow.__HAKIMI_DEV_LOGS__ = triggerLogs;
    devWindow.devlogs = triggerLogs;

    console.log(
      '%c[DEVELOPER AUDIT SYSTEM ACTIVE] %cType %cshowDevLogs()%c or press %cCtrl+Shift+L%c or add %c#devlogs%c to URL to inspect owner logs.',
      'color: #2563eb; font-weight: bold;',
      'color: #475569;',
      'color: #10b981; font-weight: bold; font-family: monospace;',
      'color: #475569;',
      'color: #f59e0b; font-weight: bold;',
      'color: #475569;',
      'color: #8b5cf6; font-weight: bold; font-family: monospace;',
      'color: #475569;'
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setDevLogsOpen((prev) => !prev);
      }
    };

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

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification.requestPermission === 'function' && Notification.permission === 'default') {
        const promise = Notification.requestPermission();
        if (promise && typeof promise.then === 'function') {
          promise.catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Notification permission request skipped:', e);
    }
  }, []);

  useEffect(() => {
    const status = activeOrder?.status ?? null;
    if (!status) {
      setLastOrderStatus(null);
      return;
    }

    if (lastOrderStatus && status !== lastOrderStatus) {
      let message = '';
      if (status === 'packing') {
        message = '📦 Order Confirmed: Hakimi staff is packing your items!';
      } else if (status === 'out_for_delivery') {
        message = '🛵 Order Out: Delivery partner is on their way!';
      } else if (status === 'delivered') {
        message = '🎁 Order Arrived: Thank you for shopping with Hakimi!';
      }

      if (message) {
        addToast(message, 'success');
        showNotification('Hakimi Supermarket', message);
      }
    }
    setLastOrderStatus(status);
  }, [activeOrder?.status, lastOrderStatus, addToast]);

  useEffect(() => {
    if (role !== 'owner') return;

    if (lastOrdersCount !== null && orders.length > lastOrdersCount) {
      const newestOrder = orders[0];
      addToast(`🔔 NEW ORDER #${newestOrder?.id} received! (₹${newestOrder?.bill.grandTotal})`, 'info');
      startOwnerRingingAlarm();
      showNotification('Hakimi Supermarket - New Order!', `${newestOrder?.customerName} placed an order for ₹${newestOrder?.bill.grandTotal}`);
    }
    setLastOrdersCount(orders.length);
  }, [orders, role, addToast, lastOrdersCount]);

  useEffect(() => {
    if (role !== 'owner') return;

    const checkAndRingUnaccepted = () => {
      const hasUnaccepted = orders.some((o) => o.status === 'placed');
      if (hasUnaccepted) {
        startOwnerRingingAlarm();
        addToast('🔔 REMINDER: Unaccepted order waiting! Alarm ringing...', 'warning');
      } else {
        stopOwnerRingingAlarm();
      }
    };

    const hasUnaccepted = orders.some((o) => o.status === 'placed');
    if (!hasUnaccepted) {
      stopOwnerRingingAlarm();
    }

    const intervalId = setInterval(checkAndRingUnaccepted, 300000);
    return () => clearInterval(intervalId);
  }, [orders, role, addToast]);

  const handleSelectMapAddress = (addr: Address) => {
    addNewAddress(addr);
    setSelectedAddress(addr);
    addToast('📍 Delivery pin & location address updated!', 'success');
  };

  return (
    <div className="app-shell">
      <Toasts toasts={toasts} onDismiss={dismissToast} />

      {isMaintenanceMode && role !== 'owner' ? (
        <MaintenancePage />
      ) : currentView === 'admin' ? (
        <OwnerDashboard />
      ) : currentView === 'tracking' ? (
        <DeliveryTracking />
      ) : currentView === 'cart' ? (
        <CartPage onOpenMap={() => setMapOpen(true)} />
      ) : (
        <>
          <Navbar onOpenPWA={() => setPWAOpen(true)} onOpenMap={() => setMapOpen(true)} />

          <div className="main-content-scroll">
            <Catalog />
          </div>

          {activeOrder && !isMapOpen && !isPWAOpen && !isDevLogsOpen && (
            <div
              onClick={() => setView('tracking')}
              className="active-order-banner"
              style={{ bottom: totalItems > 0 ? '84px' : '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '20px' }}>🛵</span>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, margin: 0 }}>Active Delivery in Progress</h4>
                  <p style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
                    Status: {activeOrder.status.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                Track <ArrowRight size={12} />
              </span>
            </div>
          )}
        </>
      )}

      {currentView !== 'admin' && <MagicBottomNav isModalOpen={isMapOpen || isPWAOpen || isDevLogsOpen} />}

      <Cart onOpenMap={() => setMapOpen(true)} />
      <LoginModal />
      <MapPickerModal isOpen={isMapOpen} onClose={() => setMapOpen(false)} onSelectAddress={handleSelectMapAddress} />
      <PWAInstallModal isOpen={isPWAOpen} onClose={() => setPWAOpen(false)} />
      <DevLogsModal isOpen={isDevLogsOpen} onClose={() => setDevLogsOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
