'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Product, Category } from '@prisma/client';

type ProductWithCategory = Product & { category?: Category };

interface CompareContextType {
  items: ProductWithCategory[];
  addToCompare: (product: ProductWithCategory) => boolean;
  removeFromCompare: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  clearCompare: () => void;
  canAddMore: () => boolean;
  maxItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ProductWithCategory[]>([]);

  const canAddMore = useCallback(() => items.length < MAX_COMPARE_ITEMS, [items]);

  const addToCompare = useCallback((product: ProductWithCategory): boolean => {
    if (items.length >= MAX_COMPARE_ITEMS) {
      return false;
    }
    const exists = items.some((item) => item.id === product.id);
    if (exists) return true;
    setItems((prev) => [...prev, product]);
    return true;
  }, [items]);

  const removeFromCompare = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const isInCompare = useCallback(
    (productId: number) => items.some((item) => item.id === productId),
    [items]
  );

  const clearCompare = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        items,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        canAddMore,
        maxItems: MAX_COMPARE_ITEMS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
