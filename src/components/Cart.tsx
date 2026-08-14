import { useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { computeBill, computeCouponSavings } from '../lib/billing';
import { sendOrderToWhatsApp } from '../lib/whatsapp';
import { X, ShoppingBag, Plus, Minus, ArrowRight, Percent, Bike } from 'lucide-react';

interface CartProps {
  onOpenMap?: () => void;
}

const QUICK_COUPONS = [{ code: 'WELCOME50', description: 'Get Flat ₹50 discount on your order!' }];

export function Cart({ onOpenMap }: CartProps) {
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
    freeDeliveryThreshold,
    deliverySettings
  } = useApp();

  const [instructions, setInstructions] = useState<string[]>([]);
  const [customCouponInput, setCustomCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCouponModalOpen, setCouponModalOpen] = useState(false);

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [inlineAddressType, setInlineAddressType] = useState('Home');
  const [inlineAddressDetails, setInlineAddressDetails] = useState('');
  const [inlineGps, setInlineGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);

  if (!isCartOpen) return null;

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => ({ product: catalog.find((p) => p.id === id), quantity }))
    .filter((item) => item.product !== undefined) as { product: NonNullable<typeof catalog[number]>; quantity: number }[];

  const bill = computeBill({
    items: cartItems.map(({ product, quantity }) => ({
      price: product.price,
      quantity,
      handlingFee: product.handlingFee
    })),
    settings: deliverySettings,
    address: selectedAddress,
    coupon: appliedCoupon
  });

  const couponSavings = computeCouponSavings({
    items: cartItems.map(({ product, quantity }) => ({
      price: product.price,
      quantity,
      handlingFee: product.handlingFee
    })),
    settings: deliverySettings,
    address: selectedAddress,
    coupon: appliedCoupon
  });

  const progressToFreeDelivery = Math.min(100, (bill.itemsTotal / freeDeliveryThreshold) * 100);
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - bill.itemsTotal);

  const handleLocateNewAddress = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
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
        setInlineAddressDetails((prev) => {
          if (!prev.trim()) return pinText;
          if (prev.includes('GPS Pin:')) return prev;
          return `${prev} (${pinText})`;
        });
      },
      (error) => {
        console.error(error);
        setIsLocatingAddress(false);
        alert('Unable to pinpoint GPS. Please enter your address details manually.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSaveInlineAddress = () => {
    if (!inlineAddressDetails.trim()) {
      alert('Please enter address details.');
      return;
    }
    const exists = addressList.some((a) => a.type === inlineAddressType);
    const uniqueType = exists ? `${inlineAddressType} ${Date.now().toString().slice(-4)}` : inlineAddressType;
    addNewAddress({
      type: uniqueType,
      details: inlineAddressDetails.trim(),
      gps: inlineGps || undefined
    });
    setInlineAddressDetails('');
    setInlineGps(null);
    setShowNewAddressForm(false);
  };

  const toggleInstruction = (inst: string) => {
    setInstructions((prev) => (prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]));
  };

  const handleApplyCouponCode = (e: FormEvent) => {
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
      <div className={`drawer-backdrop ${isCartOpen ? 'active' : ''}`} onClick={() => setCartOpen(false)} />

      <div className={`drawer-content ${isCartOpen ? 'active' : ''} cart-drawer`} style={{ height: '85%' }}>
        <div className="drawer-header">
          <div className="drawer-header-title-wrap">
            <ShoppingBag size={20} color="var(--primary)" />
            <h3 className="drawer-title">My Cart</h3>
          </div>
          <button className="btn-close" onClick={() => setCartOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="scrollable cart-drawer-scroll">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-emoji">🛒</span>
              <h3 className="cart-empty-title">Your basket is empty</h3>
              <p className="cart-empty-sub">Add items from our catalog to complete your purchase.</p>
              <button className="btn-primary" onClick={() => setCartOpen(false)}>
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {remainingForFreeDelivery > 0 ? (
                <div className="free-delivery-banner">
                  <Bike size={18} color="var(--primary)" />
                  <div className="free-delivery-banner-main">
                    <div className="free-delivery-text">
                      Add products worth <span className="free-delivery-accent">₹{remainingForFreeDelivery} more</span> to
                      get <span className="free-delivery-accent">FREE delivery & handling</span>!
                    </div>
                    <div className="free-delivery-track">
                      <div className="free-delivery-track-fill" style={{ width: `${progressToFreeDelivery}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="free-delivery-banner free-delivery-banner-unlocked">
                  <Bike size={18} color="var(--success)" />
                  <div className="free-delivery-text">
                    🎉 <strong>FREE Delivery & Handling Unlocked!</strong>
                  </div>
                </div>
              )}

              <div className="cart-items-list">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="cart-item-row">
                    <div className="cart-item-img">
                      {product.image.startsWith('http') ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <span>{product.image}</span>
                      )}
                    </div>
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{product.name}</h4>
                      <span className="cart-item-weight">{product.weight}</span>
                    </div>
                    <div className="qty-control">
                      <button className="btn-qty" onClick={() => removeFromCart(product.id)}>
                        <Minus size={10} strokeWidth={3} />
                      </button>
                      <span className="qty-number">{quantity}</span>
                      <button className="btn-qty" onClick={() => addToCart(product.id)}>
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="cart-item-pricing">
                      <span className="cart-item-total-price">₹{product.price * quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="coupon-section">
                {appliedCoupon ? (
                  <div className="applied-coupon-inline">
                    <div className="applied-coupon-inline-left">
                      <Percent size={16} color="var(--success)" />
                      <div>
                        <span className="coupon-badge-success">{appliedCoupon.code}</span>
                        <p className="applied-coupon-desc">{appliedCoupon.description}</p>
                      </div>
                    </div>
                    <button type="button" className="btn-remove-coupon" onClick={removeCoupon}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="coupon-trigger" onClick={() => setCouponModalOpen(true)}>
                    <div className="coupon-trigger-left">
                      <Percent size={16} />
                      <span>Apply Coupon Code</span>
                    </div>
                    <ArrowRight size={14} />
                  </div>
                )}
              </div>

              <div className="delivery-instructions-section">
                <h4 className="bill-title">Delivery Instructions</h4>
                <div className="instructions-grid">
                  {[
                    { text: 'Avoid calling', icon: '🔇' },
                    { text: "Don't ring bell", icon: '🔕' },
                    { text: 'Leave with guard', icon: '👮' },
                    { text: 'Record voice', icon: '🎙️' }
                  ].map((item) => (
                    <div
                      key={item.text}
                      className={`instruction-card ${instructions.includes(item.text) ? 'selected' : ''}`}
                      onClick={() => toggleInstruction(item.text)}
                      role="button"
                    >
                      <span className="instruction-card-emoji">{item.icon}</span>
                      <span className="instruction-card-text">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="address-selector-section">
                <div className="address-selector-header">
                  <h4 className="bill-title">Delivering To</h4>
                  <button type="button" className="address-drop-pin" onClick={() => onOpenMap?.()}>
                    <span>📍 Drop Map Pin</span>
                  </button>
                </div>

                <div className="address-cards-row">
                  {addressList.map((addr) => (
                    <div
                      key={addr.type}
                      className={`address-card ${selectedAddress && selectedAddress.type === addr.type ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(addr)}
                      role="button"
                    >
                      <div className="address-type">{addr.type}</div>
                      <div className="address-details">{addr.details}</div>
                    </div>
                  ))}
                </div>

                {showNewAddressForm ? (
                  <div className="inline-address-form">
                    <div className="inline-address-form-header">
                      <span className="inline-address-form-title">New Address Details</span>
                      <button
                        type="button"
                        onClick={handleLocateNewAddress}
                        disabled={isLocatingAddress}
                        className="inline-gps-btn"
                      >
                        📍 {isLocatingAddress ? 'Locating...' : inlineGps ? 'GPS Pinned ✓' : 'Use GPS'}
                      </button>
                    </div>
                    <div className="inline-address-type-row">
                      {['Home', 'Work', 'Other'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`inline-address-type ${inlineAddressType === type ? 'active' : ''}`}
                          onClick={() => setInlineAddressType(type)}
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
                    />
                    <div className="inline-address-form-actions">
                      <button type="button" className="btn-primary" onClick={handleSaveInlineAddress}>
                        Save Address
                      </button>
                      <button type="button" className="inline-cancel-btn" onClick={() => setShowNewAddressForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="add-address-btn" onClick={() => setShowNewAddressForm(true)}>
                    <Plus size={12} /> Add New Delivery Address
                  </button>
                )}
              </div>

              <div className="bill-details-card">
                <h4 className="bill-title">Bill Summary</h4>
                <div className="bill-row">
                  <span>Item Total</span>
                  <span>₹{bill.itemsTotal}</span>
                </div>
                <div className="bill-row">
                  <span>Handling Charge</span>
                  <span>{bill.handlingCharge === 0 ? <span className="bill-free-text">FREE</span> : `₹${bill.handlingCharge}`}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Partner Fee</span>
                  <span>{bill.deliveryCharge === 0 ? <span className="bill-free-text">FREE</span> : `₹${bill.deliveryCharge}`}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="bill-row bill-row-discount">
                    <span>Discount Applied</span>
                    <span>-₹{bill.discount}</span>
                  </div>
                )}
                {appliedCoupon && couponSavings > 0 && (
                  <div className="bill-row bill-row-savings">
                    <span>You Saved</span>
                    <span>₹{couponSavings}</span>
                  </div>
                )}
                <div className="bill-row bill-row-total">
                  <span>To Pay</span>
                  <span>₹{bill.grandTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-checkout-bar">
            <button className="btn-checkout" onClick={handleCheckout}>
              <div className="checkout-left">
                <span className="checkout-total">₹{bill.grandTotal}</span>
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

      {isCouponModalOpen && (
        <div className="drawer-backdrop active coupon-modal-backdrop" onClick={() => setCouponModalOpen(false)}>
          <div className="drawer-content active coupon-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Apply Promo Coupon</h3>
              <button className="btn-close" onClick={() => setCouponModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="coupon-modal-body">
              <form onSubmit={handleApplyCouponCode} className="coupon-input-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter code (e.g. WELCOME50)"
                  value={customCouponInput}
                  onChange={(e) => setCustomCouponInput(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <button type="submit" className="btn-primary">
                  Apply
                </button>
              </form>
              {couponError && <p className="coupon-error-text">{couponError}</p>}
              <div className="coupon-option-list">
                {QUICK_COUPONS.map((c) => (
                  <div
                    key={c.code}
                    className="coupon-option-card"
                    onClick={() => applyCoupon(c.code)}
                    role="button"
                  >
                    <span className="coupon-badge-success">{c.code}</span>
                    <p className="coupon-option-desc">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
