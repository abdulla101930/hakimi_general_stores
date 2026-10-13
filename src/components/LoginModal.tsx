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
  Building2,
  Navigation
} from 'lucide-react';
import { MapPickerModal } from './MapPickerModal';

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
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

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
      alert('Geolocation is not supported by your browser. Please click "Pin on Map" to select your location.');
      setIsMapPickerOpen(true);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentGpsCoords({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert('Unable to auto-detect GPS. Opening the map so you can pin your exact delivery location.');
        setIsMapPickerOpen(true);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  const handleMapPickerSelect = (addr: Address) => {
    if (addr.gps) {
      setCurrentGpsCoords(addr.gps);
    }
    if (addr.type) {
      setCurrentAddressType(addr.type);
    }
    if (addr.details) {
      const cleanDetails = addr.details.replace(/\s*\(GPS:[^)]*\)/, '').trim();
      if (cleanDetails && !cleanDetails.startsWith('Pinned Location near GPS') && !currentAddressDetails.trim()) {
        setCurrentAddressDetails(cleanDetails);
      }
    }
    setIsMapPickerOpen(false);
  };

  const handleAddAddress = () => {
    if (!currentAddressDetails.trim()) {
      alert('Manual address is mandatory! Please type your house/flat, building, or street details.');
      return;
    }
    if (!currentGpsCoords) {
      alert('Google Map location pin is mandatory! Please click "Auto-Detect GPS" or "Pin on Map".');
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
      gps: currentGpsCoords
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
    if (currentAddressDetails.trim() && currentGpsCoords) {
      finalAddresses.push({
        type: currentAddressType,
        details: currentAddressDetails.trim(),
        gps: currentGpsCoords
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

    if (!existingAccount && mode === 'signin') {
      setMode('register');
      setErrorMsg('No account found with this phone number. Please enter your name, address, and pin your location to register.');
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

      if (addressesList.length === 0) {
        if (!currentAddressDetails.trim() && !currentGpsCoords) {
          setErrorMsg('Manual address entry AND Google location pinning are both mandatory.');
          return;
        }
        if (!currentGpsCoords) {
          setErrorMsg('Location pinning is mandatory! Click "Auto-Detect GPS" or "Pin on Map".');
          return;
        }
        if (!currentAddressDetails.trim()) {
          setErrorMsg('Please type your flat/house number and street name manually.');
          return;
        }
      }

      const finalAddresses = getCollectedAddresses();
      if (finalAddresses.length === 0) {
        setErrorMsg('Please enter manual address details and pin your Google GPS location.');
        return;
      }

      // Strict check: every registered address MUST have a GPS pin
      const missingGps = finalAddresses.find((a) => !a.gps || typeof a.gps.lat !== 'number' || typeof a.gps.lng !== 'number');
      if (missingGps) {
        setErrorMsg(`Google location pin is mandatory! Please pin location for "${missingGps.type}".`);
        return;
      }

      // Strict check: every registered address MUST have manual text details
      const missingManual = finalAddresses.find((a) => !a.details || a.details.trim().length < 3);
      if (missingManual) {
        setErrorMsg(`Manual address details are mandatory! Please enter house/flat and street for "${missingManual.type}".`);
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
      const finalAddresses = getCollectedAddresses();
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
    setIsMapPickerOpen(false);
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
                    ? `Logging in as shop operator (Login ID: 5253123456). All store bills & notifications are routed to ${OWNER_PHONE_DISPLAY}.`
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
              {/* Error Alert with Custom Micro-Shake & Clay Error Badge */}
              {errorMsg && (
                <div className="login-alert-box error form-error-shake">
                  <span className="form-error-badge">⚠️ ERROR</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success / Detection Banner */}
              {successMsg && <div className="login-alert-box success">{successMsg}</div>}

              {isOwner && (
                <div className="login-alert-box owner-alert">
                  <ShieldCheck size={16} />
                  <span>Merchant Login ID detected (5253123456). Customer bills route to {OWNER_PHONE_DISPLAY}.</span>
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
                    <span className="login-location-title">
                      Delivery Address <span style={{ color: '#dc2626', fontSize: '10.5px', fontWeight: 700 }}>* (Manual + GPS Mandatory)</span>
                    </span>
                  </div>

                  {/* Dual Pinning Actions: Auto-Detect GPS & Interactive Map */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="login-gps-pin-btn"
                      style={{
                        flex: 1,
                        background: currentGpsCoords ? '#ecfdf5' : '#fff1f2',
                        borderColor: currentGpsCoords ? '#a7f3d0' : '#fecdd3',
                        color: currentGpsCoords ? '#047857' : '#be123c',
                        justifyContent: 'center',
                        padding: '6px 8px'
                      }}
                    >
                      <MapPin size={13} />
                      <span>{isLocating ? 'Locating...' : currentGpsCoords ? '✓ GPS Captured' : '📍 Auto-Detect GPS *'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMapPickerOpen(true)}
                      className="login-gps-pin-btn"
                      style={{
                        flex: 1,
                        background: currentGpsCoords ? '#f0fdf4' : '#eff6ff',
                        borderColor: currentGpsCoords ? '#bbf7d0' : '#bfdbfe',
                        color: currentGpsCoords ? '#15803d' : '#1d4ed8',
                        justifyContent: 'center',
                        padding: '6px 8px'
                      }}
                    >
                      <Navigation size={13} />
                      <span>{currentGpsCoords ? 'Change Pin on Map' : '🗺️ Pin on Map *'}</span>
                    </button>
                  </div>

                  {currentGpsCoords ? (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#047857',
                        fontWeight: 600,
                        background: '#f0fdf4',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>📍 GPS Pinned: {currentGpsCoords.lat.toFixed(5)}, {currentGpsCoords.lng.toFixed(5)}</span>
                      <button
                        type="button"
                        onClick={() => setCurrentGpsCoords(null)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
                      >
                        ✕ Clear
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '10.5px',
                        color: '#b91c1c',
                        background: '#fff1f2',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px dashed #fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>⚠️ Google location pin is required. Click Auto-Detect GPS or Pin on Map.</span>
                    </div>
                  )}

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
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>
                      House / Flat / Street Details <span style={{ color: '#dc2626' }}>* (Required)</span>
                    </label>
                    <div className="login-address-input-row">
                      <input
                        type="text"
                        className="login-input sub-input"
                        placeholder="e.g. Flat 302, Green Valley Apts, Station Road..."
                        value={currentAddressDetails}
                        onChange={(e) => setCurrentAddressDetails(e.target.value)}
                      />
                      <button type="button" onClick={handleAddAddress} className="login-add-addr-btn">
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Saved Address List */}
                  {addressesList.length > 0 && (
                    <div className="login-saved-addresses-list">
                      {addressesList.map((addr, idx) => (
                        <div key={idx} className="login-address-item-chip">
                          <div className="login-addr-info">
                            <span className="login-addr-tag">{addr.type}</span>
                            <span className="login-addr-text">
                              {addr.details} {addr.gps ? `📍 (${addr.gps.lat.toFixed(4)}, ${addr.gps.lng.toFixed(4)})` : ''}
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

      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSelectAddress={handleMapPickerSelect}
      />
    </>
  );
}
