import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { Search, Filter, Truck } from 'lucide-react';

export const FOOD_SUBDIVISIONS = [
  'All',
  'veg/fruits',
  'atta/rice/dal',
  'oil/ghee/masala',
  'dairy/bread/eggs',
  'bakery/biscuits',
  'dry fruits/cereal',
  'chips/namkeen',
  'teas/coffees/beverages',
  'frozen/instant foods',
  'sauces/spreads',
  'pickles',
  'icecream'
];

export const HYGIENE_SUBDIVISIONS = [
  'All',
  'bath/body',
  'hair',
  'skin care',
  'inners',
  'detergents'
];

export const Catalog: React.FC = () => {
  const { catalog, cart, freeDeliveryThreshold } = useApp();
  const [selectedMainCat, setSelectedMainCat] = useState<'Food' | 'Hygiene'>('Food');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate current cart total for free delivery threshold prompt
  const cartSubtotal = useMemo(() => {
    let sum = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const p = catalog.find(prod => prod.id === id);
      if (p) sum += p.price * qty;
    });
    return sum;
  }, [cart, catalog]);

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartSubtotal);

  // Active subdivisions based on main category
  const activeSubdivisions = selectedMainCat === 'Food' ? FOOD_SUBDIVISIONS : HYGIENE_SUBDIVISIONS;

  // Filter products by Main Category, Sub Category, Dietary Filter, and Search
  const filteredProducts = useMemo(() => {
    return catalog.filter(p => {
      // Main Category Match (fallback to Food if missing)
      const pMain = p.mainCategory || 'Food';
      if (pMain !== selectedMainCat) return false;

      // Sub Category Match
      if (selectedSubCat !== 'All') {
        if (p.subCategory !== selectedSubCat) return false;
      }

      // Dietary Filter Match (only applies if food or if specified)
      if (dietaryFilter === 'veg' && p.dietaryType !== 'veg') return false;
      if (dietaryFilter === 'non-veg' && p.dietaryType !== 'non-veg') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSub = (p.subCategory || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSub) return false;
      }

      return true;
    });
  }, [catalog, selectedMainCat, selectedSubCat, dietaryFilter, searchQuery]);

  return (
    <div className="catalog-container">
      {/* Search & Hero Banner */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search groceries, atta, dairy, soaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Free Delivery Threshold Notification Banner */}
      <div className="free-delivery-banner">
        <Truck size={20} color="#2563eb" />
        <div style={{ flex: 1 }}>
          {amountNeededForFreeDelivery > 0 ? (
            <div className="free-delivery-text">
              Add <span className="free-delivery-accent">₹{amountNeededForFreeDelivery}</span> worth items more to unlock <span className="free-delivery-accent">FREE delivery & handling</span>!
            </div>
          ) : (
            <div className="free-delivery-text" style={{ color: '#16a34a' }}>
              🎉 <strong>FREE Delivery & Handling Unlocked!</strong> (Cart &gt;= ₹{freeDeliveryThreshold})
            </div>
          )}
        </div>
      </div>

      {/* Main Category Switcher (Food vs Hygiene) */}
      <div className="main-category-switcher">
        <button
          type="button"
          className={`main-cat-btn ${selectedMainCat === 'Food' ? 'active' : ''}`}
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('All');
          }}
        >
          <span>🍎</span>
          <span>Food</span>
        </button>

        <button
          type="button"
          className={`main-cat-btn ${selectedMainCat === 'Hygiene' ? 'active' : ''}`}
          onClick={() => {
            setSelectedMainCat('Hygiene');
            setSelectedSubCat('All');
          }}
        >
          <span>🧼</span>
          <span>Hygiene</span>
        </button>
      </div>

      {/* Top Dietary Filter for Veg / Non-Veg (shown for Food or catalog) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px 0',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
          <Filter size={12} color="var(--primary)" />
          <span>Dietary Preference:</span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => setDietaryFilter('all')}
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: dietaryFilter === 'all' ? 'var(--primary)' : 'var(--bg-input)',
              color: dietaryFilter === 'all' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setDietaryFilter('veg')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: dietaryFilter === 'veg' ? '#16a34a' : 'var(--bg-input)',
              color: dietaryFilter === 'veg' ? 'white' : '#16a34a',
              cursor: 'pointer'
            }}
          >
            <span className="dietary-badge veg" style={{ width: 10, height: 10 }} />
            <span>Veg</span>
          </button>
          <button
            type="button"
            onClick={() => setDietaryFilter('non-veg')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: dietaryFilter === 'non-veg' ? '#dc2626' : 'var(--bg-input)',
              color: dietaryFilter === 'non-veg' ? 'white' : '#dc2626',
              cursor: 'pointer'
            }}
          >
            <span className="dietary-badge non-veg" style={{ width: 10, height: 10 }} />
            <span>Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Subcategory Pills Slider */}
      <div className="category-slider">
        {activeSubdivisions.map(subCat => (
          <button
            key={subCat}
            className={`category-pill ${selectedSubCat === subCat ? 'active' : ''}`}
            onClick={() => setSelectedSubCat(subCat)}
          >
            {subCat === 'All' ? '✨ All' : subCat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="product-grid" style={{ minHeight: '300px' }}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--text-muted)'
          }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</p>
            <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>No items found</h4>
            <p style={{ fontSize: '12px' }}>Try selecting a different subdivision or dietary filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
