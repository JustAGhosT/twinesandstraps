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
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-100 rounded-full">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Out of Stock</span>;
      default:
        return null;
    }
  };

  return (
    <div className="group border border-accent-200 rounded-xl p-4 shadow-sm hover:shadow-xl hover:border-primary-300 transition-all duration-300 h-full flex flex-col bg-white hover:-translate-y-1">
      {/* Image Container */}
      <div className="aspect-square mb-4 relative overflow-hidden rounded-lg bg-gradient-to-br from-accent-50 to-accent-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="rope-icon w-24 h-24 opacity-40"></div>
            <span className="text-accent-400 text-sm mt-2">No Image</span>
          </div>
        )}
        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          {getStockBadge()}
        </div>
        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="inline-block px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-full border border-primary-200">
              {product.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className="text-lg font-bold text-accent-900 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-accent-600 mb-3 line-clamp-2">{product.description}</p>
        
        {/* Product Specs */}
        <div className="flex flex-wrap gap-2 mb-3">
          {product.material && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              {product.material}
            </span>
          )}
          {product.diameter && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {product.diameter}mm
            </span>
          )}
          {product.strength_rating && (
            <span className="inline-flex items-center px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {product.strength_rating}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="mt-auto pt-4 border-t border-accent-100">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            R{product.price.toFixed(2)}
          </span>
          <span className="text-xs text-accent-500">per unit</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
