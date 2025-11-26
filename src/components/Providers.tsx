'use client';

import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SiteSettingsProvider>
      <UserAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              {children}
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </UserAuthProvider>
    </SiteSettingsProvider>
  );
}
