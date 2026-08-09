import React from 'react';
import { Wrench, PhoneCall, ShieldAlert, Clock } from 'lucide-react';
import { OWNER_PHONE_DISPLAY } from '../context/AppContext';

export const MaintenancePage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '36px 24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Animated Store Maintenance Badge */}
        <div style={{
          width: '72px',
          height: '72px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 24px rgba(59, 130, 246, 0.5)'
        }}>
          <Wrench size={36} color="#ffffff" />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#f87171',
          marginBottom: '16px'
        }}>
          <ShieldAlert size={14} />
          <span>System Maintenance Active</span>
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 800,
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Hakimi Supermarket
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          We are currently updating our systems and inventory to serve you better. Our store app will be back online shortly. Thank you for your patience!
        </p>

        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Clock size={18} color="#3b82f6" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            Estimated completion: ~15-30 mins
          </span>
        </div>

        <a
          href={`tel:${OWNER_PHONE_DISPLAY.replace(/\s+/g, '')}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <PhoneCall size={16} />
          <span>Call Store: {OWNER_PHONE_DISPLAY}</span>
        </a>
      </div>
    </div>
  );
};
