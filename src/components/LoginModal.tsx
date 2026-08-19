import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { isOwnerPhone, OWNER_PHONE_DISPLAY, OWNER_NAME, OWNER_PASSWORD } from '../lib/constants';
import { findRegisteredUser } from '../lib/storage';
import type { Address } from '../types';
import {
  X,
  Phone,
  Lock,
  User as UserIcon,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  ArrowRight,
  Home,
  Briefcase,
  Building2
} from 'lucide-react';

export function LoginModal() {
  const { isLoginOpen, setLoginOpen, login } = useApp();

  // Mode: 'signin' | 'register'
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Input states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auto-detection state flags
  const [isKnownUser, setIsKnownUser] = useState(false);
  const [detectedName, setDetectedName] = useState('');

  // Address states for location setup
  const [addressesList, setAddressesList] = useState<Address[]>([]);
  const [currentAddressType, setCurrentAddressType] = useState<string>('Home');
  const [currentAddressDetails, setCurrentAddressDetails] = useState('');
  const [currentGpsCoords, setCurrentGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isOwner = isOwnerPhone(phoneNumber);

  // Real-time phone auto-detection logic
  useEffect(() => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      if (isOwnerPhone(cleanPhone)) {
        setIsKnownUser(true);
        setDetectedName(OWNER_NAME);
        setMode('signin');
        setErrorMsg('');
        return;
      }

      const existingAccount = findRegisteredUser(cleanPhone);
      if (existingAccount) {
        setIsKnownUser(true);
        setDetectedName(existingAccount.name);
        setName(existingAccount.name);
        if (existingAccount.addresses && existingAccount.addresses.length > 0) {
          setAddressesList(existingAccount.addresses);
        }
        // Keep password empty so user must enter it manually
        setPassword('');
        // Smoothly auto-switch to Sign In mode if existing user
        setMode('signin');
        setErrorMsg('');
        setSuccessMsg(`Welcome back, ${existingAccount.name}! Please enter your password to sign in.`);
      } else {
        setIsKnownUser(false);
        setDetectedName('');
        setMode('register');
        setSuccessMsg('');
      }
    } else {
      setIsKnownUser(false);
      setDetectedName('');
      setSuccessMsg('');
    }
  }, [phoneNumber]);

  // Lock background body scroll when login modal is active
  useEffect(() => {
    if (isLoginOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoginOpen]);

  if (!isLoginOpen) return null;

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
        const coordsText = `📍 GPS Pin: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (!currentAddressDetails.trim()) {
          setCurrentAddressDetails(coordsText);
        } else if (!currentAddressDetails.includes('GPS Pin:')) {
          setCurrentAddressDetails((prev) => `${prev} (${coordsText})`);
        }
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert('Unable to pinpoint GPS. Please enter your address details manually.');
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const handleAddAddress = () => {
    if (!currentAddressDetails.trim()) {
      alert('Please type your street/house address details first.');
      return;
    }
    const exists = addressesList.some((a) => a.type === currentAddressType);
    if (exists) {
      alert(`An address labeled "${currentAddressType}" is already added.`);
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password || password.trim().length < 4) {
      setErrorMsg('Please enter a valid password (at least 4 characters).');
      return;
    }

    const formattedPhone = '+' + (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone);

    // Merchant Owner Check
    if (isOwner) {
      if (password.trim() === OWNER_PASSWORD) {
        login(formattedPhone, OWNER_NAME, [], password.trim());
        resetForm();
        return;
      } else {
        setErrorMsg('Invalid Merchant Password.');
        return;
      }
    }

    // Customer Login / Registration
    const existingAccount = findRegisteredUser(cleanPhone);
    const finalAddresses = getCollectedAddresses();

    if (!existingAccount && mode === 'signin') {
      setMode('register');
      setErrorMsg('No account found with this phone number. Please enter your name and delivery address to register.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name to register.');
        return;
      }
      if (!password || password.trim().length < 4) {
        setErrorMsg('Please create a password (at least 4 characters).');
        return;
      }
      if (finalAddresses.length === 0) {
        setErrorMsg('Please enter a delivery address or click "Pin Live GPS".');
        return;
      }
      login(formattedPhone, name.trim(), finalAddresses, password.trim());
      resetForm();
    } else {
      // Sign In mode for existing account
      if (existingAccount && existingAccount.password && existingAccount.password !== password.trim()) {
        setErrorMsg('Incorrect password. Please try again.');
        return;
      }

      const displayName = existingAccount?.name || name.trim();
      const userAddresses = existingAccount && existingAccount.addresses.length > 0 ? existingAccount.addresses : finalAddresses;

      if (!displayName || userAddresses.length === 0) {
        setMode('register');
        setErrorMsg('Please complete your name and delivery address to sign in.');
        return;
      }

      login(formattedPhone, displayName, userAddresses, password.trim());
      resetForm();
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setName('');
    setPassword('');
    setShowPassword(false);
    setAddressesList([]);
    setCurrentAddressDetails('');
    setCurrentAddressType('Home');
    setCurrentGpsCoords(null);
    setErrorMsg('');
    setSuccessMsg('');
    setIsKnownUser(false);
    setDetectedName('');
    setMode('signin');
  };

  const closeAndReset = () => {
    setLoginOpen(false);
    resetForm();
  };

  return (
    <>
      <div className={`drawer-backdrop ${isLoginOpen ? 'active' : ''}`} onClick={closeAndReset} />

      <div className={`login-modal-wrapper ${isLoginOpen ? 'active' : ''}`}>
        <div className="login-modal-card">
          {/* Close button */}
          <button className="login-modal-close-btn" onClick={closeAndReset} aria-label="Close Login">
            <X size={18} />
          </button>

          {/* Left Hero Panel (Split Visual) */}
          <div className="login-hero-panel">
            <div className="login-hero-overlay" />
            <div className="login-hero-content">
              <div className="login-brand-header">
                <img src="./logo.png" alt="Hakimi Supermarket" className="login-hero-logo" />
                <div>
                  <span className="login-hero-brand-name">HAKIMI</span>
                  <span className="login-hero-brand-tag">SUPERMARKET</span>
                </div>
              </div>

              <div className="login-hero-center">
                <div className="login-hero-badge">
                  <Sparkles size={14} className="hero-sparkle-icon" />
                  <span>Instant 15-Min Delivery</span>
                </div>
                <h2 className="login-hero-title">
                  {mode === 'register'
                    ? 'Join Us Today!'
                    : isOwner
                    ? 'Merchant Control'
                    : detectedName
                    ? `WELCOME, ${detectedName.toUpperCase()}!`
                    : 'WELCOME BACK!'}
                </h2>
                <p className="login-hero-desc">
                  {mode === 'register'
                    ? 'Create your account to save favorite items, pin delivery locations, and get superfast order tracking.'
                    : isOwner
                    ? `Logging in as shop operator (${OWNER_PHONE_DISPLAY}) to manage orders and stock.`
                    : detectedName
                    ? `Welcome back, ${detectedName}! Enter your password to access your cart and saved addresses.`
                    : 'We are delighted to have you here! Enter your phone and password to continue.'}
                </p>
              </div>

              <div className="login-hero-footer">
                <div className="login-trust-pill">
                  <ShieldCheck size={14} />
                  <span>100% Safe & Secure Login</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="login-form-panel">
            {/* Mode Switcher Tabs */}
            <div className="login-tabs-bar">
              <button
                type="button"
                className={`login-tab-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`login-tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
              >
                Register
              </button>
              <div className={`login-tab-indicator ${mode}`} />
            </div>

            <form onSubmit={handleSubmit} className="login-form-body">
              {/* Error Alert */}
              {errorMsg && <div className="login-alert-box error">{errorMsg}</div>}

              {/* Success / Detection Banner */}
              {successMsg && <div className="login-alert-box success">{successMsg}</div>}

              {isOwner && (
                <div className="login-alert-box owner-alert">
                  <ShieldCheck size={16} />
                  <span>Merchant account detected. Submitting opens the Owner Portal.</span>
                </div>
              )}

              {/* Mobile Number Field */}
              <div className="login-input-group">
                <label className="login-label">Mobile Number</label>
                <div className="login-input-field-wrap">
                  <Phone size={16} className="login-field-icon" />
                  <input
                    type="tel"
                    className="login-input"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    maxLength={14}
                    required
                  />
                  {isKnownUser && <CheckCircle2 size={16} className="login-verified-icon" />}
                </div>
              </div>

              {/* Full Name (Only in Register mode) */}
              {mode === 'register' && (
                <div className="login-input-group">
                  <label className="login-label">Full Name</label>
                  <div className="login-input-field-wrap">
                    <UserIcon size={16} className="login-field-icon" />
                    <input
                      type="text"
                      className="login-input"
                      placeholder="e.g. Mustafizur Rahman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === 'register'}
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="login-input-group">
                <label className="login-label">Password</label>
                <div className="login-input-field-wrap">
                  <Lock size={16} className="login-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter your secret password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    className="login-pass-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Delivery Location & Address Setup (ONLY in Register mode) */}
              {!isOwner && mode === 'register' && (
                <div className="login-location-section">
                  <div className="login-location-head">
                    <span className="login-location-title">Delivery Location & Address</span>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="login-gps-pin-btn"
                    >
                      <MapPin size={13} />
                      <span>{isLocating ? 'Locating GPS...' : currentGpsCoords ? 'GPS Pinned ✓' : 'Pin Live GPS'}</span>
                    </button>
                  </div>

                  {/* Address Type Tag Selectors */}
                  <div className="login-address-type-pills">
                    {[
                      { label: 'Home', icon: Home },
                      { label: 'Work', icon: Briefcase },
                      { label: 'Other', icon: Building2 }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSel = currentAddressType === item.label;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setCurrentAddressType(item.label)}
                          className={`login-type-pill ${isSel ? 'active' : ''}`}
                        >
                          <Icon size={12} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Input details + Add address button */}
                  <div className="login-address-input-row">
                    <input
                      type="text"
                      className="login-input sub-input"
                      placeholder="e.g. House 42, Green Street, Block B..."
                      value={currentAddressDetails}
                      onChange={(e) => setCurrentAddressDetails(e.target.value)}
                    />
                    <button type="button" onClick={handleAddAddress} className="login-add-addr-btn">
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Saved Address List */}
                  {addressesList.length > 0 && (
                    <div className="login-saved-addresses-list">
                      {addressesList.map((addr, idx) => (
                        <div key={idx} className="login-address-item-chip">
                          <div className="login-addr-info">
                            <span className="login-addr-tag">{addr.type}</span>
                            <span className="login-addr-text">
                              {addr.details} {addr.gps ? '📍' : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddress(idx)}
                            className="login-addr-del-btn"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Action Button */}
              <button type="submit" className="login-submit-pill-btn">
                <span>
                  {mode === 'register'
                    ? 'Create Account & Sign In'
                    : isOwner
                    ? 'Access Merchant Portal'
                    : 'Sign In'}
                </span>
                <ArrowRight size={16} />
              </button>

              {/* Footer Switch Prompt */}
              <div className="login-footer-switch">
                {mode === 'register' ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="login-switch-link"
                      onClick={() => setMode('signin')}
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="login-switch-link"
                      onClick={() => setMode('register')}
                    >
                      Register Now
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
