import React, { useState } from 'react';
import { X, MapPin, Navigation, Check } from 'lucide-react';
import type { Address } from '../context/AppContext';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (addr: Address) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress
}) => {
  const [addressType, setAddressType] = useState('Home');
  const [streetDetails, setStreetDetails] = useState('');
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5204, // Default Pune/Mumbai coordinates
    lng: 73.8567
  });
  const [isLocating, setIsLocating] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPinCoords({ lat, lng });
        setIsLocating(false);
        if (!streetDetails) {
          setStreetDetails(`Pinned Location near GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert("Unable to retrieve GPS position. You can move the map pin manually.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Simulate latitude and longitude micro offsets based on map click
    const deltaLat = ((rect.height / 2 - clickY) / rect.height) * 0.02;
    const deltaLng = ((clickX - rect.width / 2) / rect.width) * 0.02;
    
    const newLat = Number((pinCoords.lat + deltaLat).toFixed(5));
    const newLng = Number((pinCoords.lng + deltaLng).toFixed(5));
    
    setPinCoords({ lat: newLat, lng: newLng });
    setDragOffset({ x: clickX - rect.width / 2, y: clickY - rect.height / 2 });
  };

  const handleConfirmLocation = () => {
    if (!streetDetails.trim()) {
      alert("Please enter street address / house details.");
      return;
    }

    const fullDetails = `${streetDetails.trim()} (GPS: ${pinCoords.lat}, ${pinCoords.lng})`;
    onSelectAddress({
      type: addressType,
      details: fullDetails,
      gps: pinCoords
    });
    onClose();
  };

  return (
    <>
      <div className="drawer-backdrop active" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="drawer-content active" style={{ zIndex: 9995, maxHeight: '90%', height: '85%' }}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} color="var(--primary)" />
            <h3 className="drawer-title">Pin Exact Delivery Location</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Map Workspace */}
        <div className="scrollable" style={{ padding: '12px' }}>
          {/* Interactive Map Visual Simulator */}
          <div
            onClick={handleMapClick}
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              backgroundColor: '#e2e8f0',
              backgroundImage: `
                radial-gradient(#94a3b8 1px, transparent 1px),
                linear-gradient(to right, #cbd5e1 1px, transparent 1px),
                linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px, 40px 40px, 40px 40px',
              borderRadius: 'var(--border-radius-md)',
              border: '2px solid var(--primary)',
              overflow: 'hidden',
              cursor: 'crosshair',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {/* Map Roads / Landmarks simulation */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: 0,
              right: 0,
              height: '18px',
              backgroundColor: '#ffffff',
              borderTop: '2px solid #cbd5e1',
              borderBottom: '2px solid #cbd5e1',
              transform: 'rotate(-5deg)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '45%',
              width: '18px',
              backgroundColor: '#ffffff',
              borderLeft: '2px solid #cbd5e1',
              borderRight: '2px solid #cbd5e1',
              transform: 'rotate(15deg)',
              pointerEvents: 'none'
            }} />

            {/* Pinned Marker */}
            <div style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: `translate(${dragOffset.x}px, ${dragOffset.y - 20}px)`,
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <div style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
                marginBottom: '2px'
              }}>
                📍 Drop Pin Here
              </div>
              <MapPin size={36} color="#dc2626" fill="#ef4444" />
            </div>

            {/* Floating GPS button inside Map */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleGetCurrentLocation(); }}
              disabled={isLocating}
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'white',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-md)',
                zIndex: 15
              }}
            >
              <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Locating GPS...' : 'Locate Me'}</span>
            </button>
          </div>

          <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
            💡 Tap anywhere on map to position the delivery pin accurately.
          </p>

          {/* Coordinate details card */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--border-radius-sm)',
            padding: '8px 12px',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 600 }}>
              Pinned Coordinates:
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>
              {pinCoords.lat.toFixed(5)}, {pinCoords.lng.toFixed(5)}
            </span>
          </div>

          {/* Address Type Selector */}
          <div style={{ marginTop: '12px' }}>
            <label className="input-label" style={{ marginBottom: '6px', display: 'block' }}>Save Address As</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Home', 'Work', 'Other'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAddressType(t)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: addressType === t ? 'var(--primary)' : 'var(--bg-input)',
                    color: addressType === t ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* House / Flat details input */}
          <div className="input-group" style={{ marginTop: '12px' }}>
            <label className="input-label">House / Flat / Building / Street Details *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Flat 302, Royal Residency, M.G. Road"
              value={streetDetails}
              onChange={(e) => setStreetDetails(e.target.value)}
            />
          </div>

          {/* Submit CTA */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirmLocation}
            style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '13px' }}
          >
            <Check size={16} />
            <span>Save Location Pin & Address</span>
          </button>
        </div>
      </div>
    </>
  );
};
