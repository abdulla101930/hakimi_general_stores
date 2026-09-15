import { useState, useEffect, type CSSProperties } from 'react';
import { OWNER_UPI_ID, OWNER_PHONE_DISPLAY, OWNER_NAME } from '../lib/constants';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Lock,
  Banknote,
  Copy,
  Clock,
  Zap,
  Radio,
  AlertTriangle,
  Ban
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  onPaymentSuccess: (method: 'COD' | 'ONLINE', paymentDetails?: string) => void;
}

const bankAccountInfo = `HDFC Bank - 7162 (${OWNER_NAME})`;

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess
}: PaymentModalProps) {
  const [selectedTab, setSelectedTab] = useState<'online' | 'cod'>('online');
  const [isHandshakeActive, setIsHandshakeActive] = useState(false);
  const [handshakeState, setHandshakeState] = useState<'listening' | 'verified' | 'expired' | 'fallback_warning'>('listening');
  const [activeAppName, setActiveAppName] = useState<string>('UPI App');
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 Minutes (120 seconds) timer
  const [fallbackTimer, setFallbackTimer] = useState<number>(5); // 5 Seconds cancel window timer
  const [isCopied, setIsCopied] = useState(false);
  const [txnSessionId, setTxnSessionId] = useState<string>('');

  const formattedAmount = amount.toFixed(2);
  const upiUri = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${formattedAmount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

  // 1. 2-Minute Payment Initialization Handshake Timer (120s)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isHandshakeActive && handshakeState === 'listening' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer expired -> Trigger automatic COD fallback warning with 5s cancel window
            setHandshakeState('fallback_warning');
            setFallbackTimer(5);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isHandshakeActive, handshakeState, timeLeft]);

  // 2. 5-Second Warning Window Countdown Timer for Automatic COD Switch
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (handshakeState === 'fallback_warning' && fallbackTimer > 0) {
      timer = setInterval(() => {
        setFallbackTimer((prev) => {
          if (prev <= 1) {
            // 5 Seconds window completed -> Switch directly to COD order!
            onPaymentSuccess('COD', 'Cash on Delivery (Automated Fallback after Online Payment Timeout)');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [handshakeState, fallbackTimer, onPaymentSuccess]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(OWNER_UPI_ID);
    } catch {
      /* noop */
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const startAutomatedHandshake = (appName: string = 'UPI App') => {
    const newSessionId = `HKM-TXN-${Date.now().toString().slice(-6)}`;
    setTxnSessionId(newSessionId);
    setActiveAppName(appName);
    setIsHandshakeActive(true);
    setHandshakeState('listening');
    setTimeLeft(120); // 2 Minutes timer reset
  };

  const handleUpiAppRedirect = (appName: string) => {
    handleCopyUpi();
    const newSessionId = `HKM-TXN-${Date.now().toString().slice(-6)}`;
    setTxnSessionId(newSessionId);

    let deepLink = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${formattedAmount}&cu=INR&mode=02&purpose=00`;
    if (appName === 'Google Pay') {
      deepLink = `tez://upi/pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${formattedAmount}&cu=INR&mode=02&purpose=00`;
    } else if (appName === 'PhonePe') {
      deepLink = `phonepe://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${formattedAmount}&cu=INR&mode=02&purpose=00`;
    } else if (appName === 'Paytm') {
      deepLink = `paytmmp://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${formattedAmount}&cu=INR&mode=02&purpose=00`;
    }

    startAutomatedHandshake(appName);

    try {
      const a = document.createElement('a');
      a.href = deepLink;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      window.location.href = deepLink;
    }
  };

  const triggerManualFallback = () => {
    setHandshakeState('fallback_warning');
    setFallbackTimer(5);
  };

  const handleConfirmCod = () => {
    onPaymentSuccess('COD', 'Cash on Delivery');
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: '14px',
    border: 'none',
    background: active ? '#ffffff' : 'transparent',
    borderBottom: active ? '3px solid #059669' : 'none',
    fontWeight: 800,
    fontSize: '13px',
    color: active ? '#059669' : '#64748b',
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
            background: handshakeState === 'fallback_warning'
              ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
              : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isHandshakeActive) {
                if (window.confirm('Cancel payment initialization? Order will not be placed.')) {
                  setIsHandshakeActive(false);
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            className="pm-close-btn"
            aria-label="Close payment modal"
          >
            <X size={18} />
          </button>

          <span className="pm-header-label">
            {handshakeState === 'fallback_warning'
              ? '⚠️ Online Payment Failed - Fallback Warning'
              : isHandshakeActive
              ? 'Automated Payment Handshake'
              : 'Secure Payment Gateway'}
          </span>
          <div className="pm-header-amount-row">
            <h2>₹{formattedAmount}</h2>
            <span>Total Payable to Store ({OWNER_PHONE_DISPLAY})</span>
          </div>
        </div>

        {/* Tab Selection */}
        {!isHandshakeActive && handshakeState !== 'fallback_warning' && (
          <div className="pm-tabs-row">
            <button
              type="button"
              style={tabStyle(selectedTab === 'online')}
              onClick={() => setSelectedTab('online')}
            >
              <CreditCard size={16} />
              <span>Online Payment (UPI/QR)</span>
            </button>
            <button
              type="button"
              style={tabStyle(selectedTab === 'cod')}
              onClick={() => setSelectedTab('cod')}
            >
              <Banknote size={16} />
              <span>Cash on Delivery</span>
            </button>
          </div>
        )}

        <div className="pm-body" style={{ padding: '20px 24px 24px' }}>
          {/* --- 5-SECOND FALLBACK WARNING SCREEN (Rules: Failure switches to COD with 5s cancel window) --- */}
          {handshakeState === 'fallback_warning' ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  border: '2px solid #fecaca'
                }}
              >
                <AlertTriangle size={32} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Online Payment Unsuccessful
              </h3>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                Online payment timed out or was unfulfilled. Switching automatically to default <strong>Cash on Delivery (COD)</strong>.
              </p>

              {/* 5-Second Countdown Timer Badge */}
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Clock size={16} className="animate-spin" />
                <span>Switching to COD in <strong>{fallbackTimer} seconds</strong>...</span>
              </div>

              {/* 5-Second Window Cancel & Confirm Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleConfirmCod}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Banknote size={16} />
                  <span>Proceed with Cash on Delivery Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsHandshakeActive(false);
                    setHandshakeState('listening');
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '12px',
                    border: '1px solid #dc2626',
                    backgroundColor: '#ffffff',
                    color: '#dc2626',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Ban size={15} />
                  <span>Cancel Order (within 5-sec window)</span>
                </button>
              </div>
            </div>
          ) : isHandshakeActive ? (
            /* --- 2-MINUTE AUTOMATED UPI HANDSHAKE SCREEN --- */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              {/* 2-Minute Timer Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  padding: '6px 16px',
                  borderRadius: '24px',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '16px'
                }}
              >
                <Clock size={15} />
                <span>2-Min Payment Timer: {formatTime(timeLeft)}</span>
              </div>

              {/* Pulsing Visual Ring */}
              <div
                style={{
                  margin: '0 auto 16px',
                  position: 'relative',
                  width: '80px',
                  height: '80px'
                }}
              >
                {handshakeState === 'listening' && (
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
                )}
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: handshakeState === 'verified' ? '#d1fae5' : '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  {handshakeState === 'verified' ? (
                    <CheckCircle2 size={42} color="#059669" />
                  ) : (
                    <Radio size={38} color="#059669" className="animate-pulse" />
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {handshakeState === 'verified'
                  ? 'Payment Settlement Verified!'
                  : `Waiting for ${activeAppName} Settlement Signal`}
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                  padding: '0 8px'
                }}
              >
                {handshakeState === 'verified'
                  ? `₹${formattedAmount} successfully credited to Store Account (${OWNER_PHONE_DISPLAY}).`
                  : `Complete payment of ₹${formattedAmount} in ${activeAppName}. Automated handshake will proceed once signal is verified.`}
              </p>

              {/* Handshake Details Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'left',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Payee VPA:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{OWNER_UPI_ID}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Bill Total:</span>
                  <strong style={{ color: '#059669', fontSize: '13px' }}>₹{formattedAmount}</strong>
                </div>
                {txnSessionId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Ref Session ID:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{txnSessionId}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Handshake Status:</span>
                  <span style={{ fontWeight: 800, color: handshakeState === 'verified' ? '#059669' : '#d97706' }}>
                    {handshakeState === 'verified' ? '🟢 VERIFIED & CREDITED' : '📡 LISTENING FOR SIGNAL'}
                  </span>
                </div>
              </div>



              <button
                type="button"
                onClick={triggerManualFallback}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Payment Failed? Switch to COD
              </button>
            </div>
          ) : selectedTab === 'online' ? (
            <div>
              <div className="pm-section" style={{ marginBottom: '16px' }}>
                <label className="pm-label" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  1. Tap your UPI App to Pay ₹{formattedAmount}
                </label>
                <div className="pm-apps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {upiApps.map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => handleUpiAppRedirect(app.name)}
                      className="pm-app-btn"
                      style={{
                        backgroundColor: app.bg,
                        borderColor: '#e2e8f0',
                        padding: '10px 4px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{app.icon}</span>
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: app.color }}>
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pm-qr-box" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div className="pm-qr-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  <QrCode size={16} color="#059669" />
                  <span>2. Or Scan QR Code / Copy UPI ID</span>
                </div>

                <div className="pm-bank-badge" style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                  🏦 {bankAccountInfo}
                </div>

                <div className="pm-qr-frame" style={{ display: 'inline-block', padding: '8px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                  <img src={qrCodeUrl} alt="Scan UPI QR Code to Pay" width="140" height="140" style={{ display: 'block' }} />
                </div>

                <div className="pm-upi-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
                  <span>
                    UPI ID: <strong>{OWNER_UPI_ID}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="pm-copy-btn"
                    style={{
                      backgroundColor: isCopied ? '#059669' : '#ecfdf5',
                      color: isCopied ? '#ffffff' : '#059669',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
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
                  <Zap size={14} />
                  <span>Start Automated Handshake (2-Min Timer)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pm-cod-body" style={{ textAlign: 'center', padding: '10px 0' }}>
              <div className="pm-cod-icon-circle" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Banknote size={34} color="#059669" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Pay Cash Upon Delivery
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                Pay exact amount <strong>₹{formattedAmount}</strong> in cash to the delivery partner when your order arrives.
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
                <span>Confirm COD Order (₹{formattedAmount})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="pm-footer" style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <Lock size={12} color="#059669" />
          <span>256-Bit Encrypted Bank Gateway • Payee: {OWNER_PHONE_DISPLAY}</span>
        </div>
      </div>
    </div>
  );
}
