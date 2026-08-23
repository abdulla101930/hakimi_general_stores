import React from 'react';
import { X, ShieldCheck, FileText, Lock, RefreshCw, Truck, Phone } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="privacy-modal-header">
          <div className="privacy-header-title-box">
            <ShieldCheck size={22} className="privacy-shield-icon" />
            <div>
              <h2>Privacy Policy & Terms</h2>
              <span>Hakimi General Store • Ratlam, MP</span>
            </div>
          </div>
          <button type="button" className="privacy-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="privacy-modal-body">
          <div className="privacy-notice-badge">
            <Lock size={14} />
            <span>Your data is encrypted & stored locally on this phone.</span>
          </div>

          <section className="privacy-section">
            <h3><FileText size={16} /> 1. Overview & Service Scope</h3>
            <p>
              Hakimi General Store ("HGS", "We", "Us") operates instant grocery and hygiene delivery services within
              Ratlam, Madhya Pradesh. By placing an order or using this application, you agree to these Terms & Privacy Policy.
            </p>
          </section>

          <section className="privacy-section">
            <h3><Lock size={16} /> 2. Personal Data & Multi-Profile Switching</h3>
            <p>
              We collect your phone number and delivery address solely for order processing, WhatsApp notifications, and delivery coordination.
              Saved phone profiles remain stored securely on your phone (`localStorage`) to enable instant multi-account switching.
            </p>
          </section>

          <section className="privacy-section">
            <h3><Truck size={16} /> 3. 10-Minute Delivery & Operational Hours</h3>
            <p>
              Orders are fulfilled directly from our Ratlam dark store. 10-minute delivery is provided within designated operational zones.
              Delivery times may vary slightly during monsoon or peak festival traffic.
            </p>
          </section>

          <section className="privacy-section">
            <h3><RefreshCw size={16} /> 4. Cancellation & Refund Policy</h3>
            <p>
              Fresh fruits, vegetables, and unsealed dairy items can be inspected upon delivery. In the rare event of damaged items,
              contact our store team immediately for instant replacement or UPI credit.
            </p>
          </section>

          <section className="privacy-section">
            <h3><Phone size={16} /> 5. Customer Care & Support</h3>
            <p>
              Store Hotline: <strong>+91 99939 49604</strong><br />
              Location: Hakimi General Store, Main Market, Ratlam, MP.
            </p>
          </section>

          <div className="privacy-footer-note">
            Last updated: August 2026 • Hakimi General Store Ratlam
          </div>
        </div>

        {/* Close Action */}
        <div className="privacy-modal-footer">
          <button type="button" className="btn-privacy-agree" onClick={onClose}>
            I UNDERSTAND & AGREE
          </button>
        </div>
      </div>
    </div>
  );
};
