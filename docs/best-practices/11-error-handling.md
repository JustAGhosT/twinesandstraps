# Error Handling & Logging Patterns

## Overview

This document outlines patterns for consistent error handling, logging, and user feedback across the application.

## Error Handling Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Fail gracefully** | Show user-friendly messages |
| **Log thoroughly** | Capture context for debugging |
| **Recover when possible** | Retry, fallback, or degrade |
| **Never swallow errors** | Always handle or propagate |

## API Error Handling

### Standard: Consistent Error Responses

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: Record<string, string>;
}

// Helper functions
export function successResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { success: true, message, data };
}

export function errorResponse(
  error: string,
  details?: Record<string, string>
): ApiResponse<never> {
  return { success: false, message: error, error, details };
}
```

### API Route Error Pattern

```typescript
// src/app/api/products/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', formatZodErrors(validation.error)),
        { status: 400 }
      );
    }

    // Business logic
    const product = await prisma.product.create({
      data: validation.data,
    });

    return NextResponse.json(successResponse(product, 'Product created'));

  } catch (error) {
    // Log full error for debugging
    console.error('Product creation failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return safe message to client
    return NextResponse.json(
      errorResponse('Failed to create product'),
      { status: 500 }
    );
  }
}
```

### Zod Error Formatting

```typescript
// src/lib/validations.ts
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    details[path] = issue.message;
  }
  return details;
}
```

## Client-Side Error Handling

### Standard: Error Boundaries

```tsx
// src/app/products/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-6">
        We couldn't load the products. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

### Global Error Page

```tsx
// src/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2>Something went wrong!</h2>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
```

### Not Found Handling

```tsx
// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Return Home
      </Link>
    </div>
  );
}
```

## Data Fetching Errors

### Standard: Graceful Degradation

```typescript
// src/lib/data.ts
export async function getProduct(id: string): Promise<Product | null> {
  const productId = parseInt(id, 10);
  if (isNaN(productId) || productId <= 0) {
    return null;
  }

  try {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
  } catch (error) {
    console.error('Failed to fetch product:', {
      productId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

// Usage in page
export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
```

## Form Error Handling

### Standard: Field-Level Errors

```tsx
// src/components/forms/ProductForm.tsx
'use client';

import { useState } from 'react';
import { createProductSchema } from '@/lib/validations';

export function ProductForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setSubmitError(null);

    const data = Object.fromEntries(formData);
    const validation = createProductSchema.safeParse(data);

    if (!validation.success) {
      setErrors(formatZodErrors(validation.error));
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.details) {
          setErrors(result.details);
        } else {
          setSubmitError(result.error || 'Failed to create product');
        }
      }
    } catch (error) {
      setSubmitError('Network error. Please try again.');
    }
  }

  return (
    <form action={handleSubmit}>
      {submitError && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" />
        {errors.name && (
          <span className="text-red-600 text-sm">{errors.name}</span>
        )}
      </div>

      {/* More fields... */}
    </form>
  );
}
```

## Logging Standards

### Standard: Structured Logging

```typescript
// ✅ Good - Structured log with context
console.error('Order creation failed', {
  userId: user.id,
  cartItems: items.length,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});

// ❌ Bad - Unstructured log
console.error('Error: ' + error);
console.error(error);
```

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `console.error` | Errors requiring attention | Database failures |
| `console.warn` | Potential issues | Deprecated usage |
| `console.info` | Important events | User login |
| `console.log` | Development only | Debug values |

### Sensitive Data

```typescript
// ✅ Good - No sensitive data
console.error('Login failed', {
  email: user.email,
  reason: 'invalid_password',
});

// ❌ Bad - Logging sensitive data
console.error('Login failed', {
  email: user.email,
  password: user.password,  // NEVER log passwords
});
```

## Database Error Handling

### Standard: Prisma Error Handling

```typescript
import { Prisma } from '@prisma/client';

async function createProduct(data: CreateProductInput) {
  try {
    return await prisma.product.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      switch (error.code) {
        case 'P2002':
          throw new Error('A product with this SKU already exists');
        case 'P2025':
          throw new Error('Category not found');
        default:
          console.error('Database error:', error.code, error.message);
          throw new Error('Database operation failed');
      }
    }
    throw error;
  }
}
```

## Error Recovery Patterns

### Retry Pattern

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Fallback Pattern

```typescript
async function getProductImage(product: Product): Promise<string> {
  if (product.image_url) {
    try {
      // Verify image exists
      const response = await fetch(product.image_url, { method: 'HEAD' });
      if (response.ok) return product.image_url;
    } catch {
      // Fall through to placeholder
    }
  }
  return '/images/placeholder-product.png';
}
```

## User Feedback

### Toast Notifications

```typescript
// src/contexts/ToastContext.tsx
export function useToast() {
  const context = useContext(ToastContext);
  return {
    success: (message: string) => context.add({ type: 'success', message }),
    error: (message: string) => context.add({ type: 'error', message }),
    warning: (message: string) => context.add({ type: 'warning', message }),
  };
}

// Usage
const toast = useToast();
try {
  await addToCart(product);
  toast.success('Added to cart');
} catch {
  toast.error('Failed to add to cart');
}
```

## Error Handling Checklist

| Category | Check |
|----------|-------|
| **API Routes** | Consistent error response format |
| **Validation** | Zod errors formatted for client |
| **Boundaries** | Error boundaries for each route segment |
| **Data Fetching** | Null handling and notFound() |
| **Forms** | Field-level and form-level errors |
| **Logging** | Structured with context |
| **Sensitive Data** | Never logged |
| **Recovery** | Retry and fallback where appropriate |

## Related Documentation

- [API Architecture](../stack/05-api-architecture.md)
- [Testing](./04-testing.md)
