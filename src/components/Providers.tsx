'use client';

import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <CompareProvider>
          {children}
        </CompareProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
