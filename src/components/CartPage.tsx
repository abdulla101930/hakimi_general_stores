import { useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { computeBill, computeCouponSavings } from '../lib/billing';
import { sendCheckoutOrderToWhatsApp } from '../lib/whatsapp';
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
import { PaymentModal } from './PaymentModal';

interface CartPageProps {
  onOpenMap: () => void;
}

const INSTRUCTION_OPTIONS = [
  { id: 'record', label: 'Record voice', sub: 'Press here and hold', icon: Mic },
  { id: 'door', label: 'Leave at door', sub: 'Ring bell & drop', icon: BellOff },
  { id: 'guard', label: 'Leave with guard', sub: 'Security gate', icon: Shield },
  { id: 'call', label: 'Avoid calling', sub: 'Silent delivery', icon: PhoneOff }
];

export function CartPage({ onOpenMap }: CartPageProps) {
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
    freeDeliveryThreshold,
    deliverySettings
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState<string>('Avoid calling');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = catalog.find((p) => p.id === id);
      return { product, qty };
    })
    .filter((item) => item.product !== undefined && item.qty > 0) as {
    product: NonNullable<typeof catalog[number]>;
    qty: number;
  }[];

  const bill = computeBill({
    items: cartItems.map(({ product, qty }) => ({ price: product.price, quantity: qty, handlingFee: product.handlingFee })),
    settings: deliverySettings,
    address: selectedAddress,
    coupon: appliedCoupon
  });

  const couponSavings = computeCouponSavings({
    items: cartItems.map(({ product, qty }) => ({ price: product.price, quantity: qty, handlingFee: product.handlingFee })),
    settings: deliverySettings,
    address: selectedAddress,
    coupon: appliedCoupon
  });

  const isFreeDelivery = bill.itemsTotal >= freeDeliveryThreshold;
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const result = applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponCode('');
    } else {
      alert(result.message);
    }
  };

  const handleOpenPaymentGateway = () => {
    if (!user || !selectedAddress) {
      setLoginOpen(true);
      return;
    }
    setPaymentModalOpen(true);
  };

  const handleProcessOrderPayment = (paymentMethod: 'COD' | 'ONLINE', paymentDetails?: string) => {
    setPaymentModalOpen(false);
    const paymentStatus = paymentMethod === 'ONLINE' ? 'Paid (Online)' : 'Pending';
    const newOrder = createOrder(selectedInstruction, paymentMethod, paymentStatus);
    const waUrl = sendCheckoutOrderToWhatsApp(newOrder, {
      instruction: selectedInstruction,
      paymentDetails
    });
    window.open(waUrl, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page-empty">
        <div className="cart-page-empty-icon">
          <ShoppingBag size={40} color="#2563eb" />
        </div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything to your basket yet.</p>
        <button type="button" className="cart-page-empty-btn" onClick={() => setView('catalog')}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <div className="cart-page-header">
        <div className="cart-page-header-title-wrap">
          <button type="button" className="cart-back-btn" onClick={() => setView('catalog')}>
            <ArrowLeft size={18} color="#1e293b" />
          </button>
          <div>
            <h1>My Cart</h1>
            <span>
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in basket
            </span>
          </div>
        </div>
        <button type="button" onClick={clearCart} className="cart-clear-btn">
          <Trash2 size={15} />
          <span>Clear</span>
        </button>
      </div>

      <div className="cart-content-grid">
        <div className="cart-left-col">
          <div className="free-delivery-top-card">
            <div className="free-del-main-row">
              <div className="scooter-icon-box">🛵</div>
              <div className="free-del-text-col">
                <span className="free-del-title">
                  {isFreeDelivery ? '🎉 You unlocked FREE delivery!' : 'Get FREE delivery'}
                </span>
                <span className="free-del-subtext">
                  {!isFreeDelivery
                    ? `Add products worth ₹${freeDeliveryThreshold - bill.itemsTotal} more ›`
                    : 'Your order qualifies for zero delivery fees!'}
                </span>
                <div className="del-progress-track">
                  <div
                    className="del-progress-fill"
                    style={{ width: `${Math.min(100, (bill.itemsTotal / freeDeliveryThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="see-coupons-link"
              onClick={() => document.getElementById('coupon-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>See all coupons</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="cart-section-box">
            <h2 className="cart-section-title">Items in Cart ({totalItems})</h2>
            <div className="cart-items-list">
              {cartItems.map(({ product, qty }) => (
                <div key={product.id} className="cart-item-row-ss5">
                  <div className="cart-item-thumb">
                    {product.image.startsWith('http') || product.image.startsWith('/') ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <span>{product.image}</span>
                    )}
                  </div>
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
                  <div className="cart-item-stepper-wrapper">
                    <div className="ss5-qty-stepper">
                      <button type="button" onClick={() => removeFromCart(product.id)} aria-label="Decrease quantity">
                        <Minus size={13} strokeWidth={3} />
                      </button>
                      <span className="stepper-val">{qty}</span>
                      <button type="button" onClick={() => addToCart(product.id)} aria-label="Increase quantity">
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="cart-item-total-price">₹{product.price * qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="coupon-section" className="cart-section-box">
            <h2 className="cart-section-title">Coupons & Offers</h2>

            {isFreeDelivery && (!appliedCoupon || appliedCoupon.code !== 'FREEDELIVERY') && (
              <div className="coupon-unlocked-card">
                <div>
                  <div className="coupon-unlocked-title">🎉 FREE DELIVERY COUPON UNLOCKED!</div>
                  <div className="coupon-unlocked-sub">
                    Code: <strong>FREEDELIVERY</strong> (Order threshold ₹{freeDeliveryThreshold} met)
                  </div>
                </div>
                <button type="button" onClick={() => applyCoupon('FREEDELIVERY')}>
                  Apply Coupon
                </button>
              </div>
            )}

            {appliedCoupon ? (
              <div className="applied-coupon-banner">
                <div className="applied-coupon-banner-left">
                  <span className="coupon-code-badge">{appliedCoupon.code}</span>
                  <span className="applied-coupon-savings">
                    Applied! Saving ₹{couponSavings}
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

        <div className="cart-right-col">
          <div className="cart-section-box bill-details-box">
            <h2 className="cart-section-title">Bill details</h2>

            <div className="bill-detail-line">
              <div className="line-label">
                <span className="line-icon">📄</span>
                <span>Items total</span>
              </div>
              <span className="line-val">₹{bill.itemsTotal}</span>
            </div>

            <div className="bill-detail-line">
              <div className="line-label">
                <span className="line-icon">🚚</span>
                <span>Delivery charge</span>
              </div>
              <span className="line-val">
                {bill.deliveryCharge === 0 ? <span className="free-green-badge">FREE</span> : `₹${bill.deliveryCharge}`}
              </span>
            </div>

            <div className="bill-detail-line">
              <div className="line-label">
                <span className="line-icon">🛍️</span>
                <span>Handling charge</span>
              </div>
              <span className="line-val">
                {bill.handlingCharge === 0 ? (
                  <span className="free-green-badge">FREE</span>
                ) : (
                  `₹${bill.handlingCharge}`
                )}
              </span>
            </div>

            {bill.discount > 0 && (
              <div className="bill-detail-line discount-line">
                <div className="line-label">
                  <span className="line-icon">🎟️</span>
                  <span>Coupon Discount</span>
                </div>
                <span className="line-val discount-val">-₹{bill.discount}</span>
              </div>
            )}

            <div className="bill-divider-line" />

            <div className="bill-detail-line grand-total-line">
              <span className="grand-total-label">Grand total</span>
              <span className="grand-total-val">₹{bill.grandTotal}</span>
            </div>
          </div>

          <div className="gstin-card-banner">
            <div className="gstin-icon-box">%</div>
            <div className="gstin-text-col">
              <span className="gstin-title">Add GSTIN</span>
              <span className="gstin-subtext">Claim GST input credit up to 18% on your order</span>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>

          <div className="cart-section-box">
            <h2 className="cart-section-title">Delivery instructions</h2>
            <div className="instructions-horizontal-grid">
              {INSTRUCTION_OPTIONS.map((inst) => {
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

          <div className="delivering-to-bar">
            <div className="del-to-left">
              <div className="house-icon-box">🏠</div>
              <div className="del-to-text">
                <span className="del-to-title">
                  Delivering to <strong>{selectedAddress ? selectedAddress.type : 'Home'}</strong>
                </span>
                <span className="del-to-address-line">
                  {selectedAddress ? selectedAddress.details : 'Select your delivery address...'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-change-address" onClick={onOpenMap}>
              {selectedAddress ? 'Change' : 'Add Address'}
            </button>
          </div>

          <div className="checkout-action-wrapper">
            <button type="button" className="btn-place-whatsapp-order" onClick={handleOpenPaymentGateway}>
              <div className="checkout-btn-left">
                <span className="pay-total-val">₹{bill.grandTotal}</span>
                <span className="pay-subtitle">TOTAL TO PAY</span>
              </div>
              <div className="checkout-btn-right">
                <span>Proceed to Payment</span>
                <ChevronRight size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        amount={bill.grandTotal}
        customerName={user?.name || 'Customer'}
        customerPhone={user?.phone || ''}
        onPaymentSuccess={handleProcessOrderPayment}
      />
    </div>
  );
}
