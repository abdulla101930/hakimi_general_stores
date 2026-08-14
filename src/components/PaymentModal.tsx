import { useState, type CSSProperties, type FormEvent } from 'react';
import { X, CreditCard, QrCode, CheckCircle, ArrowRight, Lock, Banknote, Copy } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (method: 'COD' | 'ONLINE', paymentDetails?: string) => void;
}

interface RazorpayWindow {
  Razorpay: new (options: Record<string, unknown>) => { open: () => void };
}

const storeUpiId = '9893264182-2@ybl';
const bankAccountInfo = 'HDFC Bank - 7162';
const storeName = 'Hakimi General Store';

export function PaymentModal({ isOpen, onClose, amount, customerName, customerPhone, onPaymentSuccess }: PaymentModalProps) {
  const [selectedTab, setSelectedTab] = useState<'online' | 'cod'>('online');
  const [txnIdInput, setTxnIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const formattedAmount = amount.toFixed(2);
  const upiUri = `upi://pay?pa=${storeUpiId}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

  const handleUpiAppRedirect = (appName: string) => {
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
    const rzpWindow = window as unknown as RazorpayWindow;
    if (rzpWindow.Razorpay) {
      const options = {
        key: 'rzp_test_HakimiStoreKey',
        amount: amount * 100,
        currency: 'INR',
        name: storeName,
        description: `Order Payment for ${customerName}`,
        handler: (response: { razorpay_payment_id: string }) => {
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
      const rzp = new rzpWindow.Razorpay(options);
      rzp.open();
    } else {
      window.location.href = upiUri;
    }
  };

  const handleConfirmPaid = (e: FormEvent) => {
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

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: '14px',
    border: 'none',
    background: active ? '#ffffff' : 'transparent',
    borderBottom: active ? '3px solid #2563eb' : 'none',
    fontWeight: 800,
    fontSize: '13px',
    color: active ? '#2563eb' : '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  });

  const upiApps = [
    { name: 'Google Pay', icon: '🔵', bg: '#eff6ff', color: '#1d4ed8' },
    { name: 'PhonePe', icon: '🟣', bg: '#faf5ff', color: '#6b21a8' },
    { name: 'Paytm', icon: '🔷', bg: '#f0f9ff', color: '#0369a1' },
    { name: 'BHIM UPI', icon: '🟠', bg: '#fff7ed', color: '#c2410c' }
  ];

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
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="pm-close-btn"
            aria-label="Close payment"
          >
            <X size={18} />
          </button>

          <span className="pm-header-label">Secure Payment Gateway</span>
          <div className="pm-header-amount-row">
            <h2>₹{amount}</h2>
            <span>Total Payable</span>
          </div>
        </div>

        <div className="pm-tabs-row">
          <button type="button" style={tabStyle(selectedTab === 'online')} onClick={() => setSelectedTab('online')}>
            <CreditCard size={16} />
            <span>Online Payment (UPI/Cards)</span>
          </button>
          <button type="button" style={tabStyle(selectedTab === 'cod')} onClick={() => setSelectedTab('cod')}>
            <Banknote size={16} />
            <span>Cash on Delivery</span>
          </button>
        </div>

        <div className="pm-body" style={{ padding: '20px 24px 24px' }}>
          {selectedTab === 'online' ? (
            <div>
              <div className="pm-section" style={{ marginBottom: '16px' }}>
                <label className="pm-label">1. Pay Directly via UPI App</label>
                <div className="pm-apps-grid">
                  {upiApps.map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => handleUpiAppRedirect(app.name)}
                      className="pm-app-btn"
                      style={{ backgroundColor: app.bg, borderColor: '#e2e8f0' }}
                    >
                      <span style={{ fontSize: '20px' }}>{app.icon}</span>
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: app.color }}>{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pm-qr-box">
                <div className="pm-qr-title">
                  <QrCode size={16} color="#2563eb" />
                  <span>2. Or Scan QR Code to Pay ₹{amount}</span>
                </div>

                <div className="pm-bank-badge">🏦 {bankAccountInfo}</div>

                <div className="pm-qr-frame">
                  <img src={qrCodeUrl} alt="Scan UPI QR Code to Pay" width="140" height="140" />
                </div>

                <div className="pm-upi-row">
                  <span>
                    UPI ID: <strong>{storeUpiId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="pm-copy-btn"
                    style={{
                      backgroundColor: isCopied ? '#16a34a' : '#eff6ff',
                      color: isCopied ? '#ffffff' : '#2563eb'
                    }}
                  >
                    <Copy size={12} />
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button type="button" onClick={handleRazorpayCheckout} className="pm-razorpay-btn">
                <CreditCard size={15} />
                <span>Pay via Razorpay (Cards / Netbanking)</span>
              </button>

              <form onSubmit={handleConfirmPaid} className="pm-utr-form">
                <label className="pm-label">Enter UPI Reference / UTR No (Optional for quick verification)</label>
                <div className="pm-utr-row">
                  <input
                    type="text"
                    placeholder="12-digit UTR No (e.g. 4218xxxxxxx)"
                    value={txnIdInput}
                    onChange={(e) => setTxnIdInput(e.target.value)}
                    className="pm-utr-input"
                  />
                  <button type="submit" disabled={isSubmitting} className="pm-paid-btn">
                    <CheckCircle size={14} />
                    <span>Paid</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="pm-cod-body">
              <div className="pm-cod-icon-circle">
                <Banknote size={32} color="#2563eb" />
              </div>
              <h3>Pay Cash Upon Delivery</h3>
              <p>
                Pay exact amount <strong>₹{amount}</strong> in cash to the delivery partner when your order arrives.
              </p>
              <button type="button" onClick={handleConfirmCod} className="pm-cod-btn">
                <span>Confirm COD Order (₹{amount})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="pm-footer">
          <Lock size={12} color="#16a34a" />
          <span>256-Bit Encrypted Secure Hakimi Merchant Checkout</span>
        </div>
      </div>
    </div>
  );
}
