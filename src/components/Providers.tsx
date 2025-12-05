'use client';

import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmModal';
import { Analytics } from '@/components/Analytics';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <UserAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <ToastProvider>
                  <ConfirmProvider>
                    <Analytics />
                    {children}
                  </ConfirmProvider>
                </ToastProvider>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </UserAuthProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
}
