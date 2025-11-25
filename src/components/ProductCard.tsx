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
        return <span className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 h-full flex flex-col overflow-hidden">
      {/* Image Container */}
      <div className="aspect-square relative bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
        {/* Stock Badge - top-right */}
        <div className="absolute top-3 right-3">
          {getStockBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-grow">{product.description}</p>
        
        {/* Price */}
        <div className="mt-auto">
          <span className="text-lg font-bold text-gray-900">
            ZAR {product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
