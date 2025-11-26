'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { redirect } from 'next/navigation';

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isEnabled = useFeatureFlag('wishlist');

  // Redirect if feature is disabled
  if (!isEnabled) {
    redirect('/');
  }

  const handleMoveToCart = (product: typeof items[0]) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Your Wishlist</h1>
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon on product pages.</p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Wishlist</h1>
          <button
            onClick={clearWishlist}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {items.map((product) => (
              <div key={product.id} className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
                {/* Product Image */}
                <Link href={`/products/${product.id}`} className="shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 relative bg-gray-100 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-secondary-900 hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  {product.sku && (
                    <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                  )}
                  <p className="text-lg font-bold text-primary-600 mt-2">
                    R{product.price.toFixed(2)}
                  </p>
                  <p className={`text-sm mt-1 ${
                    product.stock_status === 'OUT_OF_STOCK' ? 'text-red-600' :
                    product.stock_status === 'LOW_STOCK' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {product.stock_status === 'OUT_OF_STOCK' ? 'Out of Stock' :
                     product.stock_status === 'LOW_STOCK' ? 'Low Stock' : 'In Stock'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    disabled={product.stock_status === 'OUT_OF_STOCK'}
                    className="flex-1 md:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Move to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/products"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
