import React from 'react';
import type { Product } from '@prisma/client';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-w-1 aspect-h-1">
          {/* Placeholder for a larger image */}
          <div className="bg-gray-200 w-full h-full flex items-center justify-center">
            <span className="text-gray-500">Image</span>
          </div>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-xl text-gray-800 mb-4">ZAR {product.price.toFixed(2)}</p>
        <p className="text-gray-600 mb-6">{product.description}</p>
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Specifications</h3>
          <ul className="list-disc list-inside">
            {product.material && <li>Material: {product.material}</li>}
            {product.diameter && <li>Diameter: {product.diameter}mm</li>}
            {product.length && <li>Length: {product.length}m</li>}
            {product.strength_rating && <li>Strength Rating: {product.strength_rating}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductView;
