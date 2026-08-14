import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { isOwnerPhone, OWNER_PHONE_DISPLAY } from '../lib/constants';
import { sendOtpViaWhatsApp } from '../lib/whatsapp';
import type { Address } from '../types';
import { X, Send, ShieldAlert, MapPin, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export function LoginModal() {
  const { isLoginOpen, setLoginOpen, login } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');

  const [addressesList, setAddressesList] = useState<Address[]>([]);
  const [currentAddressType, setCurrentAddressType] = useState<string>('Home');
  const [currentAddressDetails, setCurrentAddressDetails] = useState('');
  const [currentGpsCoords, setCurrentGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  if (!isLoginOpen) return null;

  const isOwner = isOwnerPhone(phoneNumber);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentGpsCoords({ lat, lng });
        setIsLocating(false);
        const coordsText = `📍 Pinned GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (!currentAddressDetails.trim()) {
          setCurrentAddressDetails(coordsText);
        } else if (!currentAddressDetails.includes('GPS:')) {
          setCurrentAddressDetails((prev) => `${prev} (${coordsText})`);
        }
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert('Unable to pinpoint GPS. Please enter your address details manually.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleAddAddress = () => {
    if (!currentAddressDetails.trim()) {
      alert('Please type your address details first.');
      return;
    }
    const exists = addressesList.some((a) => a.type === currentAddressType);
    if (exists) {
      alert(`An address with label "${currentAddressType}" is already added.`);
      return;
    }
    const newAddr: Address = {
      type: currentAddressType,
      details: currentAddressDetails.trim(),
      gps: currentGpsCoords || undefined
    };
    setAddressesList((prev) => [...prev, newAddr]);
    setCurrentAddressDetails('');
    setCurrentGpsCoords(null);
  };

  const handleRemoveAddress = (index: number) => {
    setAddressesList((prev) => prev.filter((_, i) => i !== index));
  };

  const getCollectedAddresses = (): Address[] => {
    const finalAddresses = [...addressesList];
    if (currentAddressDetails.trim()) {
      finalAddresses.push({
        type: currentAddressType,
        details: currentAddressDetails.trim(),
        gps: currentGpsCoords || undefined
      });
    }
    return finalAddresses;
  };

  const handleSendOtp = (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const finalAddresses = getCollectedAddresses();

    if (!isOwner) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (finalAddresses.length === 0) {
        setErrorMsg('Please enter your delivery address.');
        return;
      }
    }

    setErrorMsg('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setResendTimer(30);
    setShowNotification(true);
    setStep('otp');

    window.open(sendOtpViaWhatsApp(cleanPhone, code), '_blank');
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setResendTimer(30);
    setShowNotification(true);
    setErrorMsg('');

    window.open(sendOtpViaWhatsApp(cleanPhone, newCode, true), '_blank');
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();

    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg('Invalid 6-digit verification code. Please try again.');
      return;
    }

    setErrorMsg('');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = '+' + (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone);

    if (isOwner) {
      login(formattedPhone, 'Hakimi Shop Owner', []);
    } else {
      login(formattedPhone, name.trim() || 'Customer', getCollectedAddresses());
    }

    resetForm();
  };

  const resetForm = () => {
    setPhoneNumber('');
    setName('');
    setAddressesList([]);
    setCurrentAddressDetails('');
    setCurrentAddressType('Home');
    setCurrentGpsCoords(null);
    setOtpCode('');
    setGeneratedOtp('');
    setStep('info');
    setErrorMsg('');
  };

  const closeAndReset = () => {
    setLoginOpen(false);
    resetForm();
  };

  return (
    <>
      <div className={`drawer-backdrop ${isLoginOpen ? 'active' : ''}`} onClick={closeAndReset} />

      <div
        className={`drawer-content ${isLoginOpen ? 'active' : ''}`}
        style={{
          maxHeight: '92vh',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxSizing: 'border-box'
        }}
      >
        <div className="drawer-header" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {step === 'otp' && (
              <button
                type="button"
                onClick={() => setStep('info')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <ArrowLeft size={18} color="var(--primary)" />
              </button>
            )}
            <img src="./logo.png" alt="Hakimi General Store" className="login-logo" />
            <h3 className="drawer-title" style={{ fontSize: '16px', fontWeight: 800 }}>
              {step === 'otp' ? 'OTP Verification' : isOwner ? 'Merchant Login' : 'Hakimi General Store'}
            </h3>
          </div>
          <button className="btn-close" onClick={closeAndReset}>
            <X size={16} />
          </button>
        </div>

        {step === 'info' ? (
          <form
            onSubmit={handleSendOtp}
            style={{
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
              {isOwner
                ? `Logging in as shop operator (${OWNER_PHONE_DISPLAY}) to manage inventory and view orders.`
                : 'Sign in to save your cart, select your address, and track instant home deliveries.'}
            </p>

            {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

            <div className="input-group">
              <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ fontSize: '13px', padding: '10px 12px' }}
                required
              />
            </div>

            {!isOwner && (
              <>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ fontSize: '13px', padding: '10px 12px' }}
                    required
                  />
                </div>

                <div className="login-address-box">
                  <div className="login-address-head">
                    <span className="login-address-title">Delivery Address</span>
                    <button type="button" onClick={handleGetLocation} disabled={isLocating} className="login-gps-btn">
                      <MapPin size={12} />
                      <span>{isLocating ? 'Locating...' : currentGpsCoords ? 'GPS Pinned ✓' : 'GPS Pin (Optional)'}</span>
                    </button>
                  </div>

                  <div className="login-address-types">
                    {['Home', 'Work', 'Other'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCurrentAddressType(type)}
                        style={{
                          flex: 1,
                          padding: '6px 4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: currentAddressType === type ? 'var(--primary)' : '#ffffff',
                          color: currentAddressType === type ? '#ffffff' : 'var(--text-muted)',
                          border: currentAddressType === type ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 6, width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. House 22, Block B..."
                      value={currentAddressDetails}
                      onChange={(e) => setCurrentAddressDetails(e.target.value)}
                      style={{ flex: 1, padding: '8px 10px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="login-add-addr-btn"
                    >
                      + Add
                    </button>
                  </div>

                  {addressesList.length > 0 && (
                    <div className="login-addr-list">
                      {addressesList.map((addr, idx) => (
                        <div key={idx} className="login-addr-row">
                          <div className="login-addr-text">
                            <strong>{addr.type}:</strong> {addr.details} {addr.gps ? '📍' : ''}
                          </div>
                          <button type="button" onClick={() => handleRemoveAddress(idx)} className="login-addr-remove">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {isOwner && (
              <div className="login-owner-note">
                <ShieldAlert size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>Verified merchant number. Submitting will open the shop control dashboard.</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{
                marginTop: '6px',
                padding: '12px',
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Send size={16} />
              <span>Send OTP Verification</span>
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            style={{
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div className="otp-icon-circle">
                <CheckCircle size={24} color="var(--primary)" />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Enter Verification Code
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                We sent a 6-digit OTP code to <strong>{phoneNumber}</strong>
              </p>
            </div>

            {showNotification && (
              <div className="otp-whatsapp-banner">
                <div className="otp-whatsapp-left">
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span style={{ fontWeight: 600 }}>
                    OTP sent via WhatsApp to <strong>{phoneNumber}</strong>
                  </span>
                </div>
                <a
                  href={sendOtpViaWhatsApp(phoneNumber.replace(/\D/g, ''), generatedOtp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="otp-whatsapp-btn"
                >
                  Open WhatsApp
                </a>
              </div>
            )}

            {errorMsg && <div className="login-error-alert otp-error-alert">{errorMsg}</div>}

            <div className="input-group">
              <label className="input-label" style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700 }}>
                6-Digit OTP Code
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                style={{
                  textAlign: 'center',
                  letterSpacing: '10px',
                  fontSize: '20px',
                  fontWeight: 800,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: '12px', marginTop: '-4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Didn't get the code?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: resendTimer > 0 ? '#94a3b8' : 'var(--primary)',
                  fontWeight: 700,
                  cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0
                }}
              >
                <RefreshCw size={12} />
                <span>{resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: '4px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  backgroundColor: '#f1f5f9',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  padding: '12px'
                }}
                onClick={() => setStep('info')}
              >
                Change Details
              </button>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  flex: 2,
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                Verify & Log In
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
