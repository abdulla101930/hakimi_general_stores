import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { Search, Mic, ChevronRight, X } from 'lucide-react';

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
  const { catalog } = useApp();
  const [selectedMainCat, setSelectedMainCat] = useState<'Food' | 'Hygiene'>('Food');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active subdivisions based on main category
  const activeSubdivisions = selectedMainCat === 'Food' ? FOOD_SUBDIVISIONS : HYGIENE_SUBDIVISIONS;

  // Filter products
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
    <div style={{ width: '100%', background: '#ffffff', minHeight: '100vh' }}>
      {/* 1. Header Search Bar with Voice Mic */}
      <div style={{ padding: '8px 16px 12px', background: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
        <div className="blinkit-search-bar">
          <Search size={18} color="#2563eb" />
          <input
            type="text"
            className="blinkit-search-input"
            placeholder='Search "workout", "biscuits", "milk", "oil"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={16} />
            </button>
          ) : (
            <Mic size={18} color="#64748b" style={{ cursor: 'pointer' }} />
          )}
        </div>
      </div>

      {/* 2. Two Large Contrasting Category Theme Cards (SS 3) */}
      <div className="main-category-dual-cards">
        {/* Card 1: Food Store */}
        <div 
          className={`category-theme-card food-card ${selectedMainCat === 'Food' ? 'selected' : ''}`}
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('All');
          }}
        >
          <div className="card-badge">Main Category</div>
          <div className="card-content-left">
            <span className="card-emoji">🍎 🍞 🥦</span>
            <h2 className="card-title">Food Store</h2>
            <p className="card-subtitle">Fresh Groceries, Fruits, Dairy & Staples</p>
          </div>
          <div className="card-action-btn">
            <span>Shop Food</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Card 2: Hygiene & Personal Care */}
        <div 
          className={`category-theme-card hygiene-card ${selectedMainCat === 'Hygiene' ? 'selected' : ''}`}
          onClick={() => {
            setSelectedMainCat('Hygiene');
            setSelectedSubCat('All');
          }}
        >
          <div className="card-badge teal-badge">Personal Care</div>
          <div className="card-content-left">
            <span className="card-emoji">🧼 🧴 🪥</span>
            <h2 className="card-title">Hygiene & Care</h2>
            <p className="card-subtitle">Bath, Body, Skincare & Cleaning</p>
          </div>
          <div className="card-action-btn teal-btn">
            <span>Shop Care</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* 3. Sub-Category Chips Carousel */}
      <div className="subcategory-scroll-row">
        {activeSubdivisions.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`subcat-chip ${selectedSubCat === sub ? 'active' : ''}`}
            onClick={() => setSelectedSubCat(sub)}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Filter Row (Count & Dietary Filters: Veg, Non-Veg, None) */}
      <div className="filter-sticky-row">
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
          {selectedSubCat === 'All' ? `${selectedMainCat} Specials` : selectedSubCat} ({filteredProducts.length})
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`dietary-filter-pill ${dietaryFilter === 'veg' ? 'active-veg' : ''}`}
            onClick={() => setDietaryFilter('veg')}
          >
            <span className="veg-dot" />
            <span>Veg</span>
          </button>

          <button
            type="button"
            className={`dietary-filter-pill ${dietaryFilter === 'non-veg' ? 'active-nonveg' : ''}`}
            onClick={() => setDietaryFilter('non-veg')}
          >
            <span className="nonveg-dot" />
            <span>Non-Veg</span>
          </button>

          <button
            type="button"
            className={`dietary-filter-pill ${dietaryFilter === 'all' ? 'active-all' : ''}`}
            onClick={() => setDietaryFilter('all')}
          >
            <span>None</span>
          </button>
        </div>
      </div>

      {/* 6. Product Cards Grid */}
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
