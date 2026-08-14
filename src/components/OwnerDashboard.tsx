import { useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { FOOD_SUBDIVISIONS as FOOD_SUBS, HYGIENE_SUBDIVISIONS as HYG_SUBS } from '../lib/constants';
import { stopOwnerRingingAlarm } from '../lib/sound';
import type { OrderStatus, Product } from '../types';
import { Plus, Edit, Trash2, Package, Truck, Save, User, VolumeX, Bell } from 'lucide-react';

export function OwnerDashboard() {
  const {
    catalog,
    orders,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    logout,
    setView,
    freeDeliveryThreshold,
    deliveryPricingMode,
    flatDeliveryCharge,
    distanceRateMultiplier,
    setDeliverySettings,
    isMaintenanceMode,
    toggleMaintenanceMode
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>('all');
  const [thresholdInput, setThresholdInput] = useState<string>(freeDeliveryThreshold.toString());
  const [pricingModeInput, setPricingModeInput] = useState<'flat' | 'distance'>(deliveryPricingMode || 'flat');
  const [flatChargeInput, setFlatChargeInput] = useState<string>((flatDeliveryCharge ?? 30).toString());
  const [distanceRateInput, setDistanceRateInput] = useState<string>((distanceRateMultiplier ?? 10).toString());
  const [thresholdMsg, setThresholdMsg] = useState<string>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [mainCategory, setMainCategory] = useState<'Food' | 'Hygiene'>('Food');
  const [subCategory, setSubCategory] = useState('veg/fruits');
  const [dietaryType, setDietaryType] = useState<'veg' | 'non-veg' | 'none'>('veg');
  const [inStock, setInStock] = useState(true);
  const [image, setImage] = useState('🍎');
  const [handlingFee, setHandlingFee] = useState('');
  const [variantsText, setVariantsText] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleSaveThreshold = (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(thresholdInput);
    const flatVal = parseFloat(flatChargeInput);
    const distRate = parseFloat(distanceRateInput);

    if (isNaN(val) || val < 0) {
      alert('Please enter a valid numeric free delivery threshold.');
      return;
    }
    if (isNaN(flatVal) || flatVal < 0) {
      alert('Please enter a valid flat delivery charge.');
      return;
    }
    if (isNaN(distRate) || distRate < 0) {
      alert('Please enter a valid distance rate multiplier.');
      return;
    }

    setDeliverySettings({
      freeDeliveryThreshold: val,
      deliveryPricingMode: pricingModeInput,
      flatDeliveryCharge: flatVal,
      distanceRateMultiplier: distRate
    });

    setThresholdMsg('✅ Store Delivery Settings updated successfully!');
    setTimeout(() => setThresholdMsg(''), 3500);
  };

  const handleCatalogFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || !weight || !image) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const priceNum = parseFloat(price);
    const origPriceNum = originalPrice ? parseFloat(originalPrice) : undefined;
    const handlingFeeNum = handlingFee.trim() ? parseFloat(handlingFee) : undefined;

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price.');
      return;
    }

    const availableVariants = variantsText
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [vWeight, vPriceStr] = part.split('@');
        const vPrice = parseFloat(vPriceStr);
        if (!vWeight || isNaN(vPrice) || vPrice <= 0) return null;
        return { weight: vWeight.trim(), price: vPrice };
      })
      .filter((v): v is { weight: string; price: number } => v !== null);

    setFormError('');

    if (editingId) {
      updateProduct(editingId, {
        name,
        price: priceNum,
        originalPrice: origPriceNum,
        weight,
        mainCategory,
        subCategory,
        dietaryType,
        inStock,
        image,
        handlingFee: handlingFeeNum,
        availableVariants: availableVariants.length > 0 ? availableVariants : undefined
      });
      setFormSuccess('Product details updated!');
      setEditingId(null);
    } else {
      addProduct({
        name,
        price: priceNum,
        originalPrice: origPriceNum,
        weight,
        mainCategory,
        subCategory,
        dietaryType,
        inStock,
        image,
        handlingFee: handlingFeeNum,
        availableVariants: availableVariants.length > 0 ? availableVariants : undefined
      });
      setFormSuccess('Product added to catalog!');
    }

    resetForm();
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const loadProductToEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice?.toString() || '');
    setWeight(p.weight);
    setMainCategory(p.mainCategory || 'Food');
    setSubCategory(p.subCategory || 'veg/fruits');
    setDietaryType(p.dietaryType || 'veg');
    setInStock(p.inStock);
    setImage(p.image);
    setHandlingFee(p.handlingFee?.toString() || '');
    setVariantsText(
      (p.availableVariants || [])
        .map((v) => `${v.weight}@${v.price}`)
        .join(', ')
    );
    setFormError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setWeight('');
    setMainCategory('Food');
    setSubCategory('veg/fruits');
    setDietaryType('veg');
    setInStock(true);
    setImage('🍎');
    setHandlingFee('');
    setVariantsText('');
    setFormError('');
  };

  const uniqueCustomers = Array.from(new Set(orders.map((o) => o.customerPhone)));

  const filteredOrders =
    selectedCustomerPhone === 'all' ? orders : orders.filter((o) => o.customerPhone === selectedCustomerPhone);

  const availableSubdivisions =
    mainCategory === 'Food' ? FOOD_SUBS.filter((s) => s !== 'All') : HYG_SUBS.filter((s) => s !== 'All');

  return (
    <div className="admin-container">
      <div className="admin-title-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="admin-title-icon">
            <Package size={16} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Merchant Dashboard</h2>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Hakimi Store Owner Portal</span>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            setView('catalog');
          }}
          className="admin-signout-btn"
        >
          Sign Out
        </button>
      </div>

      <div className="admin-tabs">
        <div
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            resetForm();
          }}
        >
          Orders & Timelogs ({orders.length})
        </div>
        <div className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          Manage Catalog
        </div>
        <div className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          Delivery Settings
        </div>
      </div>

      <div className="scrollable" style={{ paddingBottom: '30px' }}>
        {activeTab === 'orders' && (
          <div className="admin-orders-list">
            {orders.some((o) => o.status === 'placed') && (
              <div className="admin-alarm-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="admin-alarm-icon">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="admin-alarm-title">🔔 UNACCEPTED ORDER RECEIVED!</h4>
                    <p className="admin-alarm-sub">Ringing alarm active. (Repeats every 5 minutes until order is accepted)</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => stopOwnerRingingAlarm()} className="admin-mute-btn">
                    <VolumeX size={14} />
                    <span>Mute Sound</span>
                  </button>

                  {(() => {
                    const unaccepted = orders.find((o) => o.status === 'placed');
                    if (!unaccepted) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          updateOrderStatus(unaccepted.id, 'packing');
                          stopOwnerRingingAlarm();
                        }}
                        className="admin-accept-btn"
                      >
                        Accept Order (#{unaccepted.id})
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="admin-filter-row">
              <div className="admin-filter-label">
                <User size={14} color="var(--primary)" />
                <span>Filter by Customer:</span>
              </div>
              <select
                className="status-dropdown"
                value={selectedCustomerPhone}
                onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                <option value="all">All Customers ({orders.length} orders)</option>
                {uniqueCustomers.map((phone) => {
                  const custOrders = orders.filter((o) => o.customerPhone === phone);
                  const custName = custOrders[0]?.customerName || 'Customer';
                  return (
                    <option key={phone} value={phone}>
                      {custName} ({phone}) - {custOrders.length} orders
                    </option>
                  );
                })}
              </select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="admin-empty-card">
                <span style={{ fontSize: '32px' }}>📭</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  No customer orders match this filter.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="admin-order-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div className="admin-order-header">
                    <div>
                      <span className="admin-order-id">{order.id}</span>
                      <div className="admin-order-date">{order.date}</div>
                    </div>

                    <select
                      className="status-dropdown"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    >
                      <option value="placed">Placed</option>
                      <option value="packing">Packing</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  <div style={{ fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      👤 {order.customerName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({order.customerPhone})</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '11px' }}>
                      📍 <strong>{order.address.type}:</strong> {order.address.details}
                    </div>
                    {order.address.gps && (
                      <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
                        🌐 GPS Coordinates: Lat {order.address.gps.lat}, Lng {order.address.gps.lng}
                      </div>
                    )}
                    {order.instructions && (
                      <div className="admin-instructions-box">
                        💬 <strong>Instructions:</strong> "{order.instructions}"
                      </div>
                    )}
                  </div>

                  <div className="admin-timelog-grid">
                    <div>⏱️ Placed: <strong>{order.timelog?.placedAt || 'Recorded'}</strong></div>
                    <div>📦 Packing: <strong>{order.timelog?.packingAt || '--'}</strong></div>
                    <div>🛵 Out: <strong>{order.timelog?.outForDeliveryAt || '--'}</strong></div>
                    <div>🎁 Delivered: <strong>{order.timelog?.deliveredAt || '--'}</strong></div>
                  </div>

                  <div className="admin-order-items">
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>
                          • {item.name} ({item.weight}) x {item.quantity}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="admin-order-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Bill: Items ₹{order.bill.itemsTotal} | Fee ₹{order.bill.handlingCharge} | Del ₹{order.bill.deliveryCharge} | Disc ₹{order.bill.discount}
                    </div>
                    <span className="admin-order-amount">₹{order.bill.grandTotal}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-products-list">
            <h3 className="admin-form-title" style={{ padding: '0 4px' }}>
              {editingId ? 'Edit Product details' : 'Add New Product to Catalog'}
            </h3>

            {formError && <div className="admin-form-alert admin-form-alert-error">{formError}</div>}
            {formSuccess && <div className="admin-form-alert admin-form-alert-success">{formSuccess}</div>}

            <form
              onSubmit={handleCatalogFormSubmit}
              className="admin-form"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
            >
              <div className="input-group">
                <label className="input-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fresh Red Tomatoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Main Category *</label>
                  <select
                    className="form-input"
                    value={mainCategory}
                    onChange={(e) => {
                      const newMain = e.target.value as 'Food' | 'Hygiene';
                      setMainCategory(newMain);
                      setSubCategory(newMain === 'Food' ? 'veg/fruits' : 'bath/body');
                      if (newMain === 'Hygiene') setDietaryType('none');
                    }}
                  >
                    <option value="Food">Food</option>
                    <option value="Hygiene">Hygiene</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Subcategory *</label>
                  <select className="form-input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                    {availableSubdivisions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Dietary Type *</label>
                  <select
                    className="form-input"
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value as 'veg' | 'non-veg' | 'none')}
                  >
                    <option value="veg">🟢 Veg</option>
                    <option value="non-veg">🔴 Non-Veg</option>
                    <option value="none">⚪ None (Hygiene / General)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Weight/Volume *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 500 g, 1 L, 6 pcs"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Available Sizes / Quantities (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1 kg@120, 500 g@65  (size@price, comma separated)"
                  value={variantsText}
                  onChange={(e) => setVariantsText(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Selling Price (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 45"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Original Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Optional (Strikeout price)"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Emoji / Pic URL *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Emoji (e.g. 🍎) or URL"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Handling Fee (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Optional (0 if empty)"
                    value={handlingFee}
                    onChange={(e) => setHandlingFee(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group" style={{ margin: '4px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>Product currently in stock</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: '8px' }}>
                {editingId && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={resetForm}
                    style={{ flex: 1, backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  <Plus size={16} />
                  <span>{editingId ? 'Update Product' : 'Add Product'}</span>
                </button>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '10px' }}>
              <h3 className="admin-inventory-title">Inventory ({catalog.length} products)</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catalog.map((product) => (
                  <div key={product.id} className="admin-product-item">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        className="admin-product-img"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
                      >
                        {product.image.startsWith('http') ? (
                          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          product.image
                        )}
                      </div>

                      <div className="admin-product-info">
                        <div className="admin-product-name">{product.name}</div>
                        <div className="admin-product-meta">
                          {product.mainCategory || 'Food'} ➔ {product.subCategory} | ₹{product.price}{' '}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <s style={{ fontSize: '9px' }}>₹{product.originalPrice}</s>
                          )} |{' '}
                          {product.inStock ? (
                            <span style={{ color: 'var(--success)' }}>In Stock</span>
                          ) : (
                            <span style={{ color: 'var(--error)' }}>Out</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="admin-product-actions">
                      <button className="btn-icon-action" onClick={() => loadProductToEdit(product)} title="Edit Item">
                        <Edit size={14} />
                      </button>

                      <button
                        className="btn-icon-action delete"
                        onClick={() => {
                          if (confirm(`Delete ${product.name} from catalog?`)) {
                            deleteProduct(product.id);
                          }
                        }}
                        title="Delete Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="admin-maint-card"
              style={{
                backgroundColor: isMaintenanceMode ? '#fff1f2' : 'var(--bg-card)',
                border: isMaintenanceMode ? '2px solid #e11d48' : '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: isMaintenanceMode ? '#be123c' : 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🚨 Global Store Maintenance Mode</span>
                    {isMaintenanceMode && (
                      <span className="admin-offline-badge">OFFLINE (ACTIVE)</span>
                    )}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                    When switched ON, the ENTIRE site automatically displays the Under Maintenance screen for all customers in real-time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMaintenanceMode(!isMaintenanceMode)}
                  style={{
                    backgroundColor: isMaintenanceMode ? '#e11d48' : '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {isMaintenanceMode ? '🔴 Turn Site ONLINE' : '🔒 Turn Site OFFLINE'}
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <Truck size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Free Delivery & Convenience Fee Threshold
                </h3>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                Set the order price limit after which the handling charge and convenience fee will be waived for customers (e.g. ₹200 or ₹100).
              </p>

              {thresholdMsg && <div className="admin-threshold-msg">{thresholdMsg}</div>}

              <form onSubmit={handleSaveThreshold} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Free Delivery Threshold Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    placeholder="e.g. 200"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Orders at or above this amount automatically get FREE delivery!
                  </span>
                </div>

                <div className="input-group">
                  <label className="input-label">Delivery Charge Calculation Model</label>
                  <select
                    className="form-input"
                    value={pricingModeInput}
                    onChange={(e) => setPricingModeInput(e.target.value as 'flat' | 'distance')}
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    <option value="flat">Standard Flat Delivery Charge (Same fee for all)</option>
                    <option value="distance">Distance-Based Delivery Charge (Fee per KM from shop)</option>
                  </select>
                </div>

                {pricingModeInput === 'flat' ? (
                  <div className="input-group">
                    <label className="input-label">Standard Flat Delivery Charge (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={flatChargeInput}
                      onChange={(e) => setFlatChargeInput(e.target.value)}
                      placeholder="e.g. 30"
                      required
                    />
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="input-label">Distance Rate Multiplier (₹ / km)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={distanceRateInput}
                      onChange={(e) => setDistanceRateInput(e.target.value)}
                      placeholder="e.g. 10 (Calculation: Distance in KM × Rate)"
                      required
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Calculated automatically using customer's GPS address coordinates relative to Hakimi Supermarket.
                    </span>
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ padding: '12px', marginTop: '6px' }}>
                  <Save size={16} />
                  <span>Save Store Delivery Settings</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
