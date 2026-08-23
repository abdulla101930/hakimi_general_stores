import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FOOD_SUBDIVISIONS, HYGIENE_SUBDIVISIONS } from '../lib/constants';
import { ProductCard } from './ProductCard';
import { Search, ChevronRight, X } from 'lucide-react';

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

      <div className="main-category-dual-cards">
        <div
          className={`category-theme-card food-card ${selectedMainCat === 'Food' ? 'selected' : ''}`}
          onClick={() => {
            setSelectedMainCat('Food');
            setSelectedSubCat('All');
          }}
          role="button"
        >
          <div className="card-badge">Main Category</div>
          <div className="card-content-left">
            <div className="category-real-img-row">
              <img
                src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=120&q=80"
                alt="Fresh Apple"
                className="category-real-img-thumb"
              />
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=120&q=80"
                alt="Fresh Bread"
                className="category-real-img-thumb"
              />
              <img
                src="https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=120&q=80"
                alt="Fresh Broccoli"
                className="category-real-img-thumb"
              />
            </div>
            <h2 className="card-title">Food Store</h2>
            <p className="card-subtitle">Fresh Groceries, Fruits, Dairy & Staples</p>
          </div>
          <div className="card-action-btn">
            <span>Shop Food</span>
            <ChevronRight size={16} />
          </div>
        </div>

        <div
          className={`category-theme-card hygiene-card ${selectedMainCat === 'Hygiene' ? 'selected' : ''}`}
          onClick={() => {
            setSelectedMainCat('Hygiene');
            setSelectedSubCat('All');
          }}
          role="button"
        >
          <div className="card-badge teal-badge">Personal Care</div>
          <div className="card-content-left">
            <div className="category-real-img-row">
              <img
                src="https://images.unsplash.com/photo-1607006482602-76ca9bd7080f?auto=format&fit=crop&w=120&q=80"
                alt="Organic Soap"
                className="category-real-img-thumb"
              />
              <img
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=120&q=80"
                alt="Skincare Lotion"
                className="category-real-img-thumb"
              />
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=120&q=80"
                alt="Dental Care"
                className="category-real-img-thumb"
              />
            </div>
            <h2 className="card-title">Hygiene & Care</h2>
            <p className="card-subtitle">Bath, Body, Skincare & Cleaning</p>
          </div>
          <div className="card-action-btn teal-btn">
            <span>Shop Care</span>
            <ChevronRight size={16} />
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
