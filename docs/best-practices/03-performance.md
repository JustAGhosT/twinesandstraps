# Performance Optimization Standards

## Overview

This document outlines performance optimization techniques for the Next.js/React/Tailwind stack, focusing on Core Web Vitals and user experience.

## Core Web Vitals Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Time to render largest element |
| **FID** (First Input Delay) | < 100ms | Time to interactivity |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |
| **TTFB** (Time to First Byte) | < 600ms | Server response time |

## Image Optimization

### Standard: Use next/image

```tsx
// ✅ Good - Optimized image
import Image from 'next/image';

<Image
  src={product.image_url}
  alt={product.name}
  width={400}
  height={300}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority={isAboveFold}
/>
```

```tsx
// ❌ Bad - Unoptimized image
<img src={product.image_url} alt={product.name} />
```

### Image Best Practices

| Practice | Implementation |
|----------|----------------|
| **Lazy Loading** | Automatic (default behavior) |
| **Priority Loading** | `priority` prop for above-fold images |
| **Responsive Sizes** | `sizes` prop for correct dimensions |
| **Placeholder** | `placeholder="blur"` for better UX |
| **Format** | WebP served automatically |

### Image Configuration

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
```

## Font Optimization

### Standard: Use next/font

```tsx
// ✅ Good - Optimized font loading
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function Layout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// ❌ Bad - External font link
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />
```

## Bundle Size Optimization

### Standard: Minimize Client-Side JavaScript

```tsx
// ✅ Good - Server Component (no client JS)
export default async function ProductList() {
  const products = await getProducts();
  return <div>{/* render products */}</div>;
}

// ✅ Good - Dynamic import for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### Code Splitting

```tsx
// Automatic route-based splitting
// Each page is automatically code-split

// Manual splitting for large components
import dynamic from 'next/dynamic';

const AIAssistant = dynamic(() => import('@/components/AIAssistantPanel'), {
  ssr: false,
  loading: () => <div>Loading assistant...</div>,
});
```

### Bundle Analysis

```bash
# Analyze bundle
npm install -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

# Run analysis
ANALYZE=true npm run build
```

## Database Query Optimization

### Standard: Select Only Needed Fields

```typescript
// ✅ Good - Select specific fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    image_url: true,
    category: {
      select: { name: true, slug: true },
    },
  },
});

// ❌ Bad - Select everything
const products = await prisma.product.findMany({
  include: { category: true, supplier: true, reviews: true },
});
```

### Avoid N+1 Queries

```typescript
// ✅ Good - Include related data in single query
const products = await prisma.product.findMany({
  include: { category: true },
});

// ❌ Bad - N+1 query pattern
const products = await prisma.product.findMany();
for (const product of products) {
  const category = await prisma.category.findUnique({
    where: { id: product.category_id },
  });
}
```

### Pagination

```typescript
// ✅ Good - Paginated query
const products = await prisma.product.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { created_at: 'desc' },
});

// ❌ Bad - Fetch all records
const products = await prisma.product.findMany();
const paginated = products.slice((page - 1) * limit, page * limit);
```

## Caching Strategies

### Static Generation

```tsx
// Default - Pages are statically generated
export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

### Incremental Static Regeneration (ISR)

```tsx
// Revalidate every 60 seconds
export const revalidate = 60;

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

### Dynamic with Caching

```tsx
// Force dynamic but cache data
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await fetch('/api/products', {
    next: { revalidate: 60 },
  }).then(res => res.json());

  return <ProductList products={products} />;
}
```

## Client-Side Performance

### Standard: Minimize Hydration

```tsx
// ✅ Good - Static content as Server Component
export default function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <AddToCartButton product={product} /> {/* Only this needs hydration */}
    </div>
  );
}
```

### Memoization

```tsx
// ✅ Good - Memoize expensive computations
const totalPrice = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}, [items]);

// ✅ Good - Memoize callbacks
const handleAddToCart = useCallback((product) => {
  addToCart(product);
}, [addToCart]);
```

### Debouncing

```tsx
// ✅ Good - Debounce search input
const [searchTerm, setSearchTerm] = useState('');
const [debouncedTerm, setDebouncedTerm] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTerm(searchTerm);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);
```

## CSS Performance

### Standard: Purge Unused CSS

Tailwind automatically purges unused CSS in production.

```javascript
// tailwind.config.ts
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Unused classes are automatically removed
};
```

### Critical CSS

```tsx
// ✅ Good - Inline critical styles
<style jsx>{`
  .hero { min-height: 100vh; }
`}</style>
```

## Lazy Loading

### Standard: Lazy Load Below-Fold Content

```tsx
// ✅ Good - Lazy load components
const RelatedProducts = dynamic(() => import('./RelatedProducts'), {
  loading: () => <ProductGridSkeleton />,
});

const Reviews = dynamic(() => import('./Reviews'), {
  ssr: false, // Don't render on server
});
```

### Intersection Observer

```tsx
// Lazy load on scroll
function LazySection({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{isVisible ? children : <Skeleton />}</div>;
}
```

## Preloading

### Standard: Preload Critical Resources

```tsx
// Preload critical images
<Image src={heroImage} priority alt="Hero" />

// Preload fonts (handled by next/font)
const inter = Inter({ preload: true });
```

## Performance Monitoring

### Core Web Vitals Tracking

```tsx
// pages/_app.tsx
export function reportWebVitals(metric) {
  if (metric.label === 'web-vital') {
    console.log(metric.name, metric.value);
    // Send to analytics
  }
}
```

### Performance Checklist

| Category | Check |
|----------|-------|
| **Images** | Using next/image with sizes |
| **Fonts** | Using next/font |
| **Server Components** | Default to server rendering |
| **Queries** | Using select, pagination |
| **Caching** | ISR where appropriate |
| **Bundle** | Dynamic imports for heavy components |
| **Lazy Loading** | Below-fold content deferred |
| **CSS** | Tailwind purging enabled |

## Related Documentation

- [Frontend Stack](../stack/02-frontend-stack.md)
- [Next.js Patterns](./01-nextjs-patterns.md)
