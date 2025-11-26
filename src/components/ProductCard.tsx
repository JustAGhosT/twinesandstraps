'use client';

import React, { useState } from 'react';
import type { Product, Category } from '@/types/database';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface ProductCardProps {
  product: Product & { category?: Category };
  showAddToCart?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showAddToCart = true }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const showPrices = useFeatureFlag('showPrices');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_status === 'OUT_OF_STOCK') return;

    setIsAdding(true);
    addToCart(product, quantity);
    setTimeout(() => {
      setIsAdding(false);
      setShowAdded(true);
      setQuantity(1);
      setTimeout(() => setShowAdded(false), 1500);
    }, 200);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(quantity + 1);
  };

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK';
  const getStockBadge = () => {
    switch (product.stock_status) {
      case 'IN_STOCK':
        return <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 h-full flex flex-col overflow-hidden group">
      {/* Category Label & Stock Badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
        {product.category && (
          <span className="text-xs font-medium text-primary-600">{product.category.name}</span>
        )}
        {getStockBadge()}
      </div>

      {/* Image Container */}
      <div className="aspect-[4/3] relative bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-grow flex flex-col">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2 flex-grow">{product.description}</p>
        
        {/* Specs Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {product.material && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {product.material}
            </span>
          )}
          {product.diameter && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              ⌀ {product.diameter}mm
            </span>
          )}
          {product.strength_rating && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              ⚡ {product.strength_rating}
            </span>
          )}
        </div>
        
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between mt-auto gap-2">
          {showPrices ? (
            <div className="flex flex-col">
              <span className="text-base font-bold text-primary-600">
                R{product.price.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400">per unit</span>
            </div>
          ) : (
            <a
              href="/quote"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Request Quote
            </a>
          )}
          {showAddToCart && showPrices && (
            <div className="flex items-center gap-1">
              {/* Decrement button */}
              <button
                onClick={handleDecrement}
                disabled={isOutOfStock || quantity <= 1}
                aria-label="Decrease quantity"
                className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-all ${
                  isOutOfStock || quantity <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
                }`}
              >
                −
              </button>
              
              {/* Quantity display */}
              <span className="w-6 text-center text-sm font-semibold text-gray-700">
                {quantity}
              </span>
              
              {/* Increment button */}
              <button
                onClick={handleIncrement}
                disabled={isOutOfStock}
                aria-label="Increase quantity"
                className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-all ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
                }`}
              >
                +
              </button>
              
              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={`relative px-3 py-1.5 rounded text-xs font-semibold transition-all ml-1 ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : showAdded
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
                }`}
              >
                {isAdding ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : showAdded ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
