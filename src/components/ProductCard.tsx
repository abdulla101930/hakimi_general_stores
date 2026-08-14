import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { cartKeyOf, getProductOriginalPrice, getProductPrice } from '../lib/cart';
import type { Product } from '../types';
import { Plus, Minus, Heart, ChevronDown } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useApp();
  const [selectedWeight, setSelectedWeight] = useState(product.weight);
  const [isLiked, setIsLiked] = useState(false);

  const price = getProductPrice(product, selectedWeight);
  const originalPrice = getProductOriginalPrice(product, selectedWeight);
  const hasVariants = Array.isArray(product.availableVariants) && product.availableVariants.length > 0;

  const effectiveOriginal = originalPrice && originalPrice > price ? originalPrice : undefined;
  const discountPercent = effectiveOriginal
    ? Math.round(((effectiveOriginal - price) / effectiveOriginal) * 100)
    : 0;

  const quantity = cart[cartKeyOf(product.id, selectedWeight)] || 0;

  const isEmoji = !product.image.startsWith('http') && !product.image.startsWith('/');
  const isHygiene = product.mainCategory === 'Hygiene';

  return (
    <div className={`product-card ${isHygiene ? 'card-hygiene' : 'card-food'}`}>
      <div className="product-img-container">
        <button
          type="button"
          className="product-like-btn"
          onClick={() => setIsLiked(!isLiked)}
          title="Save for later"
        >
          <Heart size={14} color={isLiked ? '#ef4444' : '#64748b'} fill={isLiked ? '#ef4444' : 'none'} />
        </button>

        {discountPercent > 0 && product.inStock && (
          <span className="discount-pill">{discountPercent}% OFF</span>
        )}

        {product.dietaryType === 'veg' && (
          <div className="dietary-badge-corner" title="Vegetarian">
            <span className="veg-dot" />
          </div>
        )}
        {product.dietaryType === 'non-veg' && (
          <div className="dietary-badge-corner" title="Non-Vegetarian">
            <span className="nonveg-dot" />
          </div>
        )}

        {isEmoji ? (
          <span className="product-emoji-render">{product.image}</span>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            className="product-img-render"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = 'none';
              const parent = img.parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.className = 'product-emoji-render';
                span.textContent = '🛍️';
                parent.appendChild(span);
              }
            }}
          />
        )}

        {!product.inStock && <div className="product-out-of-stock">OUT OF STOCK</div>}
      </div>

      <div className="product-info-box">
        <div className="product-variant-select-wrap">
          <select
            className="product-variant-select"
            value={selectedWeight}
            onChange={(e) => setSelectedWeight(e.target.value)}
            aria-label={`Select pack size for ${product.name}`}
          >
            {hasVariants
              ? product.availableVariants!.map((v) => (
                  <option key={v.weight} value={v.weight}>
                    {v.weight}
                  </option>
                ))
              : (
                  <option value={product.weight}>{product.weight}</option>
                )}
          </select>
          <ChevronDown size={12} className="product-variant-chevron" />
        </div>
        <h3 className="product-title-text" title={product.name}>
          {product.name}
        </h3>
      </div>

      <div className="product-bottom-row">
        <div className="product-price-column">
          <span className="current-price-val">₹{price}</span>
          {effectiveOriginal && <span className="original-price-val">₹{effectiveOriginal}</span>}
        </div>

        {product.inStock && (
          <div>
            {quantity === 0 ? (
              <button
                type="button"
                className="btn-add-action"
                onClick={() => addToCart(product.id, selectedWeight)}
              >
                ADD
              </button>
            ) : (
              <div className="qty-stepper-box">
                <button
                  type="button"
                  className="btn-stepper-sub"
                  onClick={() => removeFromCart(product.id, selectedWeight)}
                >
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className="stepper-qty-val">{quantity}</span>
                <button
                  type="button"
                  className="btn-stepper-sub"
                  onClick={() => addToCart(product.id, selectedWeight)}
                >
                  <Plus size={13} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
