'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompare } from '@/contexts/CompareContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const CompareBar: React.FC = () => {
  const { items, removeFromCompare, clearCompare, maxItems } = useCompare();
  const isEnabled = useFeatureFlag('compareProducts');

  if (!isEnabled || items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Compare ({items.length}/{maxItems}):
            </span>
            <div className="flex gap-2">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 group"
                >
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear
            </button>
            <Link
              href="/compare"
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                items.length >= 2
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              onClick={(e) => items.length < 2 && e.preventDefault()}
            >
              Compare Now
            </Link>
          </div>
        </div>
        {items.length < 2 && (
          <p className="text-xs text-gray-500 mt-2">Add at least 2 products to compare</p>
        )}
      </div>
    </div>
  );
};

export default CompareBar;
