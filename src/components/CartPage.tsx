import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Tag, 
  Check, 
  ShoppingBag,
  BellOff,
  PhoneOff,
  Shield,
  Mic,
  ChevronRight
} from 'lucide-react';

interface CartPageProps {
  onOpenMap: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onOpenMap }) => {
  const { 
    cart, 
    catalog, 
    removeFromCart, 
    addToCart, 
    clearCart, 
    selectedAddress,
    setLoginOpen,
    user,
    createOrder,
    setView,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    freeDeliveryThreshold
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState<string>('Avoid calling');

  // Filter items in cart
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = catalog.find(p => p.id === id);
      return { product, qty };
    })
    .filter(item => item.product !== undefined && item.qty > 0) as { product: NonNullable<ReturnType<typeof catalog.find>>; qty: number }[];

  const itemsTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.value : 0;
  const isFreeDelivery = itemsTotal >= freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : 30;
  const handlingFee = 0;
  const grandTotal = Math.max(0, itemsTotal - discountAmount + deliveryCharge + handlingFee);

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponCode('');
    } else {
      alert(result.message);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    if (!selectedAddress) {
      setLoginOpen(true);
      return;
    }

    // Create order object
    const newOrder = createOrder(selectedInstruction);

    // Format WhatsApp message
    const storeNumber = '919993949604'; // Owner WhatsApp contact (+91 99939 49604)
    let msg = `🛒 *NEW ORDER - HAKIMI GENERAL STORE*\n`;
    msg += `------------------------------------\n`;
    msg += `👤 *Customer:* ${newOrder.customerName} (${newOrder.customerPhone})\n`;
    msg += `📍 *Delivery Address:* ${newOrder.address.type} - ${newOrder.address.details}\n`;
    msg += `📋 *Instruction:* ${selectedInstruction}\n\n`;
    msg += `📦 *ORDER ITEMS:*\n`;

    newOrder.items.forEach((item, index) => {
      msg += `${index + 1}. ${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}\n`;
    });

    msg += `\n------------------------------------\n`;
    msg += `💵 *Item Total:* ₹${newOrder.bill.itemsTotal}\n`;
    if (newOrder.bill.discount > 0) msg += `🎟️ *Discount:* -₹${newOrder.bill.discount}\n`;
    msg += `🚚 *Delivery Fee:* ${newOrder.bill.deliveryCharge === 0 ? 'FREE' : `₹${newOrder.bill.deliveryCharge}`}\n`;
    msg += `💰 *TOTAL PAYABLE:* ₹${newOrder.bill.grandTotal}\n`;
    msg += `------------------------------------\n`;
    msg += `Please confirm and dispatch my order! Thank you.`;

    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=${storeNumber}&text=${encodedMsg}`;
    
    window.open(waUrl, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '40px 16px 120px', minHeight: '80vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <ShoppingBag size={40} color="#2563eb" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Your Cart is Empty</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', textAlign: 'center', maxWidth: '300px' }}>
          Looks like you haven't added anything to your basket yet.
        </p>
        <button
          type="button"
          onClick={() => setView('catalog')}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      {/* 1. Full Top Header Bar */}
      <div className="cart-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            className="cart-back-btn"
            onClick={() => setView('catalog')}
          >
            <ArrowLeft size={18} color="#1e293b" />
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>My Cart</h1>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in basket
            </span>
          </div>
        </div>

        <button 
          type="button" 
          onClick={clearCart}
          className="cart-clear-btn"
        >
          <Trash2 size={15} />
          <span>Clear</span>
        </button>
      </div>

      {/* Free Delivery Bar */}
      {!isFreeDelivery && (
        <div className="cart-free-shipping-bar">
          <span>🚚 Add <strong>₹{freeDeliveryThreshold - itemsTotal}</strong> more for FREE Delivery!</span>
        </div>
      )}

      {/* 2. Main Content Grid Layout */}
      <div className="cart-content-grid">
        {/* Left Column - Product Items & Options */}
        <div className="cart-left-col">
          {/* Cart Product Items */}
          <div className="cart-section-box">
            <h2 className="cart-section-title">Items in Cart</h2>
            <div className="cart-items-list">
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="cart-item-row">
                  {/* Image */}
                  <div className="cart-item-img-box">
                    {product.image.startsWith('http') || product.image.startsWith('/') ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span style={{ fontSize: '28px' }}>{product.image}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="cart-item-info">
                    <h3 className="cart-item-name">{product.name}</h3>
                    <span className="cart-item-weight">{product.weight}</span>
                    <div className="cart-item-price-tag">
                      <span className="current-price">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Total */}
                  <div className="cart-item-action-col">
                    <span className="item-subtotal">₹{product.price * qty}</span>
                    <div className="cart-qty-stepper">
                      <button 
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span>{qty}</span>
                      <button 
                        type="button"
                        onClick={() => addToCart(product.id)}
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="cart-section-box">
            <h2 className="cart-section-title">Delivery Instructions</h2>
            <div className="instructions-grid">
              {[
                { label: 'Avoid calling', icon: PhoneOff },
                { label: "Don't ring bell", icon: BellOff },
                { label: 'Leave with guard', icon: Shield },
                { label: 'Record voice', icon: Mic }
              ].map((inst) => {
                const Icon = inst.icon;
                const isSelected = selectedInstruction === inst.label;
                return (
                  <button
                    key={inst.label}
                    type="button"
                    className={`instruction-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedInstruction(inst.label)}
                  >
                    <Icon size={18} color={isSelected ? '#2563eb' : '#64748b'} />
                    <span>{inst.label}</span>
                    {isSelected && <Check size={14} className="check-mark" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coupons Section */}
          <div className="cart-section-box">
            <h2 className="cart-section-title">Coupons & Offers</h2>
            {appliedCoupon ? (
              <div className="applied-coupon-banner">
                <div>
                  <span className="coupon-code-badge">{appliedCoupon.code}</span>
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, marginLeft: '8px' }}>
                    Applied! Saving ₹{appliedCoupon.value}
                  </span>
                </div>
                <button type="button" onClick={removeCoupon} className="btn-remove-coupon">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="coupon-input-form">
                <Tag size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Enter Coupon Code (e.g. WELCOME50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button type="submit">Apply</button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column - Address & Bill Summary */}
        <div className="cart-right-col">
          {/* Delivering To Address Card */}
          <div className="cart-section-box">
            <div className="address-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#2563eb" />
                <h2 className="cart-section-title" style={{ margin: 0 }}>Delivering To</h2>
              </div>
              <button type="button" onClick={onOpenMap} className="btn-map-pin">
                Drop Map Pin
              </button>
            </div>

            <div className="selected-address-card">
              {selectedAddress ? (
                <div>
                  <span className="address-type-tag">{selectedAddress.type}</span>
                  <p className="address-details-text">{selectedAddress.details}</p>
                </div>
              ) : (
                <p className="address-details-text" style={{ color: '#ef4444' }}>
                  No delivery address selected yet.
                </p>
              )}

              <button 
                type="button" 
                className="btn-add-new-address"
                onClick={() => setLoginOpen(true)}
              >
                + Add / Change Address
              </button>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="cart-section-box">
            <h2 className="cart-section-title">Bill Summary</h2>
            <div className="bill-rows-group">
              <div className="bill-row">
                <span>Item Total</span>
                <span>₹{itemsTotal}</span>
              </div>
              
              <div className="bill-row">
                <span>Handling Charge</span>
                <span className="free-badge">FREE</span>
              </div>

              <div className="bill-row">
                <span>Delivery Partner Fee</span>
                <span>{deliveryCharge === 0 ? <span className="free-badge">FREE</span> : `₹${deliveryCharge}`}</span>
              </div>

              {discountAmount > 0 && (
                <div className="bill-row discount">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="bill-divider" />

              <div className="bill-row grand-total">
                <span>To Pay</span>
                <span className="total-val">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button Bar */}
          <div className="checkout-action-wrapper">
            <button
              type="button"
              className="btn-place-whatsapp-order"
              onClick={handleCheckout}
            >
              <div className="checkout-btn-left">
                <span className="pay-total-val">₹{grandTotal}</span>
                <span className="pay-subtitle">TOTAL TO PAY</span>
              </div>
              <div className="checkout-btn-right">
                <span>Place Order via WhatsApp</span>
                <ChevronRight size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
