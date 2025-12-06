'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/database';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'tassa_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!stored) {
        setIsLoaded(true);
        return;
      }

      const parsed = JSON.parse(stored);

      // Validate that parsed data is an array
      if (!Array.isArray(parsed)) {
        logWarn('Invalid wishlist data in localStorage, ignoring');
        setIsLoaded(true);
        return;
      }

      // Rehydrate date fields from strings to Date objects
      const rehydrated = parsed.map((item: Record<string, unknown>) => ({
        ...item,
        created_at: typeof item.created_at === 'string' ? new Date(item.created_at) : new Date(),
        updated_at: typeof item.updated_at === 'string' ? new Date(item.updated_at) : new Date(),
      })) as Product[];
      setItems(rehydrated);
    } catch (error) {
      logError('Error loading wishlist:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        logError('Error saving wishlist:', error);
      }
    }
  }, [items, isLoaded]);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const isInWishlist = useCallback(
    (productId: number) => items.some((item) => item.id === productId),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const getTotalItems = useCallback(() => items.length, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getTotalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
