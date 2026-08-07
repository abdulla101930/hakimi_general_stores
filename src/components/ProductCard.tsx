import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Product } from '../context/AppContext';
import { Plus, Minus, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, removeFromCart } = useApp();
  const quantity = cart[product.id] || 0;
  const [isLiked, setIsLiked] = useState(false);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isEmoji = !product.image.startsWith('http') && !product.image.startsWith('/');

  return (
    <div className="product-card">
      {/* Image Container with Badges */}
      <div className="product-img-container" style={{ position: 'relative' }}>
        {/* Heart Wishlist Button */}
        <button
          type="button"
          onClick={() => setIsLiked(!isLiked)}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            zIndex: 3,
            background: 'rgba(255, 255, 255, 0.85)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          title="Save for later"
        >
          <Heart size={14} color={isLiked ? '#ef4444' : '#64748b'} fill={isLiked ? '#ef4444' : 'none'} />
        </button>
        {/* Discount Badge */}
        {discountPercent > 0 && product.inStock && (
          <span className="discount-pill">{discountPercent}% OFF</span>
        )}

        {/* Dietary Corner Indicator */}
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
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.className = 'product-emoji-render';
                span.innerText = '🛍️';
                parent.appendChild(span);
              }
            }}
          />
        )}

        {!product.inStock && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800,
            color: '#ef4444'
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="product-info-box">
        <span className="product-weight-tag">{product.weight}</span>
        <h3 className="product-title-text" title={product.name}>
          {product.name}
        </h3>
      </div>

      {/* Price & Action Row */}
      <div className="product-bottom-row">
        <div className="product-price-column">
          <span className="current-price-val">₹{product.price}</span>
          {product.originalPrice && (
            <span className="original-price-val">₹{product.originalPrice}</span>
          )}
        </div>

        {product.inStock && (
          <div>
            {quantity === 0 ? (
              <button 
                type="button"
                className="btn-add-action"
                onClick={() => addToCart(product.id)}
              >
                ADD
              </button>
            ) : (
              <div className="qty-stepper-box">
                <button 
                  type="button"
                  className="btn-stepper-sub"
                  onClick={() => removeFromCart(product.id)}
                >
                  <Minus size={13} strokeWidth={3} />
                </button>
                <span className="stepper-qty-val">{quantity}</span>
                <button 
                  type="button"
                  className="btn-stepper-sub"
                  onClick={() => addToCart(product.id)}
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
};
