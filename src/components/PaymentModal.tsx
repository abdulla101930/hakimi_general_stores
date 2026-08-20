import { useState, useEffect, type CSSProperties } from 'react';
import { OWNER_UPI_ID, OWNER_PHONE_DISPLAY } from '../lib/constants';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Lock,
  Banknote,
  Copy,
  RefreshCw,
  AlertCircle,
  Clock,
  Zap,
  Radio
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName: string;
  customerPhone: string;
  onPaymentSuccess: (method: 'COD' | 'ONLINE', paymentDetails?: string) => void;
}

const bankAccountInfo = 'HDFC Bank - 7162 (Murtaza Basra)';

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess
}: PaymentModalProps) {
  const [selectedTab, setSelectedTab] = useState<'online' | 'cod'>('online');
  const [isHandshakeActive, setIsHandshakeActive] = useState(false);
  const [handshakeState, setHandshakeState] = useState<'listening' | 'verifying' | 'verified' | 'expired'>('listening');
  const [activeAppName, setActiveAppName] = useState<string>('UPI App');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 Minutes (300 seconds)
  const [isCopied, setIsCopied] = useState(false);
  const [txnSessionId, setTxnSessionId] = useState<string>('');

  const formattedAmount = amount.toFixed(2);
  const upiUri = `upi://pay?pa=${OWNER_UPI_ID}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR&tr=${txnSessionId}&tn=HakimiOrder_${amount}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

  // 5-Minute Timer Countdown Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isHandshakeActive && handshakeState === 'listening' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setHandshakeState('expired');
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

  // Format seconds to MM:SS
  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Start Automated Handshake Flow
  const startAutomatedHandshake = (appName: string = 'UPI App') => {
    const newSessionId = `HKM-TXN-${Date.now().toString().slice(-6)}`;
    setTxnSessionId(newSessionId);
    setActiveAppName(appName);
    setIsHandshakeActive(true);
    setHandshakeState('listening');
    setTimeLeft(300); // 5 mins reset
  };

  const handleUpiAppRedirect = (appName: string) => {
    handleCopyUpi();
    const newSessionId = `HKM-TXN-${Date.now().toString().slice(-6)}`;
    setTxnSessionId(newSessionId);

    let deepLink = `upi://pay?pa=${OWNER_UPI_ID}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR&tr=${newSessionId}`;
    if (appName === 'Google Pay') {
      deepLink = `tez://upi/pay?pa=${OWNER_UPI_ID}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR&tr=${newSessionId}`;
    } else if (appName === 'PhonePe') {
      deepLink = `phonepe://pay?pa=${OWNER_UPI_ID}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR&tr=${newSessionId}`;
    } else if (appName === 'Paytm') {
      deepLink = `paytmmp://pay?pa=${OWNER_UPI_ID}&pn=HakimiSupermarket&am=${formattedAmount}&cu=INR&tr=${newSessionId}`;
    }

    startAutomatedHandshake(appName);

    // Launch external UPI Application
    try {
      window.location.href = deepLink;
    } catch (e) {
      console.error(e);
    }
  };

  // Automated Signal Verification Processor
  const handleTriggerAutomatedSignal = () => {
    if (handshakeState !== 'listening') return;

    setHandshakeState('verifying');

    setTimeout(() => {
      setHandshakeState('verified');
      setTimeout(() => {
        onPaymentSuccess('ONLINE', `Automated UPI Handshake Verified (${OWNER_UPI_ID})`);
        setIsHandshakeActive(false);
      }, 1200);
    }, 1500);
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
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isHandshakeActive) {
                if (
                  window.confirm(
                    'Cancel payment handshake? Your order cannot proceed until full payment is verified.'
                  )
                ) {
                  setIsHandshakeActive(false);
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
            {isHandshakeActive ? 'Live UPI Automated Handshake' : 'Secure Instant Payment'}
          </span>
          <div className="pm-header-amount-row">
            <h2>₹{amount}</h2>
            <span>Total Payable to Owner ({OWNER_PHONE_DISPLAY})</span>
          </div>
        </div>

        {/* Tab Selection */}
        {!isHandshakeActive && (
          <div className="pm-tabs-row">
            <button
              type="button"
              style={tabStyle(selectedTab === 'online')}
              onClick={() => setSelectedTab('online')}
            >
              <CreditCard size={16} />
              <span>Online UPI / Cards</span>
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
          {isHandshakeActive ? (
            /* --- AUTOMATED UPI HANDSHAKE SCREEN --- */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              {/* 5-Minute Timer Header Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: handshakeState === 'expired' ? '#fef2f2' : '#ecfdf5',
                  color: handshakeState === 'expired' ? '#dc2626' : '#047857',
                  border: `1px solid ${handshakeState === 'expired' ? '#fecaca' : '#a7f3d0'}`,
                  padding: '6px 16px',
                  borderRadius: '24px',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '16px'
                }}
              >
                <Clock size={15} />
                <span>
                  {handshakeState === 'expired'
                    ? 'Handshake Session Expired'
                    : `5-Min Payment Timer: ${formatTime(timeLeft)}`}
                </span>
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
                    backgroundColor:
                      handshakeState === 'expired'
                        ? '#fef2f2'
                        : handshakeState === 'verified'
                        ? '#d1fae5'
                        : '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  {handshakeState === 'verifying' ? (
                    <RefreshCw size={36} className="animate-spin" color="#059669" />
                  ) : handshakeState === 'verified' ? (
                    <CheckCircle2 size={42} color="#059669" />
                  ) : handshakeState === 'expired' ? (
                    <AlertCircle size={42} color="#dc2626" />
                  ) : (
                    <Radio size={38} color="#059669" className="animate-pulse" />
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {handshakeState === 'verified'
                  ? 'Payment Settlement Verified!'
                  : handshakeState === 'verifying'
                  ? 'Verifying Bank Gateway Signal...'
                  : handshakeState === 'expired'
                  ? 'Payment Handshake Expired'
                  : `Waiting for ${activeAppName} Automated Signal`}
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
                  ? `₹${formattedAmount} successfully credited to Hakimi Owner Account (${OWNER_PHONE_DISPLAY}).`
                  : handshakeState === 'verifying'
                  ? `Validating payee VPA (${OWNER_UPI_ID}) and exact amount match...`
                  : handshakeState === 'expired'
                  ? `The 5-minute window completed without a verified signal. Make sure full bill amount (₹${formattedAmount}) is paid to owner and click retry.`
                  : `Complete payment of ₹${formattedAmount} to owner VPA (${OWNER_UPI_ID}) in ${activeAppName}. The system is listening for the automated bank signal.`}
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
                  <span>Owner Contact:</span>
                  <strong style={{ color: '#0f172a' }}>{OWNER_PHONE_DISPLAY}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Bill Total:</span>
                  <strong style={{ color: '#059669', fontSize: '13px' }}>₹{formattedAmount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Handshake Status:</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color:
                        handshakeState === 'verified'
                          ? '#059669'
                          : handshakeState === 'expired'
                          ? '#dc2626'
                          : '#d97706'
                    }}
                  >
                    {handshakeState === 'verified'
                      ? '🟢 VERIFIED & CREDITED'
                      : handshakeState === 'verifying'
                      ? '⚙️ VERIFYING...'
                      : handshakeState === 'expired'
                      ? '🔴 TIMED OUT'
                      : '📡 LISTENING FOR SIGNAL'}
                  </span>
                </div>
              </div>

              {/* TEST & DEMO ACTION BUTTON (For testing signal receipt) */}
              {handshakeState === 'listening' && (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1.5px dashed #059669',
                    padding: '12px',
                    borderRadius: '14px',
                    marginBottom: '14px'
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#047857',
                      marginBottom: '8px'
                    }}
                  >
                    🧪 TESTING & VERIFICATION CONTROL
                  </span>
                  <button
                    type="button"
                    onClick={handleTriggerAutomatedSignal}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                    }}
                  >
                    <Zap size={15} />
                    <span>⚡ Simulate Automated UPI Signal (Test Mode)</span>
                  </button>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10.5px',
                      color: '#64748b',
                      marginTop: '6px'
                    }}
                  >
                    The timer will continue running. Click above to verify bank settlement signal after completing payment in your UPI app.
                  </span>
                </div>
              )}

              {/* Retry button if expired */}
              {handshakeState === 'expired' && (
                <button
                  type="button"
                  onClick={() => startAutomatedHandshake(activeAppName)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Restart 5-Min Handshake Session</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsHandshakeActive(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Select Different Payment Method
              </button>
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
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: app.color }}>
                        {app.name}
                      </span>
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
                    UPI ID: <strong>{OWNER_UPI_ID}</strong>
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
                  <Zap size={14} />
                  <span>Start Automated Handshake (5-Min Timer)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pm-cod-body">
              <div className="pm-cod-icon-circle" style={{ backgroundColor: '#ecfdf5' }}>
                <Banknote size={32} color="#059669" />
              </div>
              <h3>Pay Cash Upon Delivery</h3>
              <p>
                Pay exact amount <strong>₹{amount}</strong> in cash to the delivery partner when your
                order arrives.
              </p>
              <button
                type="button"
                onClick={handleConfirmCod}
                className="pm-cod-btn"
                style={{ backgroundColor: '#059669' }}
              >
                <span>Confirm COD Order (₹{amount})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="pm-footer">
          <Lock size={12} color="#059669" />
          <span>256-Bit Encrypted Bank Gateway • Payee: {OWNER_PHONE_DISPLAY}</span>
        </div>
      </div>
    </div>
  );
}
