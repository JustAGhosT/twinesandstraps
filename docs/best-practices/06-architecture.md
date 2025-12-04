# Architectural Patterns

## Overview

This document outlines architectural patterns suited to the e-commerce domain and the Next.js/Prisma stack.

## Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│              (React Components, Pages)                   │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                      │
│          (API Routes, Controllers, Validation)          │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                         │
│           (Business Logic, Data Access)                 │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│          (Database, External Services)                  │
└─────────────────────────────────────────────────────────┘
```

## Repository Pattern

### Standard: Centralize Data Access

```typescript
// ✅ Good - Centralized data access
// src/lib/data.ts
export async function getProduct(id: string): Promise<Product | null> {
  const productId = parseInt(id, 10);
  if (isNaN(productId) || productId <= 0) return null;

  try {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

// Usage in page
export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  // ...
}
```

```typescript
// ❌ Avoid - Direct Prisma calls scattered everywhere
export default async function ProductPage({ params }) {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(params.id) },
    include: { category: true },
  });
}
```

### Repository Structure

```
src/lib/
├── prisma.ts           # Prisma client singleton
├── data.ts             # Product data access
├── user-auth.ts        # User authentication
├── admin-auth.ts       # Admin authentication
├── validations.ts      # Input validation schemas
└── blob-storage.ts     # File storage operations
```

## Service Layer Pattern

### Standard: Separate Business Logic

```typescript
// src/services/order.ts
export class OrderService {
  async createOrder(userId: number, items: CartItem[]): Promise<Order> {
    // Calculate totals
    const subtotal = items.reduce((sum, item) =>
      sum + item.price * item.quantity, 0
    );
    const vatAmount = subtotal * 0.15;
    const total = subtotal + vatAmount;

    // Create order with transaction
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          order_number: generateOrderNumber(),
          user_id: userId,
          subtotal,
          vat_amount: vatAmount,
          total,
          items: {
            create: items.map(item => ({
              product_id: item.product.id,
              product_name: item.product.name,
              product_sku: item.product.sku,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity,
            })),
          },
        },
      });

      // Update inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }
}
```

## DTO Validation Pattern

### Standard: Validate at Boundaries

```typescript
// src/lib/validations.ts
import { z } from 'zod';

// Input DTO
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(50),
  price: z.number().positive(),
  category_id: z.number().int().positive(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Usage in API route
export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = createProductSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, errors: validation.error.issues },
      { status: 400 }
    );
  }

  // Use validated data
  const product = await prisma.product.create({
    data: validation.data,
  });
}
```

## Feature Flag Pattern

### Standard: Toggle Features Without Deployment

```typescript
// src/config/featureFlags.ts
export interface FeatureFlags {
  testimonials: boolean;
  checkout: boolean;
  aiAssistant: boolean;
}

export const featureFlags: FeatureFlags = {
  testimonials: envBool(process.env.NEXT_PUBLIC_FEATURE_TESTIMONIALS, true),
  checkout: envBool(process.env.NEXT_PUBLIC_FEATURE_CHECKOUT, false),
  aiAssistant: envBool(process.env.NEXT_PUBLIC_FEATURE_AI, false),
};

// Usage
if (featureFlags.checkout) {
  // Render checkout button
}
```

### Feature Flag Hook

```typescript
// src/hooks/useFeatureFlag.ts
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

// Usage in component
const showCheckout = useFeatureFlag('checkout');
```

## Error Boundary Pattern

### Standard: Graceful Failure Handling

```tsx
// src/app/products/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="text-center py-12">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Singleton Pattern

### Standard: Single Database Connection

```typescript
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Site Settings Singleton

```typescript
// Database model uses singleton pattern
model SiteSetting {
  id Int @id @default(1)  // Always ID 1
  // ... fields
}

// Access pattern
const settings = await prisma.siteSetting.findUnique({
  where: { id: 1 },
});
```

## Optimistic Update Pattern

### Standard: Responsive UI for User Actions

```typescript
// Cart context with optimistic updates
function addToCart(product: Product, quantity: number) {
  // Optimistically update UI
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

  // Persist to storage
  saveToLocalStorage();
}
```

## Provider Pattern

### Standard: Context Provider Composition

```tsx
// src/components/Providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SiteSettingsProvider>
      <ThemeProvider>
        <ToastProvider>
          <UserAuthProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </UserAuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SiteSettingsProvider>
  );
}
```

## API Response Pattern

### Standard: Consistent Response Format

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: Record<string, string>;
}

export function successResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { success: true, message, data };
}

export function errorResponse(error: string, details?: Record<string, string>) {
  return { success: false, message: error, error, details };
}
```

## Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Separation of Concerns** | Layers, components, modules |
| **Single Responsibility** | One purpose per file/function |
| **DRY** | Shared utilities, components |
| **KISS** | Simple solutions first |
| **YAGNI** | Don't build unused features |

## E-commerce Specific Patterns

| Pattern | Use Case |
|---------|----------|
| **Cart State** | Client-side with localStorage persistence |
| **Order Creation** | Transaction for consistency |
| **Inventory** | Check stock before order |
| **Pricing** | Calculate VAT at checkout |
| **Quote Flow** | Store quote state in session |

## Related Documentation

- [Backend Stack](../stack/04-backend-stack.md)
- [State Management](./12-state-management.md)
