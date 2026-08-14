import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Product } from '../types';
import { Plus, Minus, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useApp();
  const quantity = cart[product.id] || 0;
  const [isLiked, setIsLiked] = useState(false);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isEmoji = !product.image.startsWith('http') && !product.image.startsWith('/');

  return (
    <div className="product-card">
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
        <span className="product-weight-tag">{product.weight}</span>
        <h3 className="product-title-text" title={product.name}>
          {product.name}
        </h3>
      </div>

      <div className="product-bottom-row">
        <div className="product-price-column">
          <span className="current-price-val">₹{product.price}</span>
          {product.originalPrice && <span className="original-price-val">₹{product.originalPrice}</span>}
        </div>

        {product.inStock && (
          <div>
            {quantity === 0 ? (
              <button type="button" className="btn-add-action" onClick={() => addToCart(product.id)}>
                ADD
              </button>
            ) : (
              <div className="qty-stepper-box">
                <button type="button" className="btn-stepper-sub" onClick={() => removeFromCart(product.id)}>
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className="stepper-qty-val">{quantity}</span>
                <button type="button" className="btn-stepper-sub" onClick={() => addToCart(product.id)}>
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
