import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Address } from '../context/AppContext';
import { X, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

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

  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
        // Auto fill address details
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
      alert(`An address with type "${currentAddressType}" is already added.`);
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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
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

    // Validate name and address for customers
    if (phoneNumber !== '+919657152532' && phoneNumber !== '9657152532') {
      if (!name.trim()) {
        setErrorMsg('Please enter your name.');
        return;
      }
      if (finalAddresses.length === 0) {
        setErrorMsg('Please add at least one delivery address.');
        return;
      }
    }

    setErrorMsg('');
    // Generate a random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    
    // Normalise phone number to WhatsApp clean digits (no +, spaces, etc.)
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default India prefix
    }
    
    // Open wa.me link to send themselves the OTP
    const messageText = `🔑 *HAKIMI SUPER MARKET OTP*\n\nYour verification code is: *${code}*\n\nPlease enter this OTP back in the webapp to complete your registration.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    
    window.open(waUrl, '_blank');
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== '123456') { // Allow 123456 as bypass
      setErrorMsg('Invalid OTP code. Try again (or use bypass 123456).');
      return;
    }

    setErrorMsg('');
    
    // Normalise phone number to +91 formatting
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+91' + formattedPhone;
      }
    }

    // Owner Login check
    if (formattedPhone === '+919657152532') {
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
      login(formattedPhone, name || 'Customer', finalAddresses);
    }

    // Reset Form
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

  const isOwner = phoneNumber === '+919657152532' || phoneNumber === '9657152532';

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

      {/* Drawer Panel */}
      <div className={`drawer-content ${isLoginOpen ? 'active' : ''}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">
            {isOwner ? 'Store Owner Verification' : 'Welcome to Hakimi'}
          </h3>
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
          <form className="auth-form-container" onSubmit={handleSendOtp}>
            <p className="auth-subtitle">
              {isOwner 
                ? 'Sign in as the shop operator to manage stock, pricing, and process orders.' 
                : 'Log in or sign up in seconds to save your cart, apply coupons, and track deliveries.'
              }
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div style={{
                backgroundColor: 'var(--error-bg)',
                border: '1px solid var(--error)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                color: 'var(--error)',
                fontWeight: 500
              }}>
                {errorMsg}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Mobile Number</label>
              <input 
                type="tel"
                className="form-input"
                placeholder="e.g. 9657152532"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            {!isOwner && (
              <>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                {/* Multi Address onboarding section */}
                <div className="input-group" style={{ border: '1px solid var(--border-color)', padding: 10, borderRadius: 'var(--border-radius-sm)', marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="input-label" style={{ fontSize: '9px', color: 'var(--text-primary)', fontWeight: 700 }}>Add Delivery Address</span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      📍 {isLocating ? 'Locating...' : currentGpsCoords ? 'Location Pinned! ✓' : 'GPS Pin (Optional)'}
                    </button>
                  </div>

                  {/* Address Type Buttons */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {['Home', 'Work', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCurrentAddressType(type)}
                        style={{
                          flex: 1,
                          padding: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: currentAddressType === type ? 'var(--primary)' : 'var(--bg-input)',
                          color: currentAddressType === type ? 'white' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. House No. 22, block B..."
                      value={currentAddressDetails}
                      onChange={(e) => setCurrentAddressDetails(e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '0 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Render list of added addresses */}
                  {addressesList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                      {addressesList.map((addr, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            backgroundColor: 'var(--bg-main)', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '10px' 
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
                              color: 'var(--error)', 
                              fontSize: '9px', 
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
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid var(--border-color)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}>
                <ShieldAlert size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>Entering owner number will open the shop merchant dashboard on OTP authentication.</span>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              <Send size={16} />
              <span>Send OTP Verification</span>
            </button>
          </form>
        ) : (
          <form className="auth-form-container" onSubmit={handleVerifyOtp}>
            <p className="auth-subtitle">
              We have sent a verification code to your mobile number. Enter it below to complete.
            </p>

            {/* Mock OTP display box for developer/user convenience */}
            <div style={{
              backgroundColor: 'var(--success-bg)',
              border: '1px dashed var(--success)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  [Mock SMS Service]
                </span>
              </div>
              <span style={{ fontSize: '14px', fontFamily: 'var(--mono)', color: 'var(--success)', fontWeight: 700 }}>
                Code: {generatedOtp}
              </span>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{
                backgroundColor: 'var(--error-bg)',
                border: '1px solid var(--error)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                color: 'var(--error)',
                fontWeight: 500
              }}>
                {errorMsg}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Enter 6-Digit OTP</label>
              <input 
                type="number"
                className="form-input"
                placeholder="Enter verification code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                required
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                onClick={() => setStep('info')}
              >
                Back
              </button>
              
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                Confirm & Log In
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};
