'use client';

import React from 'react';

interface ProductSkeletonProps {
  count?: number;
}

const ProductSkeleton: React.FC<ProductSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
        >
          {/* Category Label & Stock Badge */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>

          {/* Image Container */}
          <div className="aspect-[4/3] bg-gray-200" />

          {/* Content */}
          <div className="p-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-full bg-gray-200 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-200 rounded mb-3" />

            {/* Specs Badges */}
            <div className="flex flex-wrap gap-1 mb-3">
              <div className="h-5 w-16 bg-gray-200 rounded" />
              <div className="h-5 w-12 bg-gray-200 rounded" />
            </div>

            {/* Price and Button */}
            <div className="flex items-center justify-between mt-auto">
              <div>
                <div className="h-5 w-20 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-12 bg-gray-200 rounded" />
              </div>
              <div className="h-7 w-14 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductSkeleton;
