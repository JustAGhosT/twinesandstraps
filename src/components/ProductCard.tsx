import React from 'react';
import type { Product } from '@prisma/client';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getStockBadge = () => {
    switch (product.stock_status) {
      case 'IN_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col bg-white">
      <div className="aspect-square mb-4 relative">
        {/* Placeholder for an image */}
        <div className="bg-gray-200 w-full h-full flex items-center justify-center rounded">
          <span className="text-gray-500">Image</span>
        </div>
        <div className="absolute top-2 right-2">
          {getStockBadge()}
        </div>
      </div>
      <div className="flex-grow">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">ZAR {product.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
