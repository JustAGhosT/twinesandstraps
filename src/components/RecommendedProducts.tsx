'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@prisma/client';
import { useCart } from '@/contexts/CartContext';

interface RecommendedProductsProps {
  title?: string;
  maxProducts?: number;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  title = 'Popular Products',
  maxProducts = 4
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/products/featured')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        setProducts(data.slice(0, maxProducts));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching recommended products:', error);
        setLoading(false);
      });
  }, [maxProducts]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(maxProducts)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-3">
              <div className="aspect-square bg-gray-200 rounded mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href={`/products/${product.id}`}>
              <div className="aspect-square relative bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/products/${product.id}`}>
                <h4 className="text-sm font-medium text-gray-900 line-clamp-1 hover:text-primary-600">
                  {product.name}
                </h4>
              </Link>
              <p className="text-sm font-bold text-primary-600 mt-1">R{product.price.toFixed(2)}</p>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock_status === 'OUT_OF_STOCK'}
                className={`w-full mt-2 py-1.5 px-3 rounded text-xs font-medium transition-all ${
                  product.stock_status === 'OUT_OF_STOCK'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : addedId === product.id
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {product.stock_status === 'OUT_OF_STOCK'
                  ? 'Out of Stock'
                  : addedId === product.id
                  ? 'Added!'
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProducts;
