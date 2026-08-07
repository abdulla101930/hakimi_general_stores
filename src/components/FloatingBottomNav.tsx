import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, RefreshCw, Grid, Printer, ShoppingBag } from 'lucide-react';

interface FloatingBottomNavProps {
  onOpenCart: () => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({ onOpenCart }) => {
  const { currentView, setView, cart, catalog } = useApp();

  const totalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = catalog.find(prod => prod.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  return (
    <div className="floating-bottom-nav">
      {/* Home Tab */}
      <button 
        type="button" 
        className={`bottom-nav-item ${currentView === 'catalog' ? 'active' : ''}`}
        onClick={() => setView('catalog')}
      >
        <Home size={18} />
        <span>Home</span>
      </button>

      {/* Order Again Tab */}
      <button 
        type="button" 
        className={`bottom-nav-item ${currentView === 'tracking' ? 'active' : ''}`}
        onClick={() => setView('tracking')}
      >
        <RefreshCw size={18} />
        <span>Order Again</span>
      </button>

      {/* Categories Tab */}
      <button 
        type="button" 
        className="bottom-nav-item"
        onClick={() => {
          setView('catalog');
          window.scrollTo({ top: 350, behavior: 'smooth' });
        }}
      >
        <Grid size={18} />
        <span>Categories</span>
      </button>

      {/* Print / Extra Service Tab */}
      <button 
        type="button" 
        className="bottom-nav-item"
        onClick={() => {
          setView('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Printer size={18} />
        <span>Services</span>
      </button>

      {/* Cart Button */}
      <button 
        type="button" 
        className="bottom-nav-cart-btn"
        onClick={onOpenCart}
      >
        <ShoppingBag size={16} />
        <span>
          {totalItems > 0 ? `₹${cartSubtotal} (${totalItems})` : 'Cart'}
        </span>
      </button>
    </div>
  );
};
