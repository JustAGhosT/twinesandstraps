# State Management Standards (React Context)

## Overview

This document outlines state management patterns using React Context API, the primary state management approach for this application.

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Provider Hierarchy                       │
├─────────────────────────────────────────────────────────────┤
│  SiteSettingsProvider (global settings)                     │
│    └── ThemeProvider (light/dark mode)                      │
│          └── ToastProvider (notifications)                  │
│                └── UserAuthProvider (user session)          │
│                      └── CartProvider (shopping cart)       │
│                            └── WishlistProvider             │
│                                  └── CompareProvider        │
└─────────────────────────────────────────────────────────────┘
```

## Context Types

| Context | Scope | Persistence | Updates |
|---------|-------|-------------|---------|
| **SiteSettings** | Global | Server-fetched | Rare |
| **Theme** | Global | localStorage | User action |
| **Toast** | Global | None | Events |
| **UserAuth** | Global | Cookie | Login/Logout |
| **Cart** | User | localStorage | User action |
| **Wishlist** | User | localStorage | User action |
| **Compare** | Session | State only | User action |

## Context Pattern

### Standard: Type-Safe Context with Hook

```tsx
// src/contexts/CartContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Product } from '@/types';

// 1. Define types
interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

// 2. Create context with undefined default
const CartContext = createContext<CartContextType | undefined>(undefined);

// 3. Create provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// 4. Create custom hook with error handling
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
```

## Provider Composition

### Standard: Centralized Provider Setup

```tsx
// src/components/Providers.tsx
'use client';

import { ReactNode } from 'react';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SiteSettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <UserAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  {children}
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </UserAuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SiteSettingsProvider>
  );
}
```

### Usage in Layout

```tsx
// src/app/layout.tsx
import { Providers } from '@/components/Providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

## State Persistence

### Standard: localStorage Sync

```tsx
// src/contexts/CartContext.tsx
'use client';

import { useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'tassa-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // Prevent hydration mismatch
  if (!isHydrated) {
    return <>{children}</>;  // Or loading state
  }

  return (
    <CartContext.Provider value={{ items, /* ... */ }}>
      {children}
    </CartContext.Provider>
  );
}
```

## Server State Integration

### Standard: Initial Data from Server

```tsx
// src/contexts/SiteSettingsContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { SiteSetting } from '@/types';

interface SiteSettingsContextType {
  settings: SiteSetting;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(
  undefined
);

interface Props {
  children: ReactNode;
  initialSettings: SiteSetting;
}

export function SiteSettingsProvider({ children, initialSettings }: Props) {
  return (
    <SiteSettingsContext.Provider value={{ settings: initialSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// In layout.tsx - fetch on server, pass to provider
export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html>
      <body>
        <SiteSettingsProvider initialSettings={settings}>
          {children}
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
```

## Performance Optimization

### Standard: Memoize Context Value

```tsx
// ✅ Good - Memoized value prevents unnecessary re-renders
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems(prev => [...prev, { product, quantity: 1 }]);
  }, []);

  const value = useMemo(() => ({
    items,
    addItem,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  }), [items, addItem]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ❌ Bad - New object every render
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  return (
    <CartContext.Provider value={{ items, addItem: () => {} }}>
      {children}
    </CartContext.Provider>
  );
}
```

### Context Splitting

```tsx
// ✅ Good - Split contexts for different update frequencies
const CartItemsContext = createContext<CartItem[]>([]);
const CartActionsContext = createContext<CartActions | null>(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const actions = useMemo(() => ({
    addItem: (product: Product) => setItems(prev => [...prev, { product, quantity: 1 }]),
    removeItem: (id: number) => setItems(prev => prev.filter(i => i.product.id !== id)),
  }), []);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartItemsContext.Provider value={items}>
        {children}
      </CartItemsContext.Provider>
    </CartActionsContext.Provider>
  );
}

// Components can subscribe to only what they need
export const useCartItems = () => useContext(CartItemsContext);
export const useCartActions = () => useContext(CartActionsContext);
```

## When to Use Context

| Use Case | Solution |
|----------|----------|
| **Theme/Preferences** | Context + localStorage |
| **User Authentication** | Context + cookies |
| **Shopping Cart** | Context + localStorage |
| **Form State** | Local component state |
| **Server Data** | Server Components / fetch |
| **Complex State** | Consider Zustand/Redux |

## Anti-Patterns to Avoid

```tsx
// ❌ Bad - Provider in every component
function ProductPage() {
  return (
    <CartProvider>  {/* Don't nest providers unnecessarily */}
      <ProductDetail />
    </CartProvider>
  );
}

// ❌ Bad - Using context for local state
function ProductForm() {
  const { formData, setFormData } = useFormContext();  // Overkill
  // Use useState instead for form-specific state
}

// ❌ Bad - Large context with everything
const MegaContext = createContext({
  user: null,
  cart: [],
  wishlist: [],
  theme: 'light',
  settings: {},
  // Everything updates together!
});
```

## Testing Context

```tsx
// src/__tests__/CartContext.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '@/contexts/CartContext';

function TestComponent() {
  const { items, addItem, itemCount } = useCart();
  return (
    <div>
      <span data-testid="count">{itemCount}</span>
      <button onClick={() => addItem(mockProduct)}>Add</button>
    </div>
  );
}

test('adds item to cart', async () => {
  render(
    <CartProvider>
      <TestComponent />
    </CartProvider>
  );

  expect(screen.getByTestId('count')).toHaveTextContent('0');

  await userEvent.click(screen.getByText('Add'));

  expect(screen.getByTestId('count')).toHaveTextContent('1');
});
```

## State Management Checklist

| Category | Check |
|----------|-------|
| **Types** | Context type defined |
| **Hook** | Custom hook with error handling |
| **Memoization** | Value and callbacks memoized |
| **Persistence** | localStorage if needed |
| **Hydration** | SSR hydration handled |
| **Splitting** | Contexts split by update frequency |
| **Testing** | Provider wrapper in tests |

## Related Documentation

- [Frontend Stack](../stack/02-frontend-stack.md)
- [State Management Architecture](../stack/03-state-management.md)
- [Architecture Patterns](./06-architecture.md)
