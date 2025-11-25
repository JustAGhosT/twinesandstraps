'use client';

import React, { useState } from 'react';
import type { Product } from '@prisma/client';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const totalPrice = product.price * quantity;

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <span className="text-gray-500 text-lg">No Image Available</span>
          )}
        </div>
      </div>
      <div>
        <div className="mb-4">
          {getStockBadge()}
        </div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-gray-900">ZAR {product.price.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
        
        {/* Quantity Selector and Add to Cart */}
        <div className="mb-6 pb-6 border-b">
          <label className="block text-sm font-semibold mb-2">Quantity</label>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border rounded">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                disabled={isOutOfStock}
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x py-2"
                min="1"
                disabled={isOutOfStock}
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                disabled={isOutOfStock}
              >
                +
              </button>
            </div>
            {quantity > 1 && (
              <div className="text-sm text-gray-600">
                <p>Total: ZAR {totalPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                isOutOfStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <a 
              href="/quote"
              className="flex-1 py-3 px-6 rounded-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors text-center"
            >
              Request Quote
            </a>
          </div>
          {showAddedToCart && (
            <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-semibold">
              ✓ Added to cart successfully!
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">SKU</span>
              <p className="font-semibold">{product.sku}</p>
            </div>
            {product.material && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Material</span>
                <p className="font-semibold">{product.material}</p>
              </div>
            )}
            {product.diameter && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Diameter</span>
                <p className="font-semibold">{product.diameter}mm</p>
              </div>
            )}
            {product.length && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Length</span>
                <p className="font-semibold">{product.length}m</p>
              </div>
            )}
            {product.strength_rating && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Strength Rating</span>
                <p className="font-semibold">{product.strength_rating}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductView;
