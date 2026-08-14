import { Wrench, PhoneCall, ShieldAlert, Clock } from 'lucide-react';
import { OWNER_PHONE_DISPLAY } from '../lib/constants';

export function MaintenancePage() {
  return (
    <div className="maint-page">
      <div className="maint-card">
        <div className="maint-icon">
          <Wrench size={36} color="#ffffff" />
        </div>
        <div className="maint-badge">
          <ShieldAlert size={14} />
          <span>System Maintenance Active</span>
        </div>
        <h1 className="maint-title">Hakimi Supermarket</h1>
        <p className="maint-desc">
          We are currently updating our systems and inventory to serve you better. Our store app will be back online
          shortly. Thank you for your patience!
        </p>
        <div className="maint-eta">
          <Clock size={18} color="#3b82f6" />
          <span>Estimated completion: ~15-30 mins</span>
        </div>
        <a href={`tel:${OWNER_PHONE_DISPLAY.replace(/\s+/g, '')}`} className="maint-call-btn">
          <PhoneCall size={16} />
          <span>Call Store: {OWNER_PHONE_DISPLAY}</span>
        </a>
      </div>
    </div>
  );
}
