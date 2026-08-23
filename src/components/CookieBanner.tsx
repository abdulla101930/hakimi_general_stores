import React, { useState, useEffect } from 'react';
import { Cookie, Check, Shield } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'hgs_cookie_consent_v1';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Show after brief delay
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleConsent = (type: 'all' | 'essential') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ type, date: new Date().toISOString() }));
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner-wrapper">
      <div className="cookie-banner-card">
        <div className="cookie-banner-header">
          <div className="cookie-icon-box">
            <Cookie size={20} className="cookie-icon" />
          </div>
          <div className="cookie-banner-text">
            <h3>Cookie & Storage Privacy</h3>
            <p>
              Hakimi General Store uses local device storage to preserve your cart, delivery address, and saved profiles for lightning-fast 10-minute grocery checkout.
            </p>
          </div>
        </div>

        <div className="cookie-banner-actions">
          <button
            type="button"
            className="btn-cookie-essential"
            onClick={() => handleConsent('essential')}
          >
            <Shield size={14} />
            <span>Essential Only</span>
          </button>
          
          <button
            type="button"
            className="btn-cookie-accept"
            onClick={() => handleConsent('all')}
          >
            <Check size={14} />
            <span>Accept All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
