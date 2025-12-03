import React from 'react';

// TODO: This is a basic skeleton. A production-ready implementation would
// involve more detailed and accurate skeleton components for each section.
const ProductDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded w-3/4 mb-6"></div>

      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Skeleton */}
          <div className="aspect-square bg-gray-200 dark:bg-secondary-700 rounded-lg"></div>

          {/* Product Info Skeleton */}
          <div>
            <div className="h-8 bg-gray-200 dark:bg-secondary-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-secondary-700 rounded w-1/2 mb-6"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded w-5/6"></div>
            </div>
            <div className="mt-8">
              <div className="h-12 bg-gray-200 dark:bg-secondary-700 rounded-lg w-40"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
