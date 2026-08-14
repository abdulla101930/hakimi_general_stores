import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { cartKeyOf, getProductOriginalPrice, getProductPrice } from '../lib/cart';
import type { Product } from '../types';
import { Minus, Plus, X } from 'lucide-react';

interface QtyPickerSheetProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function QtyPickerSheet({ product, open, onClose }: QtyPickerSheetProps) {
  const { cart, addToCart, removeFromCart } = useApp();

  if (!open) return null;

  const variants =
    product.availableVariants && product.availableVariants.length > 0
      ? product.availableVariants
      : [{ weight: product.weight, price: product.price, originalPrice: product.originalPrice }];

  const isEmoji = !product.image.startsWith('http') && !product.image.startsWith('/');
  const totalQty = variants.reduce((sum, v) => sum + (cart[cartKeyOf(product.id, v.weight)] || 0), 0);

  return createPortal(
    <div className="qty-sheet-backdrop" onClick={onClose}>
      <div className="qty-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="qty-sheet-handle" />

        <div className="qty-sheet-header">
          <div className="qty-sheet-title-row">
            {isEmoji ? (
              <span className="qty-sheet-emoji">{product.image}</span>
            ) : (
              <img src={product.image} alt={product.name} className="qty-sheet-img" />
            )}
            <div className="qty-sheet-title-col">
              <h3 className="qty-sheet-name">{product.name}</h3>
              <span className="qty-sheet-sub">Select pack size &amp; quantity</span>
            </div>
            <button type="button" className="qty-sheet-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="qty-sheet-variants">
          {variants.map((v) => {
            const qty = cart[cartKeyOf(product.id, v.weight)] || 0;
            const price = getProductPrice(product, v.weight);
            const orig = getProductOriginalPrice(product, v.weight);
            return (
              <div key={v.weight} className={`qty-sheet-variant-row ${qty > 0 ? 'selected' : ''}`}>
                <div className="qty-sheet-variant-info">
                  <span className="qty-sheet-variant-weight">{v.weight}</span>
                  <span className="qty-sheet-variant-price">
                    ₹{price}
                    {orig && orig > price && <span className="original-price-val qty-sheet-orig">₹{orig}</span>}
                  </span>
                </div>
                <div className="qty-stepper-box qty-sheet-stepper">
                  <button
                    type="button"
                    className="btn-stepper-sub"
                    onClick={() => removeFromCart(product.id, v.weight)}
                    aria-label={`Decrease ${v.weight}`}
                  >
                    <Minus size={13} strokeWidth={3} />
                  </button>
                  <span className="stepper-qty-val">{qty}</span>
                  <button
                    type="button"
                    className="btn-stepper-sub"
                    onClick={() => addToCart(product.id, v.weight)}
                    aria-label={`Increase ${v.weight}`}
                  >
                    <Plus size={13} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="qty-sheet-footer">
          <button type="button" className="btn-add-action qty-sheet-add-btn" onClick={onClose}>
            {totalQty > 0 ? `Add to Cart (${totalQty})` : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
