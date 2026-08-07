import React from 'react';
import { useApp } from '../context/AppContext';
import { Phone, ArrowLeft, Star, ShoppingBag, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export const DeliveryTracking: React.FC = () => {
  const { activeOrder, setView } = useApp();

  if (!activeOrder) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        height: '100%'
      }}>
        <span style={{ fontSize: '48px', marginBottom: '16px' }}>📍</span>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          No Active Deliveries
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '240px', lineHeight: '1.4' }}>
          You don't have any order being delivered right now.
        </p>
        <button 
          className="btn-primary" 
          style={{ marginTop: '20px', padding: '10px 24px' }}
          onClick={() => setView('catalog')}
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  if (activeOrder.status === 'placed') {
    return (
      <div className="pending-confirmation-view">
        <div style={{ position: 'absolute', top: 14, left: 16 }}>
          <button 
            className="btn-icon-action" 
            onClick={() => setView('catalog')}
            style={{ width: '32px', height: '32px' }}
          >
            <ArrowLeft size={16} />
          </button>
        </div>
        
        <div className="pending-spinner-container">
          <div className="pending-spinner-ring"></div>
        </div>

        <h2 className="pending-title">Waiting for Confirmation</h2>
        <p className="pending-desc">
          We have forwarded your bill to the shop owner on WhatsApp.
        </p>
        <p className="pending-desc" style={{ marginTop: 8, color: 'var(--text-muted)' }}>
          Please wait... the live GPS tracking map will automatically open once the merchant accepts and confirms your order.
        </p>

        <span className="pending-order-id-badge">
          Order ID: {activeOrder.id}
        </span>

        {/* Display ordered items summary */}
        <div style={{
          marginTop: 24,
          width: '100%',
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--border-radius-md)',
          padding: '12px',
          textAlign: 'left'
        }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
            Items Ordered ({activeOrder.items.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '100px', overflowY: 'auto' }}>
            {activeOrder.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
            <span>Total Bill</span>
            <span>₹{activeOrder.bill.grandTotal}</span>
          </div>
        </div>
        
        <button 
          className="btn-primary" 
          style={{ marginTop: '24px', width: '100%' }}
          onClick={() => setView('catalog')}
        >
          Back to Shop
        </button>
      </div>
    );
  }

  // Predefined SVG path coordinate string for the road network.
  // Starting at Hakimi Super Market (15, 85), moving through corners, ending at Badshah Empire Flat (85, 15)
  const pathD = "M 15 85 L 30 85 L 30 50 L 70 50 L 70 15 L 85 15";

  // Calculate rotation angle of scooter based on driverPosition
  const driverPos = activeOrder.driverPosition || { x: 15, y: 85 };

  // Determine stage numbers for progress calculation
  const statusWeight = {
    placed: 1,
    packing: 2,
    out_for_delivery: 3,
    delivered: 4
  };

  const currentStage = statusWeight[activeOrder.status];

  // Simulated milestones
  const steps = [
    { label: 'Placed', status: 'placed', icon: '📝' },
    { label: 'Packing', status: 'packing', icon: '📦' },
    { label: 'On Way', status: 'out_for_delivery', icon: '🛵' },
    { label: 'Delivered', status: 'delivered', icon: '🎁' }
  ];

  return (
    <div className="tracking-container">
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        backgroundColor: 'var(--bg-sheet)',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 20
      }}>
        <button 
          className="btn-icon-action" 
          onClick={() => setView('catalog')}
          style={{ width: '32px', height: '32px' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Track Order</h2>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ID: {activeOrder.id}</span>
        </div>
      </div>

      {/* SVG Map Section */}
      <div className="map-container">
        <svg viewBox="0 0 100 100" className="svg-map">
          {/* Map Grid Elements (gridlines to look like road network/blueprint) */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Simulated Park/Green blocks */}
          <rect x="5" y="10" width="20" height="25" rx="3" fill="rgba(16, 185, 129, 0.02)" />
          <rect x="40" y="60" width="30" height="25" rx="3" fill="rgba(16, 185, 129, 0.02)" />
          <circle cx="80" cy="70" r="10" fill="rgba(99, 102, 241, 0.02)" />

          {/* Road Network Paths */}
          <path d="M 10 30 L 90 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
          <path d="M 50 10 L 50 90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
          
          {/* Delivery Road Path */}
          <path d={pathD} className="map-path" />
          <path d={pathD} className="map-path-active" />

          {/* Depot Location (Hakimi Depot) */}
          <circle cx="15" cy="85" r="4" fill="var(--primary)" />
          <circle cx="15" cy="85" r="8" fill="none" stroke="var(--primary)" strokeWidth="1" className="pulse-circle" />
          <text x="15" y="93" fill="var(--text-secondary)" fontSize="4" fontWeight="bold" textAnchor="middle">DEPOT</text>

          {/* Customer Location (Home) */}
          <circle cx="85" cy="15" r="4" fill="var(--accent)" />
          <circle cx="85" cy="15" r="8" fill="none" stroke="var(--accent)" strokeWidth="1" className="pulse-circle" />
          <text x="85" y="8" fill="var(--text-secondary)" fontSize="4" fontWeight="bold" textAnchor="middle">HOME</text>

          {/* Scooter Icon (Driver location marker) */}
          {activeOrder.status !== 'delivered' && (
            <g transform={`translate(${driverPos.x - 3}, ${driverPos.y - 3})`} className="scooter-icon-marker">
              {/* Pulse effect on scooter */}
              <circle cx="3" cy="3" r="5" fill="rgba(245, 158, 11, 0.15)" />
              {/* Marker element */}
              <rect width="6" height="6" rx="2" fill="var(--accent)" stroke="#000" strokeWidth="0.5" />
              <text x="3" y="4.5" fontSize="3.5" textAnchor="middle">🛵</text>
            </g>
          )}
        </svg>
      </div>

      {/* Details Sheet Panel */}
      <div className="tracking-sheet">
        {/* ETA & Status */}
        <div className="tracking-eta-panel">
          <div>
            {activeOrder.status === 'delivered' ? (
              <h3 className="tracking-eta-time" style={{ color: 'var(--success)' }}>Delivered</h3>
            ) : (
              <h3 className="tracking-eta-time">
                Arriving in {activeOrder.eta || 10} mins
              </h3>
            )}
            <p className="tracking-eta-label">
              {activeOrder.status === 'packing' && 'Hakimi staff is packing your items.'}
              {activeOrder.status === 'out_for_delivery' && 'Delivery partner is on their way!'}
              {activeOrder.status === 'delivered' && 'Your order was successfully delivered.'}
            </p>
          </div>
          
          <div style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <Clock size={20} color="var(--accent)" />
          </div>
        </div>

        {/* Timeline milestones */}
        <div style={{ padding: '0 8px' }}>
          <div className="timeline-tracker">
            {/* Timeline connectors */}
            <div className="timeline-line" />
            <div 
              className="timeline-line-progress" 
              style={{
                // Calculate progress line percentage based on state
                width: `${((currentStage - 1) / (steps.length - 1)) * 100}%`
              }}
            />

            {/* Timeline milestone nodes */}
            {steps.map((step, idx) => {
              const nodeStage = idx + 1;
              const isActive = nodeStage === currentStage;
              const isCompleted = nodeStage < currentStage;

              return (
                <div 
                  key={step.status}
                  className={`timeline-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="timeline-dot">
                    {isCompleted ? <CheckCircle2 size={14} /> : <span>{step.icon}</span>}
                  </div>
                  <span className="timeline-node-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Profile */}
        <div className="driver-profile">
          <div className="driver-info">
            <div className="driver-avatar">HM</div>
            <div>
              <h4 className="driver-name">Hassan Mukhtar</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Star size={10} fill="var(--accent)" stroke="none" />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>4.9</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>• Delivery Partner</span>
              </div>
            </div>
          </div>
          
          <div className="driver-actions">
            <a href="tel:+919657152532" className="btn-driver-call">
              <Phone size={16} />
            </a>
          </div>
        </div>

        {/* Summary of Items */}
        <div style={{
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--border-radius-md)',
          padding: '12px',
          border: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShoppingBag size={14} color="var(--primary)" />
            <span>Order total: <b>{activeOrder.items.length} items</b> worth <b>₹{activeOrder.bill.grandTotal}</b></span>
          </div>
          <button 
            onClick={() => setView('catalog')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Details <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
