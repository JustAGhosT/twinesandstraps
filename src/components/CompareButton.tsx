'use client';

import React from 'react';
import { useCompare } from '@/contexts/CompareContext';
import { useToast } from '@/components/Toast';
import type { ProductWithCategory } from '@/types/database';

interface CompareButtonProps {
  product: ProductWithCategory;
  variant?: 'icon' | 'button';
  className?: string;
}

const CompareButton: React.FC<CompareButtonProps> = ({
  product,
  variant = 'icon',
  className = '',
}) => {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  const { warning } = useToast();
  const isComparing = isInCompare(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComparing) {
      removeFromCompare(product.id);
    } else {
      if (!canAddMore()) {
        warning('You can compare up to 4 products. Remove one to add another.');
        return;
      }
      addToCompare(product);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isComparing
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
        } ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {isComparing ? 'Remove from Compare' : 'Compare'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors ${
        isComparing
          ? 'bg-blue-50 text-blue-500 hover:bg-blue-100'
          : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-secondary-600 hover:text-blue-500'
      } ${className}`}
      title={isComparing ? 'Remove from compare' : 'Add to compare'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </button>
  );
};

export default CompareButton;
