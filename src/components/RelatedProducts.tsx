'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product, ProductWithCategory } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { STOCK_STATUS, STOCK_STATUS_LABELS } from '@/constants';

interface RelatedProductsProps {
  products: ProductWithCategory[];
  title?: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  title = 'Related Products'
}) => {
  const { addToCart } = useCart();
  const [addedId, setAddedId] = React.useState<number | null>(null);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (products.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
          >
            <div className="aspect-square relative bg-gray-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
              {product.stock_status === STOCK_STATUS.LOW_STOCK && (
                <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                  {STOCK_STATUS_LABELS[STOCK_STATUS.LOW_STOCK]}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                {product.name}
              </h3>
              {product.category && (
                <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary-600">R{product.price.toFixed(2)}</span>
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={product.stock_status === STOCK_STATUS.OUT_OF_STOCK}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    product.stock_status === STOCK_STATUS.OUT_OF_STOCK
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : addedId === product.id
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {product.stock_status === STOCK_STATUS.OUT_OF_STOCK
                    ? 'Out'
                    : addedId === product.id
                    ? '✓'
                    : 'Add'}
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
