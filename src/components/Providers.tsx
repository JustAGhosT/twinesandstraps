'use client';

import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            {children}
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </UserAuthProvider>
  );
}
