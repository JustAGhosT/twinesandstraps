'use client';

import React from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import type { Product } from '@/types/database';

interface WishlistButtonProps {
  product: Product;
  variant?: 'icon' | 'button';
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  product,
  variant = 'icon',
  className = '',
}) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isWishlisted
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
        } ${className}`}
      >
        <svg
          className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
          fill={isWishlisted ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors ${
        isWishlisted
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-secondary-600 hover:text-red-500'
      } ${className}`}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
        fill={isWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
};

export default WishlistButton;
