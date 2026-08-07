import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { Search, Bike, X } from 'lucide-react';

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
  const progressPercent = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);

  // Active subdivisions based on main category
  const activeSubdivisions = selectedMainCat === 'Food' ? FOOD_SUBDIVISIONS : HYGIENE_SUBDIVISIONS;

  // Filter products by Main Category, Sub Category, Dietary Filter, and Search
  const filteredProducts = useMemo(() => {
    return catalog.filter(p => {
      const pMain = p.mainCategory || 'Food';
      if (pMain !== selectedMainCat) return false;

      if (selectedSubCat !== 'All') {
        if (p.subCategory !== selectedSubCat) return false;
      }

      if (dietaryFilter === 'veg' && p.dietaryType !== 'veg') return false;
      if (dietaryFilter === 'non-veg' && p.dietaryType !== 'non-veg') return false;

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
    <div style={{ width: '100%' }}>
      {/* Header Search Bar */}
      <div className="header-search-wrapper">
        <div className="search-input-box">
          <Search size={18} color="var(--primary)" />
          <input
            type="text"
            className="search-input-field"
            placeholder='Search "milk", "fruits", "oil", "soap"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Category Tabs (Food vs Hygiene) */}
      <div className="category-segmented-bar">
        <button
          type="button"
          className={`segment-tab ${selectedMainCat === 'Food' ? 'active' : ''}`}
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('All');
          }}
        >
          <span>🍎</span>
          <span>Food Store</span>
        </button>

        <button
          type="button"
          className={`segment-tab ${selectedMainCat === 'Hygiene' ? 'active' : ''}`}
          onClick={() => {
            setSelectedMainCat('Hygiene');
            setSelectedSubCat('All');
          }}
        >
          <span>🧼</span>
          <span>Hygiene & Care</span>
        </button>
      </div>

      {/* Dietary Preference & Filter Bar */}
      <div className="filter-sticky-row">
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
          {selectedSubCat === 'All' ? selectedMainCat : selectedSubCat} ({filteredProducts.length})
        </span>

        <div className="dietary-pills-group">
          <button
            type="button"
            className={`dietary-pill ${dietaryFilter === 'all' ? 'active all' : ''}`}
            onClick={() => setDietaryFilter('all')}
          >
            All
          </button>

          <button
            type="button"
            className={`dietary-pill ${dietaryFilter === 'veg' ? 'active veg' : ''}`}
            onClick={() => setDietaryFilter('veg')}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--veg-color)' }} />
            Veg
          </button>

          <button
            type="button"
            className={`dietary-pill ${dietaryFilter === 'non-veg' ? 'active non-veg' : ''}`}
            onClick={() => setDietaryFilter('non-veg')}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--non-veg-color)' }} />
            Non-Veg
          </button>
        </div>
      </div>

      {/* Single Horizontal Scrolling Sub-Category Carousel */}
      <div className="subcategories-carousel">
        {activeSubdivisions.map(subCat => (
          <button
            key={subCat}
            className={`subcategory-pill ${selectedSubCat === subCat ? 'active' : ''}`}
            onClick={() => setSelectedSubCat(subCat)}
          >
            {subCat === 'All' ? '✨ All Categories' : subCat}
          </button>
        ))}
      </div>

      {/* Blinkit Free Delivery Banner */}
      <div className={`free-delivery-banner-card ${amountNeededForFreeDelivery === 0 ? 'unlocked' : ''}`}>
        <Bike size={20} color={amountNeededForFreeDelivery === 0 ? 'var(--veg-color)' : 'var(--primary)'} />
        <div className="free-delivery-text-info">
          {amountNeededForFreeDelivery > 0 ? (
            <>
              Add products worth <strong>₹{amountNeededForFreeDelivery} more</strong> for <strong>FREE Delivery & Handling</strong>!
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </>
          ) : (
            <>
              🎉 <strong>FREE Delivery Unlocked!</strong> You saved handling & delivery charges on this order.
            </>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 16px',
            color: 'var(--text-muted)',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            margin: '0 16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <p style={{ fontSize: '36px', marginBottom: '8px' }}>🛒</p>
            <h4 style={{ fontSize: '15px', color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>No items found</h4>
            <p style={{ fontSize: '12px' }}>Try switching categories or clearing search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
