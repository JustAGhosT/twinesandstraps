'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts/CartContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function ComparePage() {
  const router = useRouter();
  const { items, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const isEnabled = useFeatureFlag('compareProducts');

  // Redirect if feature is disabled
  useEffect(() => {
    if (!isEnabled) {
      router.push('/');
    }
  }, [isEnabled, router]);

  // Show nothing while redirecting
  if (!isEnabled) {
    return null;
  }

  if (items.length < 2) {
    return (
      <div className="bg-gray-50 dark:bg-secondary-900 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Compare Products</h1>
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-8 md:p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Not enough products to compare</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {items.length === 0
                ? 'Add products to compare by clicking the compare icon on product pages.'
                : 'Add at least one more product to start comparing.'}
            </p>
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

  // Get all unique attribute keys for comparison
  const attributes = [
    { key: 'price', label: 'Price', format: (v: number) => `R${v.toFixed(2)}` },
    { key: 'sku', label: 'SKU', format: (v: string) => v || '-' },
    { key: 'material', label: 'Material', format: (v: string) => v || '-' },
    { key: 'diameter', label: 'Diameter', format: (v: number | null) => v ? `${v}mm` : '-' },
    { key: 'length', label: 'Length', format: (v: number | null) => v ? `${v}m` : '-' },
    { key: 'weight', label: 'Weight', format: (v: number | null) => v ? `${v}kg` : '-' },
    { key: 'stock_status', label: 'Availability', format: (v: string) => {
      switch (v) {
        case 'IN_STOCK': return 'In Stock';
        case 'LOW_STOCK': return 'Low Stock';
        case 'OUT_OF_STOCK': return 'Out of Stock';
        default: return v || '-';
      }
    }},
    { key: 'category', label: 'Category', format: (v: { name: string } | undefined) => v?.name || '-' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-secondary-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Compare Products</h1>
          <button
            onClick={clearCompare}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-secondary-700">
                <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400 w-40">Product</th>
                {items.map((product) => (
                  <th key={product.id} className="p-4 text-center">
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        title="Remove from comparison"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <Link href={`/products/${product.id}`}>
                        <div className="w-32 h-32 mx-auto relative bg-gray-100 dark:bg-secondary-700 rounded-lg overflow-hidden mb-3">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                              No Image
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-secondary-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm">
                          {product.name}
                        </h3>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, index) => (
                <tr key={attr.key} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-secondary-700/50' : 'dark:bg-secondary-800'}>
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300">{attr.label}</td>
                  {items.map((product) => {
                    const value = (product as unknown as Record<string, unknown>)[attr.key];
                    return (
                      <td key={product.id} className="p-4 text-center text-secondary-900 dark:text-white">
                        <span className={attr.key === 'price' ? 'font-bold text-primary-600 dark:text-primary-400' : ''}>
                          {attr.format(value as never)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-gray-200 dark:border-secondary-700">
                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">Action</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    <button
                      onClick={() => addToCart(product, 1)}
                      disabled={product.stock_status === 'OUT_OF_STOCK'}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Add to Cart
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Link
            href="/products"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
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
