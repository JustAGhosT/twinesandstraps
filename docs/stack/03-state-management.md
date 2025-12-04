# State Management Architecture

## Overview

The application uses React Context API for client-side state management. State is organized into domain-specific contexts to maintain separation of concerns and optimize re-rendering.

## Architecture Principles

1. **Domain Separation**: Each context handles a specific domain (cart, auth, theme, etc.)
2. **Provider Composition**: Contexts are composed in a central `Providers` component
3. **Persistence**: Critical state (cart, preferences) is persisted to localStorage
4. **Server State**: Database data is fetched server-side when possible

## Context Overview

```
src/contexts/
├── AdminAuthContext.tsx    # Admin session management
├── CartContext.tsx         # Shopping cart state
├── CompareContext.tsx      # Product comparison
├── SiteSettingsContext.tsx # Dynamic site configuration
├── ThemeContext.tsx        # Light/dark mode + color themes
├── UserAuthContext.tsx     # Customer authentication
└── WishlistContext.tsx     # Saved products
```

## Context Implementations

### CartContext

**Purpose**: Manages shopping cart state with localStorage persistence.

```typescript
// src/contexts/CartContext.tsx
interface CartItem {
  product: ProductWithCategory;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductWithCategory, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
```

**Features**:
- Add/remove/update items
- Quantity management
- Total calculations
- 7-day localStorage persistence

### UserAuthContext

**Purpose**: Manages customer authentication state.

```typescript
// src/contexts/UserAuthContext.tsx
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface UserAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
}
```

**Features**:
- Login/logout/register
- Session persistence
- Automatic token refresh
- Protected route support

### AdminAuthContext

**Purpose**: Manages admin portal authentication.

```typescript
// src/contexts/AdminAuthContext.tsx
interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**Features**:
- Password-based authentication
- Database-stored sessions
- Middleware integration
- Activity logging

### ThemeContext

**Purpose**: Manages theme preferences (light/dark mode, color schemes).

```typescript
// src/contexts/ThemeContext.tsx
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  setColors: (colors: ThemeColors) => void;
  toggleMode: () => void;
}
```

**Features**:
- Light/dark/system modes
- Custom color themes
- localStorage persistence
- CSS variable updates

### WishlistContext

**Purpose**: Manages saved/favorite products.

```typescript
// src/contexts/WishlistContext.tsx
interface WishlistContextType {
  items: number[];  // Product IDs
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}
```

**Features**:
- Add/remove favorites
- Quick lookup
- localStorage persistence
- Sync with user account (when authenticated)

### CompareContext

**Purpose**: Manages product comparison functionality.

```typescript
// src/contexts/CompareContext.tsx
interface CompareContextType {
  items: number[];  // Product IDs (max 4)
  addToCompare: (productId: number) => void;
  removeFromCompare: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  clearCompare: () => void;
}
```

**Features**:
- Compare up to 4 products
- Comparison bar UI
- localStorage persistence

### SiteSettingsContext

**Purpose**: Provides dynamic site configuration from database.

```typescript
// src/contexts/SiteSettingsContext.tsx
interface SiteSettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  vatRate: string;
  logoUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  // ...
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
}
```

**Features**:
- Server-fetched configuration
- Admin-editable settings
- Automatic refresh
- Fallback defaults

## Provider Composition

```tsx
// src/components/Providers.tsx
'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
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

## Usage in Root Layout

```tsx
// src/app/layout.tsx
import { Providers } from '@/components/Providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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

## Custom Hooks

### useFeatureFlag

```typescript
// src/hooks/useFeatureFlag.ts
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

// Usage
const showPrices = useFeatureFlag('showPrices');
```

### useViewHistory

```typescript
// src/hooks/useViewHistory.ts
export function useViewHistory() {
  const trackView = async (productId: number) => {
    // Track product view for recommendations
  };
  return { trackView };
}
```

### useCustomLogo

```typescript
// src/hooks/useCustomLogo.ts
export function useCustomLogo(): string | null {
  const { settings } = useSiteSettings();
  return settings.logoUrl || null;
}
```

## Storage Keys

```typescript
// src/constants/ui.ts
export const STORAGE_KEYS = {
  THEME_MODE: 'tassa_theme_mode',
  THEME_COLORS: 'tassa_theme_colors',
  CART: 'tassa_cart',
  WISHLIST: 'tassa_wishlist',
  COMPARE: 'tassa_compare',
  RECENTLY_VIEWED: 'tassa_recently_viewed',
  USER_PREFERENCES: 'tassa_user_preferences',
} as const;
```

## Best Practices

### Do

- Split contexts by domain
- Memoize context values when needed
- Use localStorage for persistence
- Provide default values
- Handle loading and error states

### Don't

- Put everything in one context
- Store server state in context (use Server Components)
- Forget to handle hydration mismatches
- Over-optimize prematurely

## Performance Considerations

1. **Context Splitting**: Prevents unnecessary re-renders
2. **Memoization**: Use `useMemo` for computed values
3. **Selective Subscription**: Components only subscribe to needed contexts
4. **Lazy Initialization**: Defer expensive operations

## Related Documentation

- [Frontend Stack](./02-frontend-stack.md)
- [Best Practices - State Management](../best-practices/12-state-management.md)
