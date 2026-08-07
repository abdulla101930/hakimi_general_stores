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

// Top Horizontal Category Icons matching reference screenshot
const CATEGORY_ICONS = [
  { id: 'All', label: 'All', icon: '🍺' },
  { id: 'bakery/biscuits', label: 'Bakery', icon: '🍥' },
  { id: 'teas/coffees/beverages', label: 'Drinks', icon: '🎧' },
  { id: 'bath/body', label: 'Beauty', icon: '💄' },
  { id: 'skin care', label: 'Decor', icon: '🛋️' },
  { id: 'dairy/bread/eggs', label: 'Kids', icon: '🍼' },
  { id: 'veg/fruits', label: 'Fresh', icon: '🍎' },
  { id: 'chips/namkeen', label: 'Snacks', icon: '🍿' }
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

      {/* 2. Blinkit Category Icon Tabs Row */}
      <div className="blinkit-category-icons-row">
        {CATEGORY_ICONS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`blinkit-category-icon-item ${selectedSubCat === cat.id ? 'active' : ''}`}
            onClick={() => {
              if (cat.id === 'bath/body' || cat.id === 'skin care') {
                setSelectedMainCat('Hygiene');
              } else {
                setSelectedMainCat('Food');
              }
              setSelectedSubCat(cat.id);
            }}
          >
            <div className="icon-box">{cat.icon}</div>
            <span className="icon-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Featured Banners Horizontal Carousel */}
      <div className="blinkit-banners-carousel">
        <div className="blinkit-banner-card blue-gradient">
          <span className="blinkit-banner-tag">Festive Finds</span>
          <div>
            <span style={{ fontSize: '11px', opacity: 0.9 }}>CELEBRATE</span>
            <div className="blinkit-banner-title">sawan</div>
          </div>
        </div>

        <div className="blinkit-banner-card sky-gradient">
          <span className="blinkit-banner-tag" style={{ background: '#f59e0b', color: '#ffffff' }}>NEWLY LAUNCHED</span>
          <div className="blinkit-banner-title">Essential Combos</div>
          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '6px', width: 'fit-content' }}>
            ✦ For You ✦
          </span>
        </div>

        <div className="blinkit-banner-card indigo-gradient">
          <span className="blinkit-banner-tag">Featured</span>
          <div>
            <div className="blinkit-banner-title">Midnight Essentials</div>
            <span style={{ fontSize: '10px', opacity: 0.85 }}>Superfast 8 min delivery</span>
          </div>
        </div>

        <div className="blinkit-banner-card cyan-gradient">
          <span className="blinkit-banner-tag">Fresh</span>
          <div className="blinkit-banner-title">Ratlam Groceries</div>
          <span style={{ fontSize: '10px', opacity: 0.85 }}>Direct from Farm</span>
        </div>
      </div>

      {/* 4. Frequently bought Section Cards */}
      <div className="blinkit-section-header">
        Frequently bought
      </div>

      <div className="frequently-bought-grid">
        {/* Card 1: Chocolates & Candies */}
        <div 
          className="freq-bought-card"
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('bakery/biscuits');
          }}
        >
          <div className="freq-thumbs-wrapper">
            <span className="freq-thumb-img" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍫</span>
            <span className="freq-thumb-img" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍬</span>
            <span className="freq-more-badge">+7 more</span>
          </div>
          <span className="freq-card-label">Chocolates & Candies</span>
        </div>

        {/* Card 2: Chips & Namkeen */}
        <div 
          className="freq-bought-card"
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('chips/namkeen');
          }}
        >
          <div className="freq-thumbs-wrapper">
            <span className="freq-thumb-img" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍿</span>
            <span className="freq-thumb-img" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🥨</span>
            <span className="freq-more-badge">+4 more</span>
          </div>
          <span className="freq-card-label">Chips & Namkeen</span>
        </div>

        {/* Card 3: Cakes & Biscuits */}
        <div 
          className="freq-bought-card"
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('bakery/biscuits');
          }}
        >
          <div className="freq-thumbs-wrapper">
            <span className="freq-thumb-img" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍰</span>
            <span className="freq-thumb-img" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍪</span>
            <span className="freq-more-badge">+6 more</span>
          </div>
          <span className="freq-card-label">Cakes & Biscuits</span>
        </div>
      </div>

      {/* See All Products Callout */}
      <button 
        type="button" 
        className="see-all-products-banner"
        onClick={() => {
          setSelectedMainCat('Food');
          setSelectedSubCat('All');
        }}
      >
        <span style={{ fontSize: '14px' }}>🍫 🍿 🍰</span>
        <span>See all products</span>
        <ChevronRight size={14} color="#1d4ed8" />
      </button>

      {/* 5. Main Category Segmented Bar & Sub-Category Carousel */}
      <div className="category-segmented-bar" style={{ margin: '8px 16px' }}>
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

      {/* Filter Row (Count & Veg Pill) */}
      <div className="filter-sticky-row">
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
          {selectedSubCat === 'All' ? `${selectedMainCat} Specials` : selectedSubCat} ({filteredProducts.length})
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

      {/* Subcategory Pills Horizontal Carousel */}
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

      {/* 6. Product Cards Grid */}
      <div className="products-grid" style={{ padding: '16px' }}>
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
