# Next.js 14 App Router Patterns

## Overview

This document outlines the recommended patterns and conventions for Next.js 14 with the App Router.

## Server Components (Default)

### Standard: Default to Server Components

Server Components are the default in the App Router. Only use `'use client'` when necessary.

```tsx
// ✅ Good - Server Component (default)
// src/app/products/page.tsx
import { getProducts } from '@/lib/data';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

```tsx
// ✅ Good - Client Component when needed
// src/components/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

export function AddToCartButton({ product }) {
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  // Interactive logic requires client component
}
```

### When to Use Client Components

- Event listeners (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, window)
- Interactive UI (forms, modals)

## Data Fetching

### Standard: Fetch in Server Components

```tsx
// ✅ Good - Server-side data fetching
export default async function ProductPage({ params }) {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(params.id) },
    include: { category: true },
  });

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}
```

```tsx
// ❌ Avoid - Client-side fetching when server is possible
'use client';

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(setProduct);
  }, [params.id]);

  // Unnecessary client-side fetching
}
```

### Parallel Data Fetching

```tsx
// ✅ Good - Parallel fetching
export default async function ProductPage({ params }) {
  const [product, relatedProducts, reviews] = await Promise.all([
    getProduct(params.id),
    getRelatedProducts(params.id),
    getReviews(params.id),
  ]);

  return (
    <>
      <ProductView product={product} />
      <RelatedProducts products={relatedProducts} />
      <Reviews reviews={reviews} />
    </>
  );
}
```

## Route Handlers (API Routes)

### Standard: RESTful Design

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';

  const products = await prisma.product.findMany({
    skip: (parseInt(page) - 1) * 20,
    take: 20,
  });

  return NextResponse.json({ success: true, data: products });
}

// POST /api/products
export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await prisma.product.create({
    data: body,
  });

  return NextResponse.json(
    { success: true, data: product },
    { status: 201 }
  );
}
```

### Dynamic Routes

```typescript
// src/app/api/products/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: product });
}
```

## Metadata

### Standard: Use generateMetadata for Dynamic Pages

```tsx
// src/app/products/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image_url ? [product.image_url] : [],
    },
  };
}
```

### Static Metadata

```tsx
// src/app/about/page.tsx
export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Twines and Straps SA',
};
```

## Loading States

### Standard: Use loading.tsx Files

```tsx
// src/app/products/loading.tsx
export default function Loading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Component-Level Loading

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
```

## Error Handling

### Standard: Use error.tsx Boundaries

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
  return (
    <div className="text-center py-12">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found Pages

```tsx
// src/app/products/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h2>Product Not Found</h2>
      <p>The product you're looking for doesn't exist.</p>
      <Link href="/products">Browse all products</Link>
    </div>
  );
}
```

## Caching Strategies

### Static Generation (Default)

```tsx
// Pages are statically generated by default
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Incremental Static Regeneration (ISR)

```tsx
// Revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Dynamic Rendering

```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

## Route Groups

### Standard: Use for Layout Organization

```
src/app/
├── (public)/           # Public pages
│   ├── layout.tsx      # Public layout
│   ├── page.tsx        # Home
│   └── products/
├── (auth)/             # Auth pages
│   ├── layout.tsx      # Auth layout
│   ├── login/
│   └── register/
└── admin/              # Admin section
    ├── layout.tsx      # Admin layout
    └── ...
```

## Middleware

### Standard: Use for Route Protection

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session');

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

## Best Practice Summary

| Practice | Standard |
|----------|----------|
| Component Default | Server Components |
| Data Fetching | Server-side in async components |
| Client Components | Only when interactive features needed |
| Metadata | generateMetadata for dynamic |
| Loading | loading.tsx files |
| Error Handling | error.tsx boundaries |
| 404 Pages | not-found.tsx |
| Caching | ISR for semi-static content |
| Route Protection | Middleware |
| API Routes | Route Handlers with proper methods |

## Related Documentation

- [Frontend Stack](../stack/02-frontend-stack.md)
- [Performance](./03-performance.md)
