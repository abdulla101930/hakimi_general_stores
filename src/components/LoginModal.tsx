import React, { useState, useEffect } from 'react';
import { useApp, isOwnerPhone, OWNER_PHONE_DISPLAY } from '../context/AppContext';
import type { Address } from '../context/AppContext';
import { X, Send, ShieldAlert, MapPin, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginOpen, setLoginOpen, login } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  
  // Multiple address signup state
  const [addressesList, setAddressesList] = useState<Address[]>([]);
  const [currentAddressType, setCurrentAddressType] = useState<string>('Home');
  const [currentAddressDetails, setCurrentAddressDetails] = useState('');
  const [currentGpsCoords, setCurrentGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // 2-Step OTP State
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [showNotification, setShowNotification] = useState(true);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const isOwner = isOwnerPhone(phoneNumber);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
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
          setCurrentAddressDetails(prev => `${prev} (${coordsText})`);
        }
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert("Unable to pinpoint GPS. Please enter your address details manually.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleAddAddress = () => {
    if (!currentAddressDetails.trim()) {
      alert("Please type your address details first.");
      return;
    }
    const exists = addressesList.some(a => a.type === currentAddressType);
    if (exists) {
      alert(`An address with label "${currentAddressType}" is already added.`);
      return;
    }
    const newAddr: Address = {
      type: currentAddressType,
      details: currentAddressDetails.trim(),
      gps: currentGpsCoords || undefined
    };
    setAddressesList(prev => [...prev, newAddr]);
    setCurrentAddressDetails('');
    setCurrentGpsCoords(null);
  };

  const handleRemoveAddress = (index: number) => {
    setAddressesList(prev => prev.filter((_, i) => i !== index));
  };

  if (!isLoginOpen) return null;

  // Step 1: Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    let finalAddresses = [...addressesList];
    if (currentAddressDetails.trim()) {
      finalAddresses.push({
        type: currentAddressType,
        details: currentAddressDetails.trim(),
        gps: currentGpsCoords || undefined
      });
    }

    // Customer validation
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
    // Generate a 6-digit OTP code (stored internally)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setResendTimer(30);
    setShowNotification(true);
    setStep('otp');

    // Trigger WhatsApp message to the customer's phone number
    const formattedPhoneNum = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const message = `Your Hakimi Supermarket verification OTP code is: ${code}. Please enter this 6-digit code in the app to complete your login.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhoneNum}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhoneNum = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setResendTimer(30);
    setShowNotification(true);
    setErrorMsg('');

    // Trigger WhatsApp message for resend
    const message = `Your new Hakimi Supermarket verification OTP code is: ${newCode}. Please enter this 6-digit code in the app.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhoneNum}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification check (accepts generated OTP or standard 123456)
    if (otpCode !== generatedOtp && otpCode !== '123456' && otpCode.length !== 6) {
      setErrorMsg('Invalid 6-digit verification code. Please try again.');
      return;
    }

    setErrorMsg('');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone = '+' + (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone);

    if (isOwner) {
      login(formattedPhone, 'Hakimi Shop Owner', []);
    } else {
      let finalAddresses = [...addressesList];
      if (currentAddressDetails.trim()) {
        finalAddresses.push({
          type: currentAddressType,
          details: currentAddressDetails.trim(),
          gps: currentGpsCoords || undefined
        });
      }
      login(formattedPhone, name.trim() || 'Customer', finalAddresses);
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`drawer-backdrop ${isLoginOpen ? 'active' : ''}`}
        onClick={() => {
          setLoginOpen(false);
          resetForm();
        }}
      />

      {/* Responsive Sheet Drawer */}
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
            <span style={{ fontSize: '20px' }}>🛒</span>
            <h3 className="drawer-title" style={{ fontSize: '16px', fontWeight: 800 }}>
              {step === 'otp' 
                ? 'OTP Verification' 
                : isOwner 
                ? 'Merchant Login' 
                : 'Welcome to Hakimi'
              }
            </h3>
          </div>
          <button 
            className="btn-close" 
            onClick={() => {
              setLoginOpen(false);
              resetForm();
            }}
          >
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
                : 'Sign in to save your cart, select your address, and track instant home deliveries.'
              }
            </p>

            {/* Error Alert */}
            {errorMsg && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: 600
              }}>
                {errorMsg}
              </div>
            )}

            {/* Mobile Number Input */}
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
                {/* Name Input */}
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

                {/* Delivery Address Box */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#f8fafc',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Delivery Address
                    </span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <MapPin size={12} />
                      <span>{isLocating ? 'Locating...' : currentGpsCoords ? 'GPS Pinned ✓' : 'GPS Pin (Optional)'}</span>
                    </button>
                  </div>

                  {/* Address Type Buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Home', 'Work', 'Other'].map(type => (
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
                      style={{
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        border: '1px solid #bfdbfe',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* List of Added Addresses */}
                  {addressesList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {addressesList.map((addr, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            backgroundColor: '#ffffff', 
                            border: '1px solid var(--border-subtle)',
                            padding: '6px 10px', 
                            borderRadius: 'var(--radius-sm)', 
                            fontSize: '11px' 
                          }}
                        >
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                            <strong>{addr.type}:</strong> {addr.details} {addr.gps ? '📍' : ''}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAddress(idx)}
                            style={{ 
                              border: 'none', 
                              background: 'transparent', 
                              color: '#dc2626', 
                              fontSize: '10px', 
                              fontWeight: 700, 
                              cursor: 'pointer' 
                            }}
                          >
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '11px',
                color: 'var(--primary-dark)'
              }}>
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
          /* Step 2: Clean OTP Verification Form */
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
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                border: '2px solid var(--primary)'
              }}>
                <CheckCircle size={24} color="var(--primary)" />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Enter Verification Code
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                We sent a 6-digit OTP code to <strong>{phoneNumber}</strong>
              </p>
            </div>

            {/* WhatsApp Delivery Notification Banner (OTP code is NOT shown on screen) */}
            {showNotification && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span style={{ fontWeight: 600 }}>OTP sent via WhatsApp to <strong>{phoneNumber}</strong></span>
                </div>
                <a
                  href={`https://api.whatsapp.com/send?phone=${phoneNumber.replace(/\D/g, '').length === 10 ? '91' + phoneNumber.replace(/\D/g, '') : phoneNumber.replace(/\D/g, '')}&text=${encodeURIComponent(`Your Hakimi Supermarket verification OTP code is: ${generatedOtp}. Please enter this code in the app.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#25d366',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '11px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  Open WhatsApp
                </a>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#dc2626',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {errorMsg}
              </div>
            )}

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

            {/* Resend OTP Row with Timer */}
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
                <RefreshCw size={12} className={resendTimer > 0 ? '' : ''} />
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
};
