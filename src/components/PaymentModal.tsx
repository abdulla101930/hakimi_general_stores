import { OWNER_PHONE_DISPLAY } from '../lib/constants';
import { X, Banknote, ArrowRight, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  onPaymentSuccess: (method: 'COD', paymentDetails?: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess
}: PaymentModalProps) {
  if (!isOpen) return null;

  const handleConfirmCod = () => {
    onPaymentSuccess('COD', 'Cash on Delivery');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '420px',
          width: '92%',
          borderRadius: '20px',
          padding: '0',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="pm-close-btn"
            aria-label="Close payment modal"
          >
            <X size={18} />
          </button>

          <span className="pm-header-label">Cash on Delivery Checkout</span>
          <div className="pm-header-amount-row">
            <h2>₹{amount}</h2>
            <span>Total Payable on Delivery ({OWNER_PHONE_DISPLAY})</span>
          </div>
        </div>

        {/* Body */}
        <div className="pm-body" style={{ padding: '24px' }}>
          <div className="pm-cod-body">
            <div className="pm-cod-icon-circle" style={{ backgroundColor: '#ecfdf5', margin: '0 auto 16px' }}>
              <Banknote size={36} color="#059669" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Pay Cash Upon Delivery
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Pay the exact amount <strong>₹{amount}</strong> in cash to the delivery partner when your order arrives at your doorstep.
            </p>
            <button
              type="button"
              onClick={handleConfirmCod}
              className="pm-cod-btn"
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#059669',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <span>Confirm COD Order (₹{amount})</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pm-footer" style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <ShieldCheck size={14} color="#059669" />
          <span>Verified Cash on Delivery Service • Hakimi Supermarket</span>
        </div>
      </div>
    </div>
  );
}
