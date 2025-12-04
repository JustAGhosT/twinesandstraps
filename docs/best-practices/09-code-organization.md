# Code Organization Standards

## Overview

This document outlines code organization patterns for maintaining a clean, scalable, and maintainable codebase.

## Directory Structure

### Standard: Feature-Based Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes group
│   │   ├── page.tsx       # Home page
│   │   ├── products/      # Product pages
│   │   └── about/         # Static pages
│   ├── (auth)/            # Auth-required routes
│   │   └── account/       # User account
│   ├── admin/             # Admin portal
│   │   ├── layout.tsx     # Admin layout
│   │   ├── products/      # Product management
│   │   └── categories/    # Category management
│   └── api/               # API routes
│       ├── products/      # Product endpoints
│       ├── auth/          # Auth endpoints
│       └── admin/         # Admin endpoints
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utilities & services
├── types/                # TypeScript types
└── constants/            # Constants & config
```

## File Naming Conventions

### Standard: Consistent Naming Patterns

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `ProductCard.tsx` |
| **Pages** | lowercase | `page.tsx` |
| **Utilities** | camelCase | `formatCurrency.ts` |
| **Types** | PascalCase | `Product.ts` |
| **Constants** | camelCase | `theme.ts` |
| **Hooks** | camelCase with `use` | `useCart.ts` |
| **Contexts** | PascalCase with `Context` | `CartContext.tsx` |

### File Extensions

| Extension | Use Case |
|-----------|----------|
| `.tsx` | React components |
| `.ts` | Non-React TypeScript |
| `.css` | Stylesheets |
| `.test.tsx` | Component tests |
| `.test.ts` | Unit tests |

## Component Organization

### Standard: Single Responsibility Components

```tsx
// ✅ Good - Single responsibility
// src/components/ProductCard.tsx
export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <ProductImage src={product.image_url} alt={product.name} />
      <ProductInfo product={product} />
      <ProductActions product={product} />
    </article>
  );
}

// ❌ Bad - Multiple responsibilities
export function ProductCard({ product }) {
  // 200+ lines handling display, cart logic, wishlist, comparisons...
}
```

### Component File Structure

```tsx
// src/components/Button.tsx

// 1. Imports
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types';

// 2. Types (if not imported)
interface LocalButtonProps extends ButtonProps {
  isLoading?: boolean;
}

// 3. Component
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  ...props
}: LocalButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}

// 4. Subcomponents (if any)
function Spinner() {
  return <span className="animate-spin">...</span>;
}
```

## Import Organization

### Standard: Grouped and Ordered Imports

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 2. External libraries
import { z } from 'zod';

// 3. Internal - absolute imports
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

// 4. Internal - relative imports
import { ProductImage } from './ProductImage';

// 5. Types
import type { Product } from '@/types';

// 6. Styles (if any)
import styles from './ProductCard.module.css';
```

## Module Exports

### Standard: Named Exports for Most Cases

```typescript
// ✅ Good - Named exports
// src/lib/utils.ts
export function formatCurrency(amount: number): string { }
export function formatDate(date: Date): string { }

// src/components/Button.tsx
export function Button(props: ButtonProps) { }

// ❌ Avoid - Default exports (except pages)
export default function Button() { }  // Harder to refactor
```

### Index Files for Barrel Exports

```typescript
// src/components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';

// Usage
import { Button, Card, Input } from '@/components/ui';
```

## Separation of Concerns

### Standard: Logic Separation

```
Component Structure:
┌─────────────────────────────────────────────┐
│              Presentation                    │
│         (React Component - JSX)              │
├─────────────────────────────────────────────┤
│              State/Logic                     │
│            (Custom Hooks)                    │
├─────────────────────────────────────────────┤
│              Data Access                     │
│         (lib/data.ts, contexts)              │
├─────────────────────────────────────────────┤
│              Utilities                       │
│           (lib/utils.ts)                     │
└─────────────────────────────────────────────┘
```

### Example: Separating Logic

```tsx
// src/hooks/useProductFilters.ts
export function useProductFilters(products: Product[]) {
  const [filters, setFilters] = useState<Filters>({});

  const filteredProducts = useMemo(() => {
    return products.filter(p => matchesFilters(p, filters));
  }, [products, filters]);

  return { filteredProducts, filters, setFilters };
}

// src/app/products/page.tsx
export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}

// src/components/ProductList.tsx
'use client';
export function ProductList({ products }: { products: Product[] }) {
  const { filteredProducts, filters, setFilters } = useProductFilters(products);

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} />
      <ProductGrid products={filteredProducts} />
    </>
  );
}
```

## API Route Organization

### Standard: RESTful Structure

```
src/app/api/
├── products/
│   ├── route.ts              # GET /api/products, POST /api/products
│   └── [id]/
│       └── route.ts          # GET/PUT/DELETE /api/products/:id
├── categories/
│   ├── route.ts              # GET/POST /api/categories
│   └── [id]/
│       └── route.ts          # GET/PUT/DELETE /api/categories/:id
├── auth/
│   ├── login/
│   │   └── route.ts          # POST /api/auth/login
│   └── logout/
│       └── route.ts          # POST /api/auth/logout
└── health/
    └── route.ts              # GET /api/health
```

## Type Organization

### Standard: Centralized Types

```
src/types/
├── index.ts          # Main exports
├── product.ts        # Product-related types
├── user.ts           # User-related types
├── order.ts          # Order-related types
├── api.ts            # API response types
└── prisma.d.ts       # Prisma extensions
```

### Type File Structure

```typescript
// src/types/product.ts

// Base types
export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  // ...
}

// Derived types
export type ProductSummary = Pick<Product, 'id' | 'name' | 'price'>;

// Input types
export interface CreateProductInput {
  name: string;
  sku: string;
  price: number;
  category_id: number;
}

// Props types
export interface ProductCardProps {
  product: Product;
  showActions?: boolean;
}
```

## Code Organization Checklist

| Category | Check |
|----------|-------|
| **Structure** | Feature-based organization |
| **Naming** | Consistent conventions followed |
| **Imports** | Grouped and ordered |
| **Exports** | Named exports preferred |
| **Components** | Single responsibility |
| **Logic** | Separated from presentation |
| **Types** | Centralized and organized |
| **APIs** | RESTful structure |

## Related Documentation

- [Architecture](./06-architecture.md)
- [Next.js Patterns](./01-nextjs-patterns.md)
