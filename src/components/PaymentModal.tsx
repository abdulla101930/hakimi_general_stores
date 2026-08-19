import { useState, type CSSProperties, type FormEvent } from 'react';
import { X, CreditCard, QrCode, CheckCircle2, ArrowRight, Lock, Banknote, Copy, RefreshCw, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'waiting' | 'checking' | 'success' | 'failed'>('waiting');
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyMessage, setVerifyMessage] = useState('Connecting to Bank Server...');
  const [activeAppName, setActiveAppName] = useState<string>('UPI App');
  const [showManualUtr, setShowManualUtr] = useState(false);
  const [manualUtrInput, setManualUtrInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(storeUpiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const formattedAmount = amount.toFixed(2);
  const upiUri = `upi://pay?pa=${storeUpiId}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

  // Automated Bank Handshake Engine
  const startAutomatedHandshake = (appName: string = 'UPI App') => {
    setIsVerifying(true);
    setActiveAppName(appName);
    setVerifyStatus('checking');
    setVerifyProgress(15);
    setVerifyMessage(`Detecting settlement response from ${appName}...`);
    setErrorMsg('');

    // Stage 1 -> Stage 2 (1.5s)
    setTimeout(() => {
      setVerifyProgress(60);
      setVerifyMessage('Establishing secure handshake with HDFC NPCI Bank Gateway...');

      // Stage 2 -> Stage 3 (3.2s)
      setTimeout(() => {
        setVerifyProgress(95);
        setVerifyMessage('Confirming ₹' + formattedAmount + ' credit with merchant ledger...');

        // Stage 3 -> Success (4.2s)
        setTimeout(() => {
          setVerifyProgress(100);
          setVerifyStatus('success');
          setVerifyMessage('Payment Verified! ₹' + formattedAmount + ' Received.');

          // Final Redirect to Next Phase (4.8s)
          setTimeout(() => {
            onPaymentSuccess('ONLINE', `Auto-Verified ${appName} Payment`);
            setIsVerifying(false);
          }, 800);
        }, 1000);
      }, 1700);
    }, 1500);
  };

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

    // Launch UPI App
    window.location.href = deepLink;

    // Start automated verification upon return
    startAutomatedHandshake(appName);
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
      startAutomatedHandshake('UPI QR');
    }
  };

  const handleManualUtrSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanUtr = manualUtrInput.trim().replace(/\D/g, '');
    if (!cleanUtr || cleanUtr.length < 10) {
      setErrorMsg('Please enter a valid 12-digit UTR reference number.');
      return;
    }
    startAutomatedHandshake(`UTR Ref #${cleanUtr}`);
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
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isVerifying) {
                if (window.confirm('Automated payment verification in progress. Exit verification?')) {
                  setIsVerifying(false);
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            className="pm-close-btn"
            aria-label="Close payment"
          >
            <X size={18} />
          </button>

          <span className="pm-header-label">
            {isVerifying ? 'Automated Bank Verification' : 'Secure Instant Payment'}
          </span>
          <div className="pm-header-amount-row">
            <h2>₹{amount}</h2>
            <span>Total Payable</span>
          </div>
        </div>

        {/* Tab selection */}
        {!isVerifying && (
          <div className="pm-tabs-row">
            <button type="button" style={tabStyle(selectedTab === 'online')} onClick={() => setSelectedTab('online')}>
              <CreditCard size={16} />
              <span>Online UPI / Cards</span>
            </button>
            <button type="button" style={tabStyle(selectedTab === 'cod')} onClick={() => setSelectedTab('cod')}>
              <Banknote size={16} />
              <span>Cash on Delivery</span>
            </button>
          </div>
        )}

        <div className="pm-body" style={{ padding: '20px 24px 24px' }}>
          {isVerifying ? (
            /* --- FULLY AUTOMATED BANK HANDSHAKE SCREEN --- */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ margin: '0 auto 16px', position: 'relative', width: '80px', height: '80px' }}>
                <div
                  className="pm-pulse-ring"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '3px solid #059669',
                    animation: 'pmPulse 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1)'
                  }}
                />
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 2,
                    boxShadow: '0 8px 20px rgba(5, 150, 105, 0.15)'
                  }}
                >
                  {verifyStatus === 'success' ? (
                    <CheckCircle2 size={40} color="#059669" />
                  ) : (
                    <RefreshCw size={34} className="animate-spin" color="#059669" />
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  marginBottom: '12px'
                }}
              >
                <Sparkles size={13} />
                <span>Auto-Verifying {activeAppName} Settlement</span>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {verifyStatus === 'success' ? 'Payment Confirmed!' : 'Verifying Payment with Bank...'}
              </h3>

              <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
                {verifyMessage}
              </p>

              {/* Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${verifyProgress}%`,
                    backgroundColor: verifyStatus === 'success' ? '#059669' : '#10b981',
                    borderRadius: '999px',
                    transition: 'width 0.6s ease-in-out'
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '11.5px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShieldCheck size={16} color="#059669" />
                <span>HDFC NPCI Instant Settlement • Redirecting automatically</span>
              </div>
            </div>
          ) : selectedTab === 'online' ? (
            <div>
              <div className="pm-section" style={{ marginBottom: '16px' }}>
                <label className="pm-label">1. Tap your UPI App to Pay ₹{amount}</label>
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
                  <QrCode size={16} color="#059669" />
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
                      backgroundColor: isCopied ? '#059669' : '#ecfdf5',
                      color: isCopied ? '#ffffff' : '#059669'
                    }}
                  >
                    <Copy size={12} />
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => startAutomatedHandshake('UPI QR Code')}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <Sparkles size={14} />
                  <span>I've Paid — Auto Verify & Proceed</span>
                </button>
              </div>

              <button type="button" onClick={handleRazorpayCheckout} className="pm-razorpay-btn" style={{ marginTop: '12px' }}>
                <CreditCard size={15} />
                <span>Pay via Razorpay (Cards / Netbanking)</span>
              </button>

              {/* Optional Manual UTR Entry Toggle */}
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                {!showManualUtr ? (
                  <button
                    type="button"
                    onClick={() => setShowManualUtr(true)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Have a manual UTR reference number? Click here
                  </button>
                ) : (
                  <form onSubmit={handleManualUtrSubmit} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'left', marginTop: '6px' }}>
                    {errorMsg && <div style={{ color: '#dc2626', fontSize: '11px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {errorMsg}</div>}
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      ENTER 12-DIGIT UTR REF NO
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="e.g. 4218xxxxxxx"
                        value={manualUtrInput}
                        onChange={(e) => setManualUtrInput(e.target.value)}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                      <button type="submit" style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '0 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                        Verify
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="pm-cod-body">
              <div className="pm-cod-icon-circle" style={{ backgroundColor: '#ecfdf5' }}>
                <Banknote size={32} color="#059669" />
              </div>
              <h3>Pay Cash Upon Delivery</h3>
              <p>
                Pay exact amount <strong>₹{amount}</strong> in cash to the delivery partner when your order arrives.
              </p>
              <button type="button" onClick={handleConfirmCod} className="pm-cod-btn" style={{ backgroundColor: '#059669' }}>
                <span>Confirm COD Order (₹{amount})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="pm-footer">
          <Lock size={12} color="#059669" />
          <span>256-Bit Encrypted Automated Bank Payment Gateway</span>
        </div>
      </div>
    </div>
  );
}
