'use client';

import React, { useState } from 'react';
import type { Product } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton';
import CompareButton from '@/components/CompareButton';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface ProductViewProps {
  product: Product;
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

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowAddedToCart(true);
    setTimeout(() => setShowAddedToCart(false), 3000);
  };

  const getStockBadge = () => {
    switch (product.stock_status) {
      case 'IN_STOCK':
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK';

  return (
    <>
      {/* Image Zoom Modal */}
      {isZoomed && product.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
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
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div
            className={`aspect-square bg-gray-200 dark:bg-secondary-700 rounded-lg flex items-center justify-center relative overflow-hidden ${product.image_url ? 'cursor-zoom-in group' : ''}`}
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
                />
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Click to zoom
                </div>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-lg">No Image Available</span>
            )}
          </div>
        </div>
      <div>
        <div className="mb-4">
          {getStockBadge()}
        </div>
        <h1 className="text-3xl font-bold mb-4 text-secondary-900 dark:text-white">{product.name}</h1>
        {showPrices ? (
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">ZAR {product.price.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <a
              href="/quote"
              className="inline-block px-6 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              Request Quote for Pricing
            </a>
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{product.description}</p>
        
        {/* Quantity Selector and Add to Cart */}
        <div className="mb-6 pb-6 border-b dark:border-secondary-700">
          <label className="block text-sm font-semibold mb-2 text-secondary-900 dark:text-white">Quantity</label>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border dark:border-secondary-600 rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-white transition-colors"
                disabled={isOutOfStock || !showPrices}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x dark:border-secondary-600 py-2 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                min="1"
                disabled={isOutOfStock || !showPrices}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-white transition-colors"
                disabled={isOutOfStock || !showPrices}
              >
                +
              </button>
            </div>
            {showPrices && quantity > 1 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            )}
            <a
              href="/quote"
              className={`${showPrices ? 'flex-1' : 'w-full'} py-3 px-6 rounded-lg font-semibold border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors text-center`}
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
              ✓ Added to cart successfully!
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="border-t dark:border-secondary-700 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white">Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">SKU</span>
              <p className="font-semibold text-secondary-900 dark:text-white">{product.sku}</p>
            </div>
            {product.material && (
              <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">Material</span>
                <p className="font-semibold text-secondary-900 dark:text-white">{product.material}</p>
              </div>
            )}
            {product.diameter && (
              <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">Diameter</span>
                <p className="font-semibold text-secondary-900 dark:text-white">{product.diameter}mm</p>
              </div>
            )}
            {product.length && (
              <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">Length</span>
                <p className="font-semibold text-secondary-900 dark:text-white">{product.length}m</p>
              </div>
            )}
            {product.strength_rating && (
              <div className="bg-gray-50 dark:bg-secondary-700 p-3 rounded">
                <span className="text-sm text-gray-600 dark:text-gray-400">Strength Rating</span>
                <p className="font-semibold text-secondary-900 dark:text-white">{product.strength_rating}</p>
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
