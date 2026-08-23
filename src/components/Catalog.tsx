import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FOOD_SUBDIVISIONS, HYGIENE_SUBDIVISIONS } from '../lib/constants';
import { ProductCard } from './ProductCard';
import { Search, ChevronRight, X, CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';
import type { Product } from '../types';

const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Food & Staples
  apple: ['apples', 'shimla', 'fruit', 'fruits'],
  tomato: ['tomatoes', 'tamatar', 'veg', 'vegetables'],
  onion: ['onions', 'pyaz', 'pyaaz', 'veg'],
  atta: ['flour', 'wheat', 'chakki', 'aashirvaad', 'roti'],
  rice: ['basmati', 'chawal', 'chaal', 'fortune'],
  dal: ['dhal', 'pulse', 'pulses', 'toor', 'tata', 'sampann'],
  oil: ['tel', 'refined', 'sunflower', 'ghee', 'oil/ghee/masala'],
  ghee: ['pure', 'cow', 'amul', 'butter'],
  milk: ['doodh', 'taaza', 'toned', 'dairy', 'amul'],
  egg: ['eggs', 'anda', 'ande', 'white'],
  bread: ['pav', 'toast', 'whole wheat', 'modern'],
  biscuit: ['biscuits', 'cookie', 'cookies', 'good day', 'britannia', 'bakery'],
  almond: ['badam', 'dry fruit', 'nuts'],
  namkeen: ['bhujia', 'chips', 'snacks', 'haldiram', 'snack'],
  tea: ['chai', 'patti', 'red label', 'beverage', 'beverages'],
  nugget: ['nuggets', 'mccain', 'frozen', 'chicken'],
  sauce: ['ketchup', 'kissan', 'tomato ketchup', 'spread'],
  pickle: ['achar', 'achaar', 'mango', 'mother'],
  icecream: ['ice cream', 'tub', 'kwality', 'chocolate', 'dessert'],

  // Hygiene & Personal Care
  soap: ['sabun', 'bathing', 'dettol', 'bath/body', 'hygiene'],
  shampoo: ['hair', 'head & shoulders', 'cleaner', 'wash'],
  cream: ['lotion', 'nivea', 'soft', 'moisturizer', 'skin care', 'skincare'],
  inner: ['inners', 'underwear', 'jockey', 'v-neck', 'cotton'],
  detergent: ['washing', 'surf excel', 'powder', 'detergents', 'soap']
};

function matchesProductSearch(product: Product, query: string): { matches: boolean; score: number } {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return { matches: true, score: 0 };

  const queryTokens = trimmed.split(/\s+/).filter(Boolean);
  const pName = (product.name || '').toLowerCase();
  const pSub = (product.subCategory || '').toLowerCase();
  const pMain = (product.mainCategory || '').toLowerCase();
  const pWeight = (product.weight || '').toLowerCase();
  const pDiet = (product.dietaryType || '').toLowerCase();

  let combinedText = `${pName} ${pSub} ${pMain} ${pWeight} ${pDiet}`;

  for (const [key, aliases] of Object.entries(SEARCH_SYNONYMS)) {
    if (queryTokens.some((t) => key.includes(t) || aliases.some((a) => a.includes(t)))) {
      if (combinedText.includes(key) || aliases.some((a) => combinedText.includes(a))) {
        combinedText += ` ${key} ${aliases.join(' ')}`;
      }
    }
  }

  let totalScore = 0;

  for (const token of queryTokens) {
    let tokenMatched = false;

    if (pName === trimmed) {
      totalScore += 200;
      tokenMatched = true;
    } else if (pName.includes(trimmed)) {
      totalScore += 100;
      tokenMatched = true;
    } else if (pName.includes(token)) {
      totalScore += 50;
      tokenMatched = true;
    } else if (pSub.includes(token)) {
      totalScore += 30;
      tokenMatched = true;
    } else if (pMain.includes(token)) {
      totalScore += 20;
      tokenMatched = true;
    } else if (combinedText.includes(token)) {
      totalScore += 15;
      tokenMatched = true;
    }

    if (!tokenMatched) {
      return { matches: false, score: 0 };
    }
  }

  return { matches: true, score: totalScore };
}

export function Catalog() {
  const { customerCatalog: catalog } = useApp();
  const [selectedMainCat, setSelectedMainCat] = useState<'Food' | 'Hygiene'>('Food');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeSubdivisions = selectedMainCat === 'Food' ? FOOD_SUBDIVISIONS : HYGIENE_SUBDIVISIONS;

  const filteredProducts = useMemo(() => {
    const isSearching = Boolean(searchQuery.trim());

    const results: { product: Product; score: number }[] = [];

    for (const p of catalog) {
      const pMain = p.mainCategory || 'Food';

      // If user is NOT searching, filter strictly by selected category
      if (!isSearching) {
        if (pMain !== selectedMainCat) continue;
        if (selectedSubCat !== 'All' && p.subCategory !== selectedSubCat) continue;
      }

      // Dietary filter check
      if (dietaryFilter === 'veg' && p.dietaryType !== 'veg') continue;
      if (dietaryFilter === 'non-veg' && p.dietaryType !== 'non-veg') continue;

      // Subcategory filter check when searching only if explicitly specified
      if (isSearching && selectedSubCat !== 'All') {
        if (p.subCategory !== selectedSubCat) continue;
      }

      if (isSearching) {
        const { matches, score } = matchesProductSearch(p, searchQuery);
        if (matches) {
          results.push({ product: p, score });
        }
      } else {
        results.push({ product: p, score: 0 });
      }
    }

    if (isSearching) {
      results.sort((a, b) => b.score - a.score);
    }

    return results.map((r) => r.product);
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
          {searchQuery.trim()
            ? `Results for "${searchQuery}" (${filteredProducts.length})`
            : selectedSubCat === 'All'
            ? `${selectedMainCat} Specials`
            : selectedSubCat}{' '}
          {!searchQuery.trim() && `(${filteredProducts.length})`}
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
            <p className="products-empty-emoji">🔍</p>
            <h4 className="products-empty-title">
              {searchQuery.trim() ? `No results for "${searchQuery}"` : 'No items found'}
            </h4>
            <p className="products-empty-sub">
              {searchQuery.trim()
                ? 'Check spelling or try popular search terms below:'
                : 'Try switching categories or clearing search filters.'}
            </p>
            {searchQuery.trim() && (
              <div className="popular-search-suggestions">
                <span className="popular-search-label">Popular Searches:</span>
                <div className="popular-search-chips">
                  {['Milk', 'Rice', 'Atta', 'Soap', 'Dettol', 'Oil', 'Tea', 'Biscuits'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="popular-chip"
                      onClick={() => setSearchQuery(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
