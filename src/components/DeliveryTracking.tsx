import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Phone, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  Receipt,
  MessageCircle
} from 'lucide-react';

export const DeliveryTracking: React.FC = () => {
  const { activeOrder, orders, setView, selectedAddress, user, setLoginOpen } = useApp();
  const [selectedOrderIdx, setSelectedOrderIdx] = useState<number>(0);
  const [isBillExpanded, setIsBillExpanded] = useState<boolean>(true);

  const cleanPhone = (p?: string) => (p ? p.replace(/\D/g, '') : '');
  const customerPhoneClean = cleanPhone(user?.phone);

  const customerOrders = user && customerPhoneClean
    ? orders.filter(o => cleanPhone(o.customerPhone) === customerPhoneClean)
    : [];

  const userActiveOrder = activeOrder && cleanPhone(activeOrder.customerPhone) === customerPhoneClean
    ? activeOrder
    : null;

  const displayedOrder = userActiveOrder || (customerOrders.length > 0 ? customerOrders[selectedOrderIdx || 0] : null);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '80vh',
        background: '#ffffff'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
        }}>
          👤
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
          Please Log In
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '280px', lineHeight: '1.5', margin: '0 0 24px' }}>
          Log in with your mobile number to view your order history and track your live deliveries.
        </p>
        <button 
          className="btn-primary" 
          style={{ padding: '12px 28px', fontSize: '14px', borderRadius: '24px' }}
          onClick={() => setLoginOpen(true)}
        >
          Log In Now
        </button>
      </div>
    );
  }

  if (!displayedOrder) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '80vh',
        background: '#ffffff'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
        }}>
          🛵
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>
          No Active Deliveries
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '280px', lineHeight: '1.5', margin: '0 0 24px' }}>
          You don't have any orders placed yet. Browse the catalog to place an order!
        </p>
        <button 
          className="btn-primary" 
          style={{ padding: '12px 28px', fontSize: '14px', borderRadius: '24px' }}
          onClick={() => setView('catalog')}
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  // Handle pending whatsapp confirmation status
  if (displayedOrder.status === 'placed') {
    return (
      <div className="tracking-container" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' }}>
        {/* Header bar */}
        <div className="tracking-header-bar">
          <button className="btn-icon-action" onClick={() => setView('catalog')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="tracking-header-title">Order Submitted</h2>
            <span className="tracking-header-sub">Order ID: {displayedOrder.id}</span>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          <div className="pending-confirmation-card">
            <div className="pending-spinner-ring"></div>
            <h3 className="pending-title">Awaiting Store Confirmation</h3>
            <p className="pending-desc">
              Your order bill has been forwarded to <b>Hakimi Supermarket (+91 99939 49604)</b> via WhatsApp.
            </p>
            <p className="pending-desc" style={{ marginTop: 8, color: '#64748b', fontSize: '11px' }}>
              Live GPS tracking will activate as soon as the merchant accepts and dispatches your order.
            </p>

            <a 
              href={`https://wa.me/919993949604?text=Hi%20Hakimi%20Supermarket,%20I%20placed%20Order%20%23${displayedOrder.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-contact-link"
            >
              <MessageCircle size={16} />
              <span>Contact Store on WhatsApp</span>
            </a>
          </div>

          {/* Delivering Order Bill Card */}
          <div className="delivering-bill-card" style={{ marginTop: '16px' }}>
            <div className="bill-card-header" onClick={() => setIsBillExpanded(!isBillExpanded)}>
              <div className="bill-header-left">
                <Receipt size={18} color="#2563eb" />
                <div>
                  <h4 className="bill-header-title">Order Bill Breakdown ({displayedOrder.items.length} items)</h4>
                  <span className="bill-header-sub">Order ID: #{displayedOrder.id}</span>
                </div>
              </div>
              <div className="bill-header-right">
                <span className="bill-total-price">₹{displayedOrder.bill.grandTotal}</span>
                <ChevronDown size={18} className={`arrow-icon ${isBillExpanded ? 'rotated' : ''}`} />
              </div>
            </div>

            {isBillExpanded && (
              <div className="bill-card-body">
                <div className="bill-items-scroll">
                  {displayedOrder.items.map(item => (
                    <div key={item.id} className="bill-item-row">
                      <div className="bill-item-name-col">
                        <span className="item-qty-badge">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <span className="item-weight">{item.weight}</span>
                      <span className="item-price">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="bill-divider" />

                <div className="bill-price-line">
                  <span>Items Subtotal</span>
                  <span>₹{displayedOrder.bill.itemsTotal}</span>
                </div>
                <div className="bill-price-line">
                  <span>Delivery Charge</span>
                  {displayedOrder.bill.deliveryCharge === 0 ? (
                    <span className="green-text">FREE</span>
                  ) : (
                    <span>₹{displayedOrder.bill.deliveryCharge}</span>
                  )}
                </div>
                <div className="bill-price-line">
                  <span>Handling Fee</span>
                  {displayedOrder.bill.handlingCharge === 0 ? (
                    <span className="green-text">FREE</span>
                  ) : (
                    <span>₹{displayedOrder.bill.handlingCharge}</span>
                  )}
                </div>

                <div className="bill-divider" />

                <div className="bill-grand-total-line">
                  <span className="grand-label">Grand Total</span>
                  <span className="grand-val">₹{displayedOrder.bill.grandTotal}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Driver positions on SVG canvas
  const statusStageMap: Record<string, { stage: number; pos: { x: number; y: number } }> = {
    placed: { stage: 1, pos: { x: 70, y: 160 } },
    packing: { stage: 2, pos: { x: 140, y: 110 } },
    out_for_delivery: { stage: 3, pos: { x: 250, y: 95 } },
    delivered: { stage: 4, pos: { x: 330, y: 140 } }
  };

  const currentStageInfo = statusStageMap[displayedOrder.status] || statusStageMap.out_for_delivery;
  const scooterPos = displayedOrder.driverPosition || currentStageInfo.pos;

  const steps = [
    { label: 'Placed', status: 'placed', icon: '📝' },
    { label: 'Packing', status: 'packing', icon: '📦' },
    { label: 'On Way', status: 'out_for_delivery', icon: '🛵' },
    { label: 'Delivered', status: 'delivered', icon: '🎁' }
  ];

  const deliveryAddressStr = selectedAddress ? `${selectedAddress.type} - ${selectedAddress.details}` : 'Home - Ratlam';

  return (
    <div className="tracking-container" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Top Header Bar */}
      <div className="tracking-header-bar">
        <button className="btn-icon-action" onClick={() => setView('catalog')}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="tracking-header-title">Live Delivery Tracking</h2>
          <span className="tracking-header-sub">Order #{displayedOrder.id}</span>
        </div>
      </div>

      {/* Orders selector tab bar if multiple customer orders exist */}
      {customerOrders && customerOrders.length > 1 && (
        <div className="orders-tab-scroll">
          {customerOrders.map((ord, idx) => (
            <button
              key={ord.id}
              type="button"
              className={`order-select-chip ${selectedOrderIdx === idx ? 'active' : ''}`}
              onClick={() => setSelectedOrderIdx(idx)}
            >
              <span>Order #{ord.id.slice(-5)}</span>
              <span className="chip-status">({ord.status})</span>
            </button>
          ))}
        </div>
      )}

      {/* Modern Redesigned SVG Map Canvas */}
      <div className="tracking-map-card">
        <div className="map-badge-top">
          <span className="live-dot-pulse" />
          <span>LIVE ROUTE MAP</span>
        </div>

        <svg viewBox="0 0 400 210" className="animated-delivery-svg">
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Map Canvas Background */}
          <rect width="100%" height="100%" fill="#eff6ff" rx="16" />

          {/* Land Blocks & Parks */}
          <rect x="25" y="20" width="85" height="55" rx="10" fill="#dbeafe" opacity="0.65" />
          <rect x="145" y="125" width="110" height="65" rx="10" fill="#dbeafe" opacity="0.65" />
          <rect x="275" y="20" width="105" height="75" rx="10" fill="#e0e7ff" opacity="0.65" />

          {/* City Road Network */}
          <path d="M 15 75 Q 125 75 200 115 T 385 115" fill="none" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" />
          <path d="M 70 15 L 70 195" fill="none" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
          <path d="M 330 15 L 330 195" fill="none" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />

          {/* Delivery Route Path */}
          <path
            d="M 70 160 C 130 160, 140 65, 210 65 C 270 65, 290 140, 330 140"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#routeGlow)"
          />
          <path
            d="M 70 160 C 130 160, 140 65, 210 65 C 270 65, 290 140, 330 140"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            className="animated-dash-line"
          />

          {/* Hakimi Depot Pin (Start) */}
          <g transform="translate(70, 160)">
            <circle r="16" fill="rgba(37, 99, 235, 0.2)" className="pulse-ring" />
            <circle r="11" fill="#2563eb" />
            <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">🏬</text>
          </g>

          {/* Customer Home Pin (End) */}
          <g transform="translate(330, 140)">
            <circle r="16" fill="rgba(22, 163, 74, 0.2)" className="pulse-ring-green" />
            <circle r="11" fill="#16a34a" />
            <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">🏡</text>
          </g>

          {/* Scooter Icon (Delivery Partner Location) */}
          {displayedOrder.status !== 'delivered' && (
            <g transform={`translate(${scooterPos.x}, ${scooterPos.y})`} className="moving-scooter-group">
              <circle r="15" fill="rgba(245, 158, 11, 0.3)" className="scooter-pulse" />
              <rect x="-13" y="-13" width="26" height="26" rx="13" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              <text y="4" textAnchor="middle" fontSize="13">🛵</text>
            </g>
          )}
        </svg>

        {/* Location Route Legend */}
        <div className="map-legend-row">
          <div className="legend-item">
            <span className="legend-badge blue-badge">🏬 DEPOT</span>
            <span className="legend-text">Hakimi General Store, Chandni Chowk</span>
          </div>
          <div className="legend-item text-right">
            <span className="legend-badge green-badge">🏡 DESTINATION</span>
            <span className="legend-text" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {deliveryAddressStr}
            </span>
          </div>
        </div>
      </div>

      {/* Main Details Section */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* ETA & Live Status Banner */}
        <div className="tracking-eta-card">
          <div className="eta-left-col">
            {displayedOrder.status === 'delivered' ? (
              <h3 className="eta-title green-text">Successfully Delivered!</h3>
            ) : (
              <h3 className="eta-title">
                Arriving in {displayedOrder.eta || 12} mins
              </h3>
            )}
            <p className="eta-subtext">
              {displayedOrder.status === 'packing' && 'Hakimi staff is currently packing your items.'}
              {displayedOrder.status === 'out_for_delivery' && 'Delivery partner is on the way to your location!'}
              {displayedOrder.status === 'delivered' && 'Thank you for shopping with Hakimi Supermarket.'}
            </p>
          </div>
          <div className="eta-clock-icon">
            <Clock size={24} color="#2563eb" />
          </div>
        </div>

        {/* Timeline Milestones Progress Bar */}
        <div className="timeline-card">
          <div className="timeline-tracker">
            <div className="timeline-line" />
            <div 
              className="timeline-line-progress" 
              style={{ width: `${((currentStageInfo.stage - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
              const nodeStage = idx + 1;
              const isActive = nodeStage === currentStageInfo.stage;
              const isCompleted = nodeStage < currentStageInfo.stage;

              return (
                <div 
                  key={step.status}
                  className={`timeline-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="timeline-dot">
                    {isCompleted ? <CheckCircle2 size={14} color="#ffffff" /> : <span>{step.icon}</span>}
                  </div>
                  <span className="timeline-node-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Partner Profile Card */}
        <div className="delivery-partner-card">
          <div className="partner-avatar-box">
            <span className="partner-emoji">🛵</span>
          </div>
          <div className="partner-info-col">
            <div className="partner-title-row">
              <h4 className="partner-name">Hakimi Delivery Partner</h4>
              <span className="verified-badge">Verified Partner</span>
            </div>
            <div className="partner-sub-row">
              <span className="partner-phone-text">+91 99939 49604</span>
              <span className="bullet-dot">•</span>
              <span className="partner-rating">⭐ 4.9 (Express Delivery)</span>
            </div>
          </div>
          <div className="partner-actions-group">
            <a 
              href="tel:+919993949604" 
              className="action-btn call-btn"
              title="Call Delivery Partner"
            >
              <Phone size={15} />
              <span>Call</span>
            </a>
            <a 
              href="https://wa.me/919993949604" 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-btn whatsapp-btn"
              title="WhatsApp Store & Delivery"
            >
              <MessageCircle size={15} />
            </a>
          </div>
        </div>

        {/* Delivering Order Bill Summary (Full Breakdown) */}
        <div className="delivering-bill-card">
          <div className="bill-card-header" onClick={() => setIsBillExpanded(!isBillExpanded)}>
            <div className="bill-header-left">
              <Receipt size={18} color="#2563eb" />
              <div>
                <h4 className="bill-header-title">Delivering Order Bill ({displayedOrder.items.length} items)</h4>
                <span className="bill-header-sub">Order ID: #{displayedOrder.id}</span>
              </div>
            </div>
            <div className="bill-header-right">
              <span className="bill-total-price">₹{displayedOrder.bill.grandTotal}</span>
              <ChevronDown size={18} className={`arrow-icon ${isBillExpanded ? 'rotated' : ''}`} />
            </div>
          </div>

          {isBillExpanded && (
            <div className="bill-card-body">
              {/* Itemized list */}
              <div className="bill-items-scroll">
                {displayedOrder.items.map(item => (
                  <div key={item.id} className="bill-item-row">
                    <div className="bill-item-name-col">
                      <span className="item-qty-badge">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <span className="item-weight">{item.weight}</span>
                    <span className="item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="bill-divider" />

              {/* Price calculations */}
              <div className="bill-price-line">
                <span>Items Subtotal</span>
                <span>₹{displayedOrder.bill.itemsTotal}</span>
              </div>

              <div className="bill-price-line">
                <span>Delivery Charge</span>
                {displayedOrder.bill.deliveryCharge === 0 ? (
                  <span className="green-text">FREE</span>
                ) : (
                  <span>₹{displayedOrder.bill.deliveryCharge}</span>
                )}
              </div>

              <div className="bill-price-line">
                <span>Handling Fee</span>
                {displayedOrder.bill.handlingCharge === 0 ? (
                  <span className="green-text">FREE</span>
                ) : (
                  <span>₹{displayedOrder.bill.handlingCharge}</span>
                )}
              </div>

              {displayedOrder.bill.discount > 0 && (
                <div className="bill-price-line green-text">
                  <span>Discount Applied</span>
                  <span>-₹{displayedOrder.bill.discount}</span>
                </div>
              )}

              <div className="bill-divider" />

              <div className="bill-grand-total-line">
                <span className="grand-label">Grand Total Payable</span>
                <span className="grand-val">₹{displayedOrder.bill.grandTotal}</span>
              </div>

              <div className="bill-payment-mode-badge">
                <span>💳 Payment Mode: Cash on Delivery / UPI</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
