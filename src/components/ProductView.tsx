'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ProductWithCategory } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton';
import CompareButton from '@/components/CompareButton';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { STOCK_STATUS, STOCK_STATUS_LABELS, ROUTES, TIMEOUTS, SUCCESS_MESSAGES } from '@/constants';
import { trackViewItem } from '@/lib/analytics';
import { getProductImageBlur } from '@/lib/utils/image-blur';

interface ProductViewProps {
  product: ProductWithCategory;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const { addToCart } = useCart();
  const totalPrice = product.price * quantity;
  const showWishlist = useFeatureFlag('wishlist');
  const showCompare = useFeatureFlag('compareProducts');
  const showPrices = useFeatureFlag('showPrices');
  const modalRef = useRef<HTMLDivElement>(null);

  // Track product view
  useEffect(() => {
    trackViewItem({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category?.name,
    });
  }, [product.id, product.name, product.price, product.category?.name]);

  useEffect(() => {
    if (isZoomed) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsZoomed(false);
        } else if (event.key === 'Tab') {
          // Focus trapping logic
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) {
              // Shift + Tab
              if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
              }
            } else {
              // Tab
              if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus(); // Focus the modal container itself

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isZoomed]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), TIMEOUTS.STATUS_MESSAGE_DURATION);
  };

  const getStockBadge = () => {
    switch (product.stock_status) {
      case STOCK_STATUS.IN_STOCK:
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded dark:bg-green-900/30 dark:text-green-300">{STOCK_STATUS_LABELS.IN_STOCK}</span>;
      case STOCK_STATUS.LOW_STOCK:
        return (
          <div className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded dark:bg-yellow-900/30 dark:text-yellow-300">{STOCK_STATUS_LABELS.LOW_STOCK}</span>
            <span className="inline-block px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded dark:bg-red-900/30 dark:text-red-300 animate-pulse">
              ⚠️ Only a few left!
            </span>
          </div>
        );
      case STOCK_STATUS.OUT_OF_STOCK:
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded dark:bg-red-900/30 dark:text-red-300">{STOCK_STATUS_LABELS.OUT_OF_STOCK}</span>;
      default:
        return null;
    }
  };

  const isOutOfStock = product.stock_status === STOCK_STATUS.OUT_OF_STOCK;

  return (
    <>
      {/* Image Zoom Modal */}
      {isZoomed && product.image_url && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed Product Image"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close zoom"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative w-full max-w-4xl aspect-square">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={getProductImageBlur()}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div
            className={`aspect-square rounded-lg flex items-center justify-center relative overflow-hidden ${product.image_url ? 'cursor-zoom-in group' : 'no-image-placeholder'}`}
            onClick={() => product.image_url && setIsZoomed(true)}
          >
            {product.image_url ? (
              <>
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  placeholder="blur"
                  blurDataURL={getProductImageBlur()}
                />
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Click to zoom
                </div>
              </>
            ) : (
              <span>No Image Available</span>
            )}
          </div>
        </div>
      <div>
        <div className="mb-4">
          {getStockBadge()}
        </div>
        <h1 className="text-3xl font-bold mb-4 text-foreground">{product.name}</h1>
        {showPrices ? (
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-foreground">ZAR {product.price.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <a
              href={ROUTES.QUOTE}
              className="inline-block px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              Request Quote for Pricing
            </a>
          </div>
        )}
        <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
        
        {/* Quantity Selector and Add to Cart */}
        <div className="mb-6 pb-6 border-b">
          <label className="block text-sm font-semibold mb-2 text-foreground">Quantity</label>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-accent text-accent-foreground transition-colors"
                disabled={isOutOfStock || !showPrices}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x py-2 bg-transparent text-foreground"
                min="1"
                disabled={isOutOfStock || !showPrices}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-accent text-accent-foreground transition-colors"
                disabled={isOutOfStock || !showPrices}
              >
                +
              </button>
            </div>
            {showPrices && quantity > 1 && (
              <div className="text-sm text-muted-foreground">
                <p>Total: ZAR {totalPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {showPrices && (
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  isOutOfStock
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            )}
            <a
              href={ROUTES.QUOTE}
              className={`${showPrices ? 'flex-1' : 'w-full'} py-3 px-6 rounded-lg font-semibold border-2 border-primary text-primary hover:bg-primary/10 transition-colors text-center`}
            >
              Request Quote
            </a>
          </div>
          {/* Wishlist and Compare Buttons */}
          {(showWishlist || showCompare) && (
            <div className="flex gap-2 mt-3">
              {showWishlist && <WishlistButton product={product} variant="button" />}
              {showCompare && <CompareButton product={product} variant="button" />}
            </div>
          )}
          {showAddedToCart && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-semibold">
              {SUCCESS_MESSAGES.ADDED_TO_CART}
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-accent p-3 rounded">
              <span className="text-sm text-muted-foreground">SKU</span>
              <p className="font-semibold text-foreground">{product.sku}</p>
            </div>
            {product.material && (
              <div className="bg-accent p-3 rounded">
                <span className="text-sm text-muted-foreground">Material</span>
                <p className="font-semibold text-foreground">{product.material}</p>
              </div>
            )}
            {product.diameter && (
              <div className="bg-accent p-3 rounded">
                <span className="text-sm text-muted-foreground">Diameter</span>
                <p className="font-semibold text-foreground">{product.diameter}mm</p>
              </div>
            )}
            {product.length && (
              <div className="bg-accent p-3 rounded">
                <span className="text-sm text-muted-foreground">Length</span>
                <p className="font-semibold text-foreground">{product.length}m</p>
              </div>
            )}
            {product.strength_rating && (
              <div className="bg-accent p-3 rounded">
                <span className="text-sm text-muted-foreground">Strength Rating</span>
                <p className="font-semibold text-foreground">{product.strength_rating}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProductView;
