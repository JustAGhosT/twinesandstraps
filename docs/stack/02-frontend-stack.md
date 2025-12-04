# Frontend Stack

## Overview

The frontend is built with Next.js 14 using the App Router, React 18, and Tailwind CSS. It follows a component-based architecture with a focus on server-side rendering for SEO and performance.

## Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 14.2.32 | Full-stack React framework with App Router |
| **UI Library** | React | 18.x | Component-based UI with concurrent features |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS with dark mode support |
| **Font Loading** | next/font | Built-in | Optimized Google Fonts (Inter) |
| **Image Handling** | next/image | Built-in | Optimized image loading |
| **Form Validation** | Zod | 4.1.13 | Schema-based form validation |

## Next.js Configuration

### App Router Structure

```
src/app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Homepage
├── globals.css         # Global styles and CSS variables
├── loading.tsx         # Global loading state (optional)
├── error.tsx           # Global error boundary (optional)
├── not-found.tsx       # 404 page (optional)
├── products/
│   ├── page.tsx        # Product listing
│   └── [id]/
│       └── page.tsx    # Product detail
├── admin/
│   ├── layout.tsx      # Admin layout
│   └── ...             # Admin pages
└── api/
    └── ...             # API routes
```

### Build Configuration

```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',      // Optimized for containerized deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
};
```

## React Patterns

### Server Components (Default)

```tsx
// src/app/products/page.tsx
// This is a Server Component by default
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

### Client Components

```tsx
// src/components/ProductCard.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  // Interactive client-side logic
}
```

## Tailwind CSS Configuration

### Theme Extension

```typescript
// tailwind.config.ts
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // ... more colors
      },
    },
  },
};
```

### CSS Variables (Theming)

```css
/* src/app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 358.3 71.4% 45.3%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 358.3 71.4% 55.3%;
    /* ... */
  }
}
```

## Component Library

### Core Components

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `Button.tsx` | Reusable button with variants |
| `Header` | `Header.tsx` | Site header with navigation |
| `Footer` | `Footer.tsx` | Site footer |
| `ProductCard` | `ProductCard.tsx` | Product display card |
| `ProductSkeleton` | `ProductSkeleton.tsx` | Loading skeleton |
| `SearchBar` | `SearchBar.tsx` | Product search |
| `Toast` | `Toast.tsx` | Notification system |
| `ConfirmModal` | `ConfirmModal.tsx` | Confirmation dialogs |
| `ThemeToggle` | `ThemeToggle.tsx` | Dark/light mode switch |

### Button Component Example

```tsx
// src/components/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md...';
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700',
      secondary: 'bg-secondary-100 text-secondary-900...',
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

## Font Loading

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

## Image Optimization

```tsx
import Image from 'next/image';

<Image
  src={product.image_url}
  alt={product.name}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

## Accessibility Features

- **Skip Link**: `SkipLink.tsx` for keyboard navigation
- **Focus Management**: Visible focus states
- **ARIA Labels**: On all interactive elements
- **Semantic HTML**: Proper heading hierarchy

## Performance Optimizations

1. **Server Components**: Reduced client-side JavaScript
2. **Image Optimization**: Automatic WebP conversion, lazy loading
3. **Font Optimization**: Local font hosting via `next/font`
4. **Code Splitting**: Automatic route-based splitting
5. **CSS Purging**: Tailwind removes unused styles

## Related Documentation

- [State Management](./03-state-management.md)
- [Best Practices - Next.js Patterns](../best-practices/01-nextjs-patterns.md)
- [Best Practices - Accessibility](../best-practices/07-accessibility.md)
