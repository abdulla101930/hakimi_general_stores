import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
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
      {/* 1. Top Navigation Bar */}
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

      {/* 2. Main Content 2-Column Grid */}
      <div className="cart-content-grid">
        {/* Left Column: Cart Items (SS 5) & Coupons */}
        <div className="cart-left-col">
          
          {/* Free Delivery Banner matching SS 6 Top Card */}
          <div className="free-delivery-top-card">
            <div className="free-del-main-row">
              <div className="scooter-icon-box">
                🛵
              </div>
              <div className="free-del-text-col">
                <span className="free-del-title">
                  {isFreeDelivery ? '🎉 You unlocked FREE delivery!' : 'Get FREE delivery'}
                </span>
                <span className="free-del-subtext">
                  {!isFreeDelivery 
                    ? `Add products worth ₹${freeDeliveryThreshold - itemsTotal} more ›`
                    : 'Your order qualifies for zero delivery fees!'}
                </span>
                {/* Progress Bar */}
                <div className="del-progress-track">
                  <div 
                    className="del-progress-fill" 
                    style={{ width: `${Math.min(100, (itemsTotal / freeDeliveryThreshold) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="see-coupons-link"
              onClick={() => {
                const el = document.getElementById('coupon-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>See all coupons</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Cart Product Items (SS 5) */}
          <div className="cart-section-box">
            <h2 className="cart-section-title">Items in Cart ({totalItems})</h2>
            <div className="cart-items-list">
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="cart-item-row-ss5">
                  {/* Thumbnail Image */}
                  <div className="cart-item-thumb">
                    {product.image.startsWith('http') || product.image.startsWith('/') ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span style={{ fontSize: '32px' }}>{product.image}</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="cart-item-details-col">
                    <h3 className="cart-item-title">{product.name}</h3>
                    <span className="cart-item-unit">{product.weight}</span>
                    <div className="cart-item-prices">
                      <span className="current-price">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="strike-price">₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper Control (SS 5) */}
                  <div className="cart-item-stepper-wrapper">
                    <div className="ss5-qty-stepper">
                      <button 
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} strokeWidth={3} />
                      </button>
                      <span className="stepper-val">{qty}</span>
                      <button 
                        type="button"
                        onClick={() => addToCart(product.id)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="cart-item-total-price">₹{product.price * qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coupons & Offers */}
          <div id="coupon-section" className="cart-section-box">
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
                <Tag size={16} color="#2563eb" />
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

        {/* Right Column: Bill Details (SS 6), Delivery Instructions & Address */}
        <div className="cart-right-col">

          {/* Bill Details Card (SS 6) */}
          <div className="cart-section-box bill-details-box">
            <h2 className="cart-section-title" style={{ fontSize: '18px' }}>Bill details</h2>
            
            <div className="bill-detail-line">
              <div className="line-label">
                <span className="line-icon">📄</span>
                <span>Items total</span>
              </div>
              <span className="line-val">₹{itemsTotal}</span>
            </div>

            <div className="bill-detail-line">
              <div className="line-label">
                <span className="line-icon">🚚</span>
                <span>Delivery charge</span>
              </div>
              <span className="line-val">
                {deliveryCharge === 0 ? <span className="free-green-badge">FREE</span> : `₹${deliveryCharge}`}
              </span>
            </div>

            <div className="bill-detail-line">
              <div className="line-label">
                <span className="line-icon">🛍️</span>
                <span>Handling charge</span>
              </div>
              <span className="line-val free-green-badge">FREE</span>
            </div>

            {itemsTotal < 99 && (
              <div className="bill-detail-line small-cart-row">
                <div>
                  <div className="line-label">
                    <span className="line-icon">🛒</span>
                    <span>Small cart charge</span>
                  </div>
                  <span className="small-cart-subtext">No small cart charge on orders above ₹99</span>
                </div>
                <span className="line-val">₹15</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="bill-detail-line discount-line">
                <div className="line-label">
                  <span className="line-icon">🎟️</span>
                  <span>Coupon Discount</span>
                </div>
                <span className="line-val discount-val">-₹{discountAmount}</span>
              </div>
            )}

            <div className="bill-divider-line" />

            <div className="bill-detail-line grand-total-line">
              <span className="grand-total-label">Grand total</span>
              <span className="grand-total-val">₹{grandTotal + (itemsTotal < 99 ? 15 : 0)}</span>
            </div>
          </div>

          {/* Add GSTIN Banner (SS 6) */}
          <div className="gstin-card-banner">
            <div className="gstin-icon-box">%</div>
            <div className="gstin-text-col">
              <span className="gstin-title">Add GSTIN</span>
              <span className="gstin-subtext">Claim GST input credit up to 18% on your order</span>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>

          {/* Delivery Instructions (SS 6) */}
          <div className="cart-section-box">
            <h2 className="cart-section-title">Delivery instructions</h2>
            <div className="instructions-horizontal-grid">
              {[
                { id: 'record', label: 'Record voice', sub: 'Press here and hold', icon: Mic },
                { id: 'door', label: 'Leave at door', sub: 'Ring bell & drop', icon: BellOff },
                { id: 'guard', label: 'Leave with guard', sub: 'Security gate', icon: Shield },
                { id: 'call', label: 'Avoid calling', sub: 'Silent delivery', icon: PhoneOff }
              ].map((inst) => {
                const Icon = inst.icon;
                const isSelected = selectedInstruction === inst.label;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    className={`inst-card-box ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedInstruction(inst.label)}
                  >
                    <div className="inst-top-row">
                      <Icon size={18} color={isSelected ? '#2563eb' : '#64748b'} />
                      {isSelected && <Check size={14} className="inst-check" />}
                    </div>
                    <span className="inst-label-title">{inst.label}</span>
                    <span className="inst-subtext">{inst.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivering to Bar (SS 6 Bottom Sticky Style) */}
          <div className="delivering-to-bar">
            <div className="del-to-left">
              <div className="house-icon-box">
                🏠
              </div>
              <div className="del-to-text">
                <span className="del-to-title">
                  Delivering to <strong>{selectedAddress ? selectedAddress.type : 'Home'}</strong>
                </span>
                <span className="del-to-address-line">
                  {selectedAddress ? selectedAddress.details : 'Select your delivery address...'}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-change-address"
              onClick={onOpenMap}
            >
              {selectedAddress ? 'Change' : 'Add Address'}
            </button>
          </div>

          {/* Checkout Button Bar */}
          <div className="checkout-action-wrapper">
            <button
              type="button"
              className="btn-place-whatsapp-order"
              onClick={handleCheckout}
            >
              <div className="checkout-btn-left">
                <span className="pay-total-val">₹{grandTotal + (itemsTotal < 99 ? 15 : 0)}</span>
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
