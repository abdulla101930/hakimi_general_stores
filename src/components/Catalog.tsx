import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FOOD_SUBDIVISIONS, HYGIENE_SUBDIVISIONS } from '../lib/constants';
import { ProductCard } from './ProductCard';
import { Search, ChevronRight, X, CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';

export function Catalog() {
  const { customerCatalog: catalog } = useApp();
  const [selectedMainCat, setSelectedMainCat] = useState<'Food' | 'Hygiene'>('Food');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeSubdivisions = selectedMainCat === 'Food' ? FOOD_SUBDIVISIONS : HYGIENE_SUBDIVISIONS;

  const filteredProducts = useMemo(() => {
    return catalog.filter((p) => {
      const pMain = p.mainCategory || 'Food';
      if (pMain !== selectedMainCat) return false;
      if (selectedSubCat !== 'All' && p.subCategory !== selectedSubCat) return false;
      if (dietaryFilter === 'veg' && p.dietaryType !== 'veg') return false;
      if (dietaryFilter === 'non-veg' && p.dietaryType !== 'non-veg') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.subCategory || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [catalog, selectedMainCat, selectedSubCat, dietaryFilter, searchQuery]);

  return (
    <div className="catalog-root">
      <div className="catalog-search-row">
        <div className="blinkit-search-bar">
          <Search size={18} color="#2563eb" />
          <input
            type="text"
            className="blinkit-search-input"
            placeholder='Search "biscuits", "milk", "oil"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button type="button" className="catalog-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="main-category-hero-grid">
        {/* Food Store Banner Card */}
        <div
          className={`hero-category-banner food-hero-banner ${selectedMainCat === 'Food' ? 'active-selected' : ''}`}
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('All');
          }}
          role="button"
          tabIndex={0}
        >
          {selectedMainCat === 'Food' && (
            <div className="active-category-pill food-active-pill">
              <CheckCircle2 size={12} color="#ffffff" />
              <span>SELECTED</span>
            </div>
          )}

          <div className="hero-banner-content">
            <span className="hero-banner-tag food-tag">
              <ShoppingBag size={11} /> GROCERIES & STAPLES
            </span>
            <h2 className="hero-banner-title">Food Store</h2>
            <p className="hero-banner-sub">Fresh Fruits, Veggies, Dairy & Bakery</p>
            <div className="hero-banner-cta food-cta">
              <span>Explore Food</span>
              <ChevronRight size={14} className="cta-arrow" />
            </div>
          </div>

          <div className="hero-banner-visual-wrapper">
            <div className="hero-img-card-frame">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
                alt="Fresh Groceries"
                className="hero-banner-photo"
              />
              <div className="hero-img-badge food-img-badge">10 Min</div>
            </div>
          </div>
        </div>

        {/* Hygiene & Care Banner Card */}
        <div
          className={`hero-category-banner hygiene-hero-banner ${selectedMainCat === 'Hygiene' ? 'active-selected' : ''}`}
          onClick={() => {
            setSelectedMainCat('Hygiene');
            setSelectedSubCat('All');
          }}
          role="button"
          tabIndex={0}
        >
          {selectedMainCat === 'Hygiene' && (
            <div className="active-category-pill hygiene-active-pill">
              <CheckCircle2 size={12} color="#ffffff" />
              <span>SELECTED</span>
            </div>
          )}

          <div className="hero-banner-content">
            <span className="hero-banner-tag hygiene-tag">
              <Sparkles size={11} /> PERSONAL CARE
            </span>
            <h2 className="hero-banner-title">Hygiene & Care</h2>
            <p className="hero-banner-sub">Bath, Body, Skincare & Cleaning</p>
            <div className="hero-banner-cta hygiene-cta">
              <span>Explore Care</span>
              <ChevronRight size={14} className="cta-arrow" />
            </div>
          </div>

          <div className="hero-banner-visual-wrapper">
            <div className="hero-img-card-frame">
              <img
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80"
                alt="Personal Care"
                className="hero-banner-photo"
              />
              <div className="hero-img-badge hygiene-img-badge">Top Care</div>
            </div>
          </div>
        </div>
      </div>

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

      <div className="filter-sticky-row">
        <span className="catalog-count">
          {selectedSubCat === 'All' ? `${selectedMainCat} Specials` : selectedSubCat} ({filteredProducts.length})
        </span>
        <div className="dietary-filter-group">
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

      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
        ) : (
          <div className="products-empty">
            <p className="products-empty-emoji">🛒</p>
            <h4 className="products-empty-title">No items found</h4>
            <p className="products-empty-sub">Try switching categories or clearing search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
