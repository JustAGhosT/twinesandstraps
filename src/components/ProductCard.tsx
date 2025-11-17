import React from 'react';
import type { Product } from '@prisma/client';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-w-1 aspect-h-1 mb-4">
        {/* Placeholder for an image */}
        <div className="bg-gray-200 w-full h-full flex items-center justify-center">
          <span className="text-gray-500">Image</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <p className="text-gray-600">ZAR {product.price.toFixed(2)}</p>
    </div>
  );
};

export default ProductCard;
