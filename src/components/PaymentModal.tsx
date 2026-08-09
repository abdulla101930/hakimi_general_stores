import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  ArrowRight, 
  Lock,
  Banknote,
  Copy
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (method: 'COD' | 'ONLINE', paymentDetails?: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerName,
  customerPhone,
  onPaymentSuccess
}) => {
  const [selectedTab, setSelectedTab] = useState<'online' | 'cod'>('online');
  const [txnIdInput, setTxnIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Merchant Payment Account Details (HDFC Bank - 7162)
  const storeUpiId = '9893264182-2@ybl';
  const bankAccountInfo = 'HDFC Bank - 7162';
  const storeName = 'Hakimi General Store';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Standard UPI URI format with 2-decimal amount and clean merchant name
  const formattedAmount = amount.toFixed(2);
  const upiUri = `upi://pay?pa=${storeUpiId}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR`;

  // QR Code Image Generator API URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

  const handleUpiAppRedirect = (appName: string) => {
    // Copy UPI ID to clipboard as immediate fallback
    try {
      navigator.clipboard.writeText(storeUpiId);
    } catch (e) {
      console.error(e);
    }

    let deepLink = upiUri;
    if (appName === 'Google Pay') {
      deepLink = `tez://upi/pay?pa=${storeUpiId}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR`;
    } else if (appName === 'PhonePe') {
      deepLink = `phonepe://pay?pa=${storeUpiId}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR`;
    } else if (appName === 'Paytm') {
      deepLink = `paytmmp://pay?pa=${storeUpiId}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR`;
    }
    
    window.location.href = deepLink;
  };

  const handleRazorpayCheckout = () => {
    if ((window as any).Razorpay) {
      const options = {
        key: 'rzp_test_HakimiStoreKey', // Replace with production merchant key when available
        amount: amount * 100, // amount in paisa
        currency: 'INR',
        name: storeName,
        description: `Order Payment for ${customerName}`,
        handler: function (response: any) {
          onPaymentSuccess('ONLINE', `Razorpay Txn: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: customerName,
          contact: customerPhone
        },
        theme: {
          color: '#2563eb'
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      // Fallback if Razorpay script is not present
      window.location.href = upiUri;
    }
  };

  const handleConfirmPaid = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onPaymentSuccess('ONLINE', txnIdInput.trim() ? `UPI Ref: ${txnIdInput.trim()}` : 'Paid via UPI/QR');
      setIsSubmitting(false);
    }, 600);
  };

  const handleConfirmCod = () => {
    onPaymentSuccess('COD', 'Cash on Delivery');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div 
        className="modal-content"
        style={{ 
          maxWidth: '440px', 
          width: '92%', 
          borderRadius: '20px', 
          padding: '0', 
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Top Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          padding: '20px 24px',
          color: '#ffffff',
          position: 'relative'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>

          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
            Secure Payment Gateway
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>₹{amount}</h2>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>Total Payable</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setSelectedTab('online')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: selectedTab === 'online' ? '#ffffff' : 'transparent',
              borderBottom: selectedTab === 'online' ? '3px solid #2563eb' : 'none',
              fontWeight: 800,
              fontSize: '13px',
              color: selectedTab === 'online' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CreditCard size={16} />
            <span>Online Payment (UPI/Cards)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('cod')}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              background: selectedTab === 'cod' ? '#ffffff' : 'transparent',
              borderBottom: selectedTab === 'cod' ? '3px solid #2563eb' : 'none',
              fontWeight: 800,
              fontSize: '13px',
              color: selectedTab === 'cod' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Banknote size={16} />
            <span>Cash on Delivery</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px 24px 24px' }}>
          {selectedTab === 'online' ? (
            <div>
              {/* UPI Quick Apps */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  1. Pay Directly via UPI App
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { name: 'Google Pay', icon: '🔵', bg: '#eff6ff', color: '#1d4ed8' },
                    { name: 'PhonePe', icon: '🟣', bg: '#faf5ff', color: '#6b21a8' },
                    { name: 'Paytm', icon: '🔷', bg: '#f0f9ff', color: '#0369a1' },
                    { name: 'BHIM UPI', icon: '🟠', bg: '#fff7ed', color: '#c2410c' }
                  ].map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => handleUpiAppRedirect(app.name)}
                      style={{
                        backgroundColor: app.bg,
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{app.icon}</span>
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: app.color }}>{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan UPI QR Code Section */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  <QrCode size={16} color="#2563eb" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                    2. Or Scan QR Code to Pay ₹{amount}
                  </span>
                </div>

                <div style={{ 
                  display: 'inline-block', 
                  backgroundColor: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  marginBottom: '8px'
                }}>
                  🏦 {bankAccountInfo}
                </div>

                <div>
                  <div style={{ display: 'inline-block', padding: '6px', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <img 
                      src={qrCodeUrl} 
                      alt="Scan UPI QR Code to Pay" 
                      style={{ width: '140px', height: '140px', display: 'block' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    UPI ID: <strong>{storeUpiId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    style={{
                      backgroundColor: isCopied ? '#16a34a' : '#eff6ff',
                      color: isCopied ? '#ffffff' : '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Copy size={12} />
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Razorpay Standard Gateway Button */}
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <CreditCard size={15} />
                <span>Pay via Razorpay (Cards / Netbanking)</span>
              </button>

              {/* Payment Confirmation Form */}
              <form onSubmit={handleConfirmPaid} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Enter UPI Reference / UTR No (Optional for quick verification)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="12-digit UTR No (e.g. 4218xxxxxxx)"
                    value={txnIdInput}
                    onChange={(e) => setTxnIdInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>Paid</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Cash on Delivery Tab */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Banknote size={32} color="#2563eb" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Pay Cash Upon Delivery
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 20px', maxWidth: '280px', marginInline: 'auto' }}>
                Pay exact amount <strong>₹{amount}</strong> in cash to the delivery partner when your order arrives.
              </p>

              <button
                type="button"
                onClick={handleConfirmCod}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                <span>Confirm COD Order (₹{amount})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '10px',
          color: '#64748b',
          fontWeight: 600
        }}>
          <Lock size={12} color="#16a34a" />
          <span>256-Bit Encrypted Secure Hakimi Merchant Checkout</span>
        </div>
      </div>
    </div>
  );
};
