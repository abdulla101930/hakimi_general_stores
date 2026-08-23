import React from 'react';

interface GlassClayLoadingProps {
  message?: string;
}

export const GlassClayLoading: React.FC<GlassClayLoadingProps> = ({
  message = 'Synchronizing your pantry…'
}) => {
  return (
    <div className="glass-clay-loading-wrapper">
      <div className="glass-clay-loading-card">
        {/* Animated outer ring spinner with HGS inner logo */}
        <div className="glass-clay-spinner-box">
          <div className="glass-clay-ring-spin"></div>
          <div className="glass-clay-logo-inner">HGS</div>
          <div className="glass-clay-pulse-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
          </div>
        </div>

        <div className="glass-clay-brand-text">
          <h2 className="glass-clay-title">HAKIMI GENERAL STORE</h2>
          <span className="glass-clay-subtitle">RATLAM, INDIA</span>
        </div>

        <p className="glass-clay-status-msg">{message}</p>

        <div className="glass-clay-secure-badge">
          <span>🔒</span>
          <span>SECURE SYNC</span>
        </div>
      </div>
    </div>
  );
};
