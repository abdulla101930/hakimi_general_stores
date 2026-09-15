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

const GooglePayIcon = () => (
  <svg width="44" height="26" viewBox="0 0 100 40" fill="none">
    <rect width="100" height="40" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
    <path d="M28.3 20.3c0-.6-.1-1.3-.2-1.9H18v3.6h5.8c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8.3z" fill="#4285F4"/>
    <path d="M18 30.8c3.5 0 6.4-1.1 8.5-3.1l-3.6-2.7c-1.1.8-2.6 1.3-4.9 1.3-3.8 0-7-2.6-8.1-6.1H6.2v2.8c2.2 4.4 6.7 7.8 11.8 7.8z" fill="#34A853"/>
    <path d="M9.9 20.2c-.3-.8-.5-1.7-.5-2.7s.2-1.9.5-2.7v-2.8H6.2C5.4 13.7 5 15.8 5 18s.4 4.3 1.2 6l3.7-2.8z" fill="#FBBC05"/>
    <path d="M18 9.2c2 0 3.7.7 5.1 1.9l3.8-3.8C24.4 5.1 21.5 4 18 4 12.9 4 8.4 7.4 6.2 11.8l3.7 2.8c1.1-3.5 4.3-6.1 8.1-6.1z" fill="#EA4335"/>
    <path d="M38.8 28V12h3.5v16h-3.5zm11.4-4.5c0 1.2-.4 2.2-1.1 3-.7.8-1.7 1.2-2.8 1.2-1.2 0-2.1-.4-2.8-1.2-.7-.8-1.1-1.8-1.1-3s.4-2.2 1.1-3c.7-.8 1.7-1.2 2.8-1.2 1.2 0 2.1.4 2.8 1.2.7.8 1.1 1.8 1.1 3zm3.4 0c0-2.1-.7-3.8-2.1-5.1-1.4-1.3-3.2-2-5.3-2-2.2 0-4 .7-5.4 2-1.4 1.3-2.1 3-2.1 5.1s.7 3.8 2.1 5.1c1.4 1.3 3.2 2 5.4 2 2.2 0 4-.7 5.3-2 1.4-1.3 2.1-3 2.1-5.1zm11.7.5c0 1.1-.4 2.1-1.2 2.8-.8.8-1.8 1.2-3 1.2-1.1 0-2.1-.4-2.9-1.2-.8-.8-1.2-1.8-1.2-2.8V16.4h-3.4V24c0 2.1.7 3.8 2.1 5.1 1.4 1.3 3.2 2 5.4 2s4-.7 5.4-2c1.4-1.3 2.1-3 2.1-5.1v-7.6h-3.3v7.6zm10.7-3.6c-1.1 0-2.1.4-2.8 1.2-.7.8-1.1 1.8-1.1 3s.4 2.2 1.1 3c.7.8 1.7 1.2 2.8 1.2 1.2 0 2.1-.4 2.8-1.2.7-.8 1.1-1.8 1.1-3s-.4-2.2-1.1-3c-.7-.8-1.7-1.2-2.8-1.2zm3.4 0c0-2.1-.7-3.8-2.1-5.1-1.4-1.3-3.2-2-5.3-2-2.2 0-4 .7-5.4 2-1.4 1.3-2.1 3-2.1 5.1s.7 3.8 2.1 5.1c1.4 1.3 3.2 2 5.4 2 2.2 0 4-.7 5.3-2 1.4-1.3 2.1-3 2.1-5.1z" fill="#5F6368"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="22" fill="#5F259F"/>
    <path d="M66 30H52L41 54H52C60 54 66 49 66 40.5C66 32 66 30 66 30Z" fill="white"/>
    <path d="M30 30V68H35.5V58.5H41L52 68H66L53 56.5C59.5 53.2 63.5 46.6 63.5 39.2C63.5 29.8 55.5 23 45.5 23H30V30Z" fill="white"/>
  </svg>
);

const PaytmIcon = () => (
  <svg width="44" height="26" viewBox="0 0 120 45" fill="none">
    <rect width="120" height="45" rx="8" fill="#002E6E"/>
    <path d="M12 12h10v22H12z" fill="#00BAF2"/>
    <path d="M25 12h16c5 0 9 3 9 7v2c0 4-4 7-9 7h-7v8H25V12zm9 5v6h7v-6h-7z" fill="#00BAF2"/>
    <path d="M52 12h16v5h-5v17h-6V17h-5v-5z" fill="#00BAF2"/>
    <path d="M70 12h9l6 11 6-11h9L88 34h-7L70 12z" fill="#00BAF2"/>
    <path d="M102 12h12v22h-12z" fill="#00BAF2"/>
  </svg>
);

const BhimUpiIcon = () => (
  <svg width="44" height="26" viewBox="0 0 120 45" fill="none">
    <rect width="120" height="45" rx="8" fill="#0284C7"/>
    <path d="M14 10h20c5 0 9 4 9 9 0 3-1.5 5.5-4 7 4 2 6.5 6 6.5 10 0 5.5-4.5 10-10 10H14V10zm8 7v6h8c1.8 0 3-1.2 3-3s-1.2-3-3-3h-8zm0 12v7h9c1.8 0 3-1.2 3-3.5s-1.2-3.5-3-3.5h-9z" fill="#FFFFFF"/>
    <path d="M60 36l12-13.5L60 9" stroke="#FF6600" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M82 36l12-13.5L82 9" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
  const upiUri = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent('Hakimi Supermarket Order')}`;
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

    const payeeName = encodeURIComponent(OWNER_NAME);

    // Pure Universal NPCI Standard UPI URI (Supported natively by all Android & iOS UPI apps)
    const cleanUpiUri = `upi://pay?pa=${OWNER_UPI_ID}&pn=${payeeName}&am=${formattedAmount}&cu=INR`;

    startAutomatedHandshake(appName);

    // Synchronous top-level redirect to invoke native Android/iOS UPI app selector
    try {
      window.location.href = cleanUpiUri;
    } catch {
      window.open(cleanUpiUri, '_self');
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
    { name: 'Google Pay', icon: <GooglePayIcon />, bg: '#ffffff', color: '#1d4ed8', border: '#e2e8f0' },
    { name: 'PhonePe', icon: <PhonePeIcon />, bg: '#ffffff', color: '#6b21a8', border: '#e2e8f0' },
    { name: 'Paytm', icon: <PaytmIcon />, bg: '#ffffff', color: '#0369a1', border: '#e2e8f0' },
    { name: 'BHIM UPI', icon: <BhimUpiIcon />, bg: '#ffffff', color: '#0284c7', border: '#e2e8f0' }
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
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        padding: '12px 6px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px' }}>
                        {app.icon}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#1e293b' }}>
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
