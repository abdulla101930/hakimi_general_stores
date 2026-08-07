import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sendOrderToWhatsApp } from '../utils/whatsapp';
import { X, ShoppingBag, Plus, Minus, ArrowRight, Percent, Bike, MapPin } from 'lucide-react';

interface CartProps {
  onOpenMap?: () => void;
}

export const Cart: React.FC<CartProps> = ({ onOpenMap }) => {
  const { 
    cart, 
    catalog, 
    isCartOpen, 
    setCartOpen, 
    addToCart, 
    removeFromCart, 
    selectedAddress,
    setSelectedAddress,
    addressList,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    createOrder,
    addNewAddress,
    freeDeliveryThreshold
  } = useApp();

  const [instructions, setInstructions] = useState<string[]>([]);
  const [customCouponInput, setCustomCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);

  // Inline address pinner states
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [inlineAddressType, setInlineAddressType] = useState('Home');
  const [inlineAddressDetails, setInlineAddressDetails] = useState('');
  const [inlineGps, setInlineGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);

  const handleLocateNewAddress = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setInlineGps({ lat, lng });
        setIsLocatingAddress(false);
        const pinText = `📍 GPS Pin: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (!inlineAddressDetails.trim()) {
          setInlineAddressDetails(pinText);
        } else if (!inlineAddressDetails.includes('GPS Pin:')) {
          setInlineAddressDetails(prev => `${prev} (${pinText})`);
        }
      },
      (error) => {
        console.error(error);
        setIsLocatingAddress(false);
        alert("Unable to pinpoint GPS. Please enter your address details manually.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSaveInlineAddress = () => {
    if (!inlineAddressDetails.trim()) {
      alert("Please enter address details.");
      return;
    }
    const exists = addressList.some(a => a.type === inlineAddressType);
    const uniqueType = exists ? `${inlineAddressType} ${Date.now().toString().slice(-4)}` : inlineAddressType;
    
    const newAddr = {
      type: uniqueType,
      details: inlineAddressDetails.trim(),
      gps: inlineGps || undefined
    };
    
    addNewAddress(newAddr);
    setInlineAddressDetails('');
    setInlineGps(null);
    setShowNewAddressForm(false);
  };

  if (!isCartOpen) return null;

  // Compile cart items
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const prod = catalog.find(p => p.id === id);
    return {
      product: prod,
      quantity: qty
    };
  }).filter(item => item.product !== undefined);

  // Math totals
  const itemsTotal = cartItems.reduce((sum, item) => {
    return sum + (item.product!.price * item.quantity);
  }, 0);

  // Billing factors
  let handlingCharge = cartItems.reduce((sum, item) => sum + (item.product!.handlingFee || 0) * item.quantity, 0);
  let deliveryCharge = 30;

  // Dynamic Free Delivery Threshold
  const progressToFreeDelivery = Math.min(100, (itemsTotal / freeDeliveryThreshold) * 100);
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - itemsTotal);
  
  if (itemsTotal >= freeDeliveryThreshold) {
    deliveryCharge = 0;
    handlingCharge = 0; // Waived at free delivery threshold!
  }

  // Coupon calculations
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      discount = Math.min(appliedCoupon.value, itemsTotal);
    } else if (appliedCoupon.discountType === 'free_shipping') {
      handlingCharge = 0;
      deliveryCharge = 0;
    }
  }

  const grandTotal = Math.max(0, itemsTotal + handlingCharge + deliveryCharge - discount);

  const toggleInstruction = (inst: string) => {
    setInstructions(prev => 
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  const handleApplyCouponCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCouponInput) return;
    const res = applyCoupon(customCouponInput);
    if (res.success) {
      setCustomCouponInput('');
      setCouponError('');
      setCouponModalOpen(false);
    } else {
      setCouponError(res.message);
    }
  };

  const handleCheckout = () => {
    const instructionsStr = instructions.join(', ');
    try {
      const order = createOrder(instructionsStr);
      const waUrl = sendOrderToWhatsApp(order);
      window.open(waUrl, '_blank');
      setCartOpen(false);
    } catch (e) {
      console.error(e);
      alert(`Checkout failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <>
      {/* Drawer Backdrop */}
      <div 
        className={`drawer-backdrop ${isCartOpen ? 'active' : ''}`}
        onClick={() => setCartOpen(false)}
      />

      {/* Cart Container Drawer */}
      <div className={`drawer-content ${isCartOpen ? 'active' : ''}`} style={{ height: '85%' }}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={20} color="var(--primary)" />
            <h3 className="drawer-title">My Cart</h3>
          </div>
          <button className="btn-close" onClick={() => setCartOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Checkout Sheet */}
        <div className="scrollable" style={{ paddingBottom: '90px' }}>
          {cartItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Your basket is empty
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '240px', lineHeight: '1.4' }}>
                Add items from our catalog to complete your purchase.
              </p>
              <button 
                className="btn-primary" 
                style={{ marginTop: '20px', padding: '10px 24px' }}
                onClick={() => setCartOpen(false)}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Free Delivery Tracker Banner */}
              {remainingForFreeDelivery > 0 ? (
                <div className="free-delivery-banner">
                  <Bike size={18} color="var(--primary)" />
                  <div style={{ flex: 1 }}>
                    <div className="free-delivery-text">
                      Add products worth <span className="free-delivery-accent">₹{remainingForFreeDelivery} more</span> to get <span className="free-delivery-accent">FREE delivery & handling</span>!
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                      borderRadius: '4px',
                      height: '5px',
                      marginTop: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        backgroundColor: 'var(--primary)',
                        width: `${progressToFreeDelivery}%`,
                        height: '100%',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="free-delivery-banner" style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)', borderColor: 'rgba(22, 163, 74, 0.2)' }}>
                  <Bike size={18} color="var(--success)" />
                  <div className="free-delivery-text" style={{ color: 'var(--text-primary)' }}>
                    🎉 <strong>FREE Delivery & Handling Unlocked!</strong>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="cart-items-list">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product!.id} className="cart-item-row">
                    {/* Item Icon */}
                    <div className="cart-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {product!.image.startsWith('http') ? (
                        <img src={product!.image} alt={product!.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        product!.image
                      )}
                    </div>
                    
                    {/* Item Info */}
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{product!.name}</h4>
                      <span className="cart-item-weight">{product!.weight}</span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="qty-control" style={{ marginRight: '12px' }}>
                      <button className="btn-qty" onClick={() => removeFromCart(product!.id)}>
                        <Minus size={10} strokeWidth={3} />
                      </button>
                      <span className="qty-number" style={{ fontSize: '11px' }}>{quantity}</span>
                      <button className="btn-qty" onClick={() => addToCart(product!.id)}>
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="cart-item-pricing">
                      <span className="cart-item-total-price">₹{product!.price * quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupons Block */}
              <div className="coupon-section">
                {appliedCoupon ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(22, 163, 74, 0.06)',
                    border: '1px dashed var(--success)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Percent size={16} color="var(--success)" />
                      <div>
                        <span className="coupon-badge-success">{appliedCoupon.code}</span>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {appliedCoupon.description}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--error)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="coupon-trigger" onClick={() => setCouponModalOpen(true)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Percent size={16} />
                      <span>Apply Coupon Code</span>
                    </div>
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>

              {/* Delivery Instructions Checklist */}
              <div className="delivery-instructions-section">
                <h4 className="bill-title">Delivery Instructions</h4>
                <div className="instructions-grid">
                  {[
                    { text: 'Avoid calling', icon: '🔇' },
                    { text: "Don't ring bell", icon: '🔕' },
                    { text: 'Leave with guard', icon: '👮' },
                    { text: 'Record voice', icon: '🎙️' }
                  ].map(item => (
                    <div 
                      key={item.text}
                      className={`instruction-card ${instructions.includes(item.text) ? 'selected' : ''}`}
                      onClick={() => toggleInstruction(item.text)}
                    >
                      <span style={{ fontSize: '18px' }}>{item.icon}</span>
                      <span className="instruction-card-text">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address Selector */}
              <div className="address-selector-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 className="bill-title" style={{ margin: 0 }}>Delivering To</h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenMap) {
                        onOpenMap();
                      } else {
                        setShowNewAddressForm(true);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <MapPin size={12} />
                    <span>Drop Map Pin</span>
                  </button>
                </div>

                <div className="address-cards-row">
                  {addressList.map(addr => (
                    <div 
                      key={addr.type}
                      className={`address-card ${selectedAddress && selectedAddress.type === addr.type ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <div className="address-type">{addr.type}</div>
                      <div className="address-details">{addr.details}</div>
                    </div>
                  ))}
                </div>

                {/* Inline address GPS pinner */}
                {showNewAddressForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, backgroundColor: 'var(--bg-main)', padding: 10, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)' }}>New Address Details</span>
                      <button
                        type="button"
                        onClick={handleLocateNewAddress}
                        disabled={isLocatingAddress}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        📍 {isLocatingAddress ? 'Locating...' : inlineGps ? 'GPS Pinned ✓' : 'Use GPS'}
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {['Home', 'Work', 'Other'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setInlineAddressType(type)}
                          style={{
                            flex: 1,
                            padding: '3px',
                            fontSize: '9px',
                            fontWeight: 600,
                            backgroundColor: inlineAddressType === type ? 'var(--primary)' : 'var(--bg-input)',
                            color: inlineAddressType === type ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Enter house / building details..."
                      value={inlineAddressDetails}
                      onChange={(e) => setInlineAddressDetails(e.target.value)}
                      style={{ fontSize: '11px', padding: '6px' }}
                    />
                    
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button 
                        type="button"
                        className="btn-primary" 
                        onClick={handleSaveInlineAddress}
                        style={{ flex: 1, padding: '6px', fontSize: '10px' }}
                      >
                        Save Address
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        style={{ padding: '6px 12px', fontSize: '10px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: '1px dashed var(--primary)',
                      color: 'var(--primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={12} /> Add New Delivery Address
                  </button>
                )}
              </div>

              {/* Bill Details Summary */}
              <div className="bill-details-card">
                <h4 className="bill-title">Bill Summary</h4>
                
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{itemsTotal}</span>
                </div>

                <div className="bill-row">
                  <span>Handling Charge</span>
                  <span>{handlingCharge === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${handlingCharge}`}</span>
                </div>

                <div className="bill-row">
                  <span>Delivery Partner Fee</span>
                  <span>{deliveryCharge === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `₹${deliveryCharge}`}</span>
                </div>

                {discount > 0 && (
                  <div className="bill-row" style={{ color: 'var(--success)', fontWeight: 600 }}>
                    <span>Discount Applied</span>
                    <span>-₹{discount}</span>
                  </div>
                )}

                <div className="bill-row total">
                  <span>To Pay</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Floating Checkout Button */}
        {cartItems.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.05)',
            zIndex: 10
          }}>
            <button 
              className="btn-checkout"
              onClick={handleCheckout}
            >
              <div className="checkout-left">
                <span className="checkout-total">₹{grandTotal}</span>
                <span className="checkout-sub">TOTAL TO PAY</span>
              </div>
              <div className="checkout-right">
                <span>Place Order via WhatsApp</span>
                <ArrowRight size={16} strokeWidth={3} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Coupon Picker Modal */}
      {isCouponModalOpen && (
        <div className="drawer-backdrop active" style={{ zIndex: 110 }} onClick={() => setCouponModalOpen(false)}>
          <div className="drawer-content active" style={{ zIndex: 111, maxHeight: '60%' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Apply Promo Coupon</h3>
              <button className="btn-close" onClick={() => setCouponModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <form onSubmit={handleApplyCouponCode} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Enter code (e.g. WELCOME50)"
                  value={customCouponInput}
                  onChange={e => setCustomCouponInput(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                  Apply
                </button>
              </form>

              {couponError && (
                <p style={{ color: 'var(--error)', fontSize: '11px', marginBottom: 12 }}>{couponError}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div 
                  onClick={() => handleApplyCouponCode({ preventDefault: () => {} } as any)}
                  style={{
                    border: '1px dashed var(--primary)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: 12,
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-tag)'
                  }}
                >
                  <span className="coupon-badge-success" onClick={() => applyCoupon('WELCOME50')}>WELCOME50</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Get Flat ₹50 discount on your order!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
