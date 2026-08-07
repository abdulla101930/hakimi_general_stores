import React from 'react';
import { useApp } from '../context/AppContext';
import type { Product } from '../context/AppContext';
import { Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart, removeFromCart } = useApp();
  const quantity = cart[product.id] || 0;

  // Calculate discount percentage if original price exists
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Check if image is an emoji or URL
  const isEmoji = !product.image.startsWith('http') && !product.image.startsWith('/');

  return (
    <div className="product-card">
      {/* Discount Tag */}
      {discountPercent > 0 && product.inStock && (
        <span className="product-tag">{discountPercent}% OFF</span>
      )}

      {/* Image Container */}
      <div className="product-img-wrapper">
        {isEmoji ? (
          <span style={{ fontSize: '48px', userSelect: 'none' }}>
            {product.image}
          </span>
        ) : (
          <img 
            src={product.image} 
            alt={product.name} 
            className="product-img"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.style.fontSize = '48px';
                span.innerText = '🛍️';
                parent.appendChild(span);
              }
            }}
          />
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="out-of-stock-overlay">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Information & Dietary Symbol */}
      <div className="product-weight">{product.weight}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 6px' }}>
        {product.dietaryType === 'veg' && (
          <span className="dietary-badge veg" title="Vegetarian" />
        )}
        {product.dietaryType === 'non-veg' && (
          <span className="dietary-badge non-veg" title="Non-Vegetarian" />
        )}
        <h3 className="product-name" title={product.name} style={{ margin: 0 }}>
          {product.name}
        </h3>
      </div>

      {/* Price and Cart Buttons */}
      <div className="product-footer">
        <div className="price-container">
          <span className="price-current">₹{product.price}</span>
          {product.originalPrice && (
            <span className="price-original">₹{product.originalPrice}</span>
          )}
        </div>

        {product.inStock && (
          <div>
            {quantity === 0 ? (
              <button 
                className="btn-add-cart"
                onClick={() => addToCart(product.id)}
              >
                Add
              </button>
            ) : (
              <div className="qty-control">
                <button 
                  className="btn-qty"
                  onClick={() => removeFromCart(product.id)}
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className="qty-number">{quantity}</span>
                <button 
                  className="btn-qty"
                  onClick={() => addToCart(product.id)}
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
