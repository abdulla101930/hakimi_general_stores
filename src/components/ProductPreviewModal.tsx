import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { cartKeyOf, getProductOriginalPrice, getProductPrice, isImageSrc } from '../lib/cart';
import type { Product } from '../types';
import { X, Plus, Minus, Heart, ShoppingBag } from 'lucide-react';

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (p: Product) => void;
}

export function ProductPreviewModal({ product, isOpen, onClose, onSelectProduct }: ProductPreviewModalProps) {
  const { customerCatalog, cart, addToCart, removeFromCart } = useApp();
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedWeight(product.weight);
      setIsLiked(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const price = getProductPrice(product, selectedWeight || product.weight);
  const originalPrice = getProductOriginalPrice(product, selectedWeight || product.weight);
  const effectiveOriginal = originalPrice && originalPrice > price ? originalPrice : undefined;
  const discountPercent = effectiveOriginal
    ? Math.round(((effectiveOriginal - price) / effectiveOriginal) * 100)
    : 0;

  const hasVariants = Array.isArray(product.availableVariants) && product.availableVariants.length > 0;
  const variantsList = hasVariants ? product.availableVariants! : [{ weight: product.weight, price: product.price }];

  const quantity = cart[cartKeyOf(product.id, selectedWeight || product.weight)] || 0;
  const isEmoji = !isImageSrc(product.image);

  // Find recommendations from the same main/sub category (SS2 "People also bought")
  const relatedProducts = customerCatalog.filter(
    (item) =>
      item.id !== product.id &&
      (item.subCategory === product.subCategory || item.mainCategory === product.mainCategory)
  ).slice(0, 10);

  return (
    <div className="product-preview-backdrop" onClick={onClose}>
      <div className="product-preview-modal-sheet" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Control Bar */}
        <div className="preview-top-bar">
          <button type="button" className="preview-close-btn" onClick={onClose} aria-label="Close preview">
            <X size={20} color="#1e293b" />
          </button>
          <div className="preview-top-actions">
            <button
              type="button"
              className="preview-heart-btn"
              onClick={() => setIsLiked(!isLiked)}
              title="Favorite"
            >
              <Heart size={18} color={isLiked ? '#ef4444' : '#64748b'} fill={isLiked ? '#ef4444' : 'none'} />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="preview-scroll-content">
          
          {/* SS1 Hero Product Image Showcase */}
          <div className="preview-hero-image-wrap">
            {discountPercent > 0 && product.inStock && (
              <span className="preview-discount-tag">{discountPercent}% OFF</span>
            )}
            
            {product.dietaryType === 'veg' && (
              <div className="preview-veg-badge-corner" title="Vegetarian">
                <span className="veg-dot" />
              </div>
            )}
            {product.dietaryType === 'non-veg' && (
              <div className="preview-veg-badge-corner non-veg" title="Non-Vegetarian">
                <span className="nonveg-dot" />
              </div>
            )}

            {isEmoji ? (
              <span className="preview-hero-emoji">{product.image}</span>
            ) : (
              <img
                src={product.image}
                alt={product.name}
                className="preview-hero-img"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.className = 'preview-hero-emoji';
                    span.textContent = '🛍️';
                    parent.appendChild(span);
                  }
                }}
              />
            )}

            {!product.inStock && <div className="preview-out-badge">OUT OF STOCK</div>}
          </div>

          {/* SS1 Serve Size / Pack Size Selector Block */}
          <div className="preview-serve-size-card">
            <div className="serve-size-header">
              <span className="serve-size-label">Serve Size</span>
            </div>
            
            <div className="serve-size-chips-row">
              {variantsList.map((v) => {
                const isSelected = (selectedWeight || product.weight) === v.weight;
                return (
                  <button
                    key={v.weight}
                    type="button"
                    className={`serve-size-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedWeight(v.weight)}
                  >
                    <span className="size-chip-weight">{v.weight}</span>
                    <span className="size-chip-price">₹{v.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SS1 Product Title & Price Row */}
          <div className="preview-product-details-block">
            <h2 className="preview-product-name">{product.name}</h2>
            <div className="preview-price-row">
              <div className="preview-price-left">
                <span className="preview-current-price">₹{price}</span>
                {effectiveOriginal && (
                  <span className="preview-mrp-price">MRP ₹{effectiveOriginal}</span>
                )}
              </div>
              <span className="preview-tax-inclusive">(Inclusive of all taxes)</span>
            </div>
          </div>

          {/* SS2 Horizontal Carousel ("People also bought") */}
          {relatedProducts.length > 0 && (
            <div className="related-carousel-section">
              <div className="related-carousel-header">
                <h3>People also bought</h3>
                <span className="related-sub-text">Recommended items from this category</span>
              </div>

              <div className="related-carousel-scroll">
                {relatedProducts.map((relItem) => {
                  const relPrice = relItem.price;
                  const relQty = cart[cartKeyOf(relItem.id, relItem.weight)] || 0;
                  const relIsEmoji = !isImageSrc(relItem.image);
                  const relHasMulti = Array.isArray(relItem.availableVariants) && relItem.availableVariants.length > 1;

                  return (
                    <div
                      key={relItem.id}
                      className="ss2-carousel-card"
                      onClick={() => onSelectProduct ? onSelectProduct(relItem) : null}
                    >
                      <div className="ss2-card-img-wrap">
                        {relItem.dietaryType === 'veg' && (
                          <div className="ss2-veg-icon">
                            <span className="veg-dot" />
                          </div>
                        )}
                        {relIsEmoji ? (
                          <span className="ss2-card-emoji">{relItem.image}</span>
                        ) : (
                          <img src={relItem.image} alt={relItem.name} className="ss2-card-img" />
                        )}
                      </div>

                      <div className="ss2-card-mid-row">
                        <span className="ss2-card-weight">{relItem.weight}</span>
                        
                        {relItem.inStock && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {relQty === 0 ? (
                              <button
                                type="button"
                                className="ss2-add-btn"
                                onClick={() => addToCart(relItem.id, relItem.weight)}
                              >
                                ADD
                                {relHasMulti && <span className="options-badge">{relItem.availableVariants!.length} options</span>}
                              </button>
                            ) : (
                              <div className="ss2-qty-stepper">
                                <button type="button" onClick={() => removeFromCart(relItem.id, relItem.weight)}>
                                  <Minus size={11} strokeWidth={3} />
                                </button>
                                <span>{relQty}</span>
                                <button type="button" onClick={() => addToCart(relItem.id, relItem.weight)}>
                                  <Plus size={11} strokeWidth={3} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ss2-card-price">₹{relPrice}</div>
                      <h4 className="ss2-card-title">{relItem.name}</h4>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SS1 Sticky Bottom Action Bar */}
        <div className="preview-sticky-bottom-bar">
          <div className="preview-bottom-price-col">
            <span className="bottom-total-val">₹{price * (quantity || 1)}</span>
            <span className="bottom-pack-size">Selected: {selectedWeight || product.weight}</span>
          </div>

          {product.inStock ? (
            <div>
              {quantity === 0 ? (
                <button
                  type="button"
                  className="preview-btn-add-main"
                  onClick={() => addToCart(product.id, selectedWeight || product.weight)}
                >
                  <ShoppingBag size={16} />
                  <span>ADD TO CART</span>
                </button>
              ) : (
                <div className="preview-stepper-main">
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id, selectedWeight || product.weight)}
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="preview-qty-val">{quantity} in cart</span>
                  <button
                    type="button"
                    onClick={() => addToCart(product.id, selectedWeight || product.weight)}
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="preview-btn-out" disabled>
              OUT OF STOCK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
