'use client';

import React from 'react';
import type { Product, Category } from '@prisma/client';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product & { category?: Category };
  showQuickAdd?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showQuickAdd = true }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const getStockBadge = () => {
    switch (product.stock_status) {
      case 'IN_STOCK':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold text-green-800 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold text-red-800 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  return (
    <div className="group border border-accent-200 rounded-lg shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300 h-full flex flex-col bg-white overflow-hidden">
      {/* Image Container - reduced height */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-accent-50 to-accent-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="rope-icon w-16 h-16 opacity-30"></div>
          </div>
        )}
        {/* Category Badge - inside image top-left */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-primary-800 bg-primary-100/90 backdrop-blur-sm rounded">
              {product.category.name}
            </span>
          </div>
        )}
        {/* Stock Badge - top-right */}
        <div className="absolute top-2 right-2">
          {getStockBadge()}
        </div>
        {/* Quick Add Button - visible on hover and focus-visible */}
        {showQuickAdd && product.stock_status !== 'OUT_OF_STOCK' && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 left-2 right-2 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg font-medium text-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1 focus:opacity-100 focus:translate-y-0"
            aria-label={`Add ${product.name} to cart`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Cart
          </button>
        )}
      </div>

      {/* Content - reduced padding */}
      <div className="p-3 flex-grow flex flex-col">
        <h3 className="text-sm font-bold text-accent-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-accent-500 mb-2 line-clamp-2">{product.description}</p>
        
        {/* Product Specs - compact icons only */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {product.material && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-accent-100 text-accent-600 rounded" title={product.material}>
              {product.material}
            </span>
          )}
          {product.diameter && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-accent-100 text-accent-600 rounded" title="Diameter">
              ⌀{product.diameter}mm
            </span>
          )}
          {product.strength_rating && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-accent-100 text-accent-600 rounded" title="Strength">
              ⚡{product.strength_rating}
            </span>
          )}
        </div>

        {/* Price - larger and more prominent */}
        <div className="mt-auto">
          <span className="text-xl font-bold text-primary-600">
            R{product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
