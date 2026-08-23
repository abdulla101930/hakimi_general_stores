import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { findRegisteredUser } from '../lib/storage';
import { isOwnerPhone, OWNER_NAME } from '../lib/constants';
import { User, Smartphone, ShieldCheck, LogOut, PlusCircle, Check, Store } from 'lucide-react';

interface SavedProfile {
  phone: string;
  name: string;
  role: 'owner' | 'customer';
  lastActive: number;
}

interface ProfileMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy: () => void;
}

const STORAGE_PROFILES_KEY = 'hgs_device_profiles';

export const ProfileMenuPopover: React.FC<ProfileMenuPopoverProps> = ({
  isOpen,
  onClose,
  onOpenPrivacyPolicy
}) => {
  const { user, role, logout, setLoginOpen, setView, currentView, login } = useApp();
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

  // Sync current user to saved profiles list in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
      let list: SavedProfile[] = raw ? JSON.parse(raw) : [];

      if (user?.phone) {
        const cleanPhone = user.phone.replace(/\D/g, '');
        const isOwner = isOwnerPhone(cleanPhone);

        const existingIdx = list.findIndex((p) => p.phone.replace(/\D/g, '') === cleanPhone);
        const profileObj: SavedProfile = {
          phone: user.phone,
          name: user.name || (isOwner ? 'Store Owner' : `User (${cleanPhone.slice(-4)})`),
          role: isOwner ? 'owner' : 'customer',
          lastActive: Date.now()
        };

        if (existingIdx >= 0) {
          list[existingIdx] = profileObj;
        } else {
          list.push(profileObj);
        }
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(list));
      }
      setSavedProfiles(list);
    } catch (e) {
      console.error('Failed to sync saved device profiles:', e);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSwitchProfile = (p: SavedProfile) => {
    const cleanCurrent = user?.phone ? user.phone.replace(/\D/g, '') : '';
    const cleanTarget = p.phone.replace(/\D/g, '');
    if (cleanCurrent === cleanTarget) return;

    if (p.role === 'owner') {
      login(p.phone, OWNER_NAME, []);
    } else {
      const reg = findRegisteredUser(cleanTarget);
      if (reg) {
        login(reg.phone, reg.name, reg.addresses, reg.password);
      } else {
        login(p.phone, p.name || 'User', []);
      }
    }
    onClose();
  };

  const handleAddAccount = () => {
    onClose();
    setLoginOpen(true);
  };

  return (
    <>
      <div className="profile-popover-backdrop" onClick={onClose} />
      
      <div className="profile-popover-card">
        {/* Active Profile Info */}
        <div className="profile-active-header">
          <div className="profile-avatar-circle">
            <User size={20} color="#2563eb" />
          </div>
          <div className="profile-active-text">
            <span className="profile-user-phone">{user?.phone || 'Guest User'}</span>
            <span className="profile-user-role">
              {role === 'owner' ? '👑 Store Manager' : '🛒 Verified Shopper'}
            </span>
          </div>
        </div>

        <div className="popover-divider" />

        {/* Profiles on this Phone */}
        <div className="popover-section">
          <div className="popover-section-label">
            <Smartphone size={13} />
            <span>PROFILES ON THIS PHONE</span>
          </div>

          <div className="saved-profiles-list">
            {savedProfiles.length === 0 ? (
              <div className="no-profiles-text">No other saved accounts on this phone.</div>
            ) : (
              savedProfiles.map((p) => {
                const isActive = user?.phone ? user.phone.replace(/\D/g, '') === p.phone.replace(/\D/g, '') : false;
                return (
                  <button
                    key={p.phone}
                    type="button"
                    className={`saved-profile-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSwitchProfile(p)}
                  >
                    <div className="saved-profile-left">
                      <div className="saved-profile-icon">
                        {p.role === 'owner' ? '👑' : '📱'}
                      </div>
                      <div className="saved-profile-meta">
                        <span className="saved-profile-phone">{p.phone}</span>
                        <span className="saved-profile-tag">{p.role === 'owner' ? 'Merchant' : 'Customer'}</span>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="active-check-badge"><Check size={14} /> Active</span>
                    ) : (
                      <span className="switch-link-text">Switch</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <button type="button" className="btn-add-account" onClick={handleAddAccount}>
            <PlusCircle size={15} />
            <span>Log in another phone profile</span>
          </button>
        </div>

        <div className="popover-divider" />

        {/* Legal & App Links */}
        <div className="popover-section">
          <div className="popover-section-label">
            <ShieldCheck size={13} />
            <span>TERMS & POLICIES</span>
          </div>

          <button
            type="button"
            className="popover-menu-btn"
            onClick={() => {
              onClose();
              onOpenPrivacyPolicy();
            }}
          >
            <ShieldCheck size={16} color="#0284c7" />
            <span>Privacy Policy & Terms</span>
          </button>

          {role === 'owner' && (
            <button
              type="button"
              className="popover-menu-btn"
              onClick={() => {
                onClose();
                setView(currentView === 'admin' ? 'catalog' : 'admin');
              }}
            >
              <Store size={16} color="#16a34a" />
              <span>{currentView === 'admin' ? 'Switch to Customer App' : 'Owner Merchant Dashboard'}</span>
            </button>
          )}

          {user && (
            <button
              type="button"
              className="popover-menu-btn logout-btn"
              onClick={() => {
                onClose();
                logout();
              }}
            >
              <LogOut size={16} color="#ef4444" />
              <span>Sign Out Account</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
