'use client';

import React from 'react';
import type { Product, Category } from '@prisma/client';
import Image from 'next/image';

interface ProductCardProps {
  product: Product & { category?: Category };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-primary-600">
            R{product.price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400">per unit</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
