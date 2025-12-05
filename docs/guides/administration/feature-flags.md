# Feature Flags

Toggle site features on/off without code changes using environment variables.

> **Looking for setup instructions?** See the [Setup Guide](../../getting-started/setup.md) for environment configuration.

---

## Overview

Feature flags allow you to enable or disable features via environment variables. This is useful for:
- Gradually rolling out new features
- A/B testing
- Disabling features that require external services (e.g., WhatsApp, newsletter)
- Customizing the site for different deployments

## Configuration

Set feature flags in your `.env` file or deployment environment variables. All flags use the `NEXT_PUBLIC_FEATURE_` prefix.

```bash
# Example: Disable testimonials and enable wishlist
NEXT_PUBLIC_FEATURE_TESTIMONIALS=false
NEXT_PUBLIC_FEATURE_WISHLIST=true
```

## Available Feature Flags

### Marketing & Engagement

| Feature | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| Testimonials | `NEXT_PUBLIC_FEATURE_TESTIMONIALS` | `true` | Customer testimonials carousel on homepage |
| Newsletter Signup | `NEXT_PUBLIC_FEATURE_NEWSLETTER` | `true` | Newsletter subscription form in footer |
| WhatsApp Button | `NEXT_PUBLIC_FEATURE_WHATSAPP` | `true` | Floating WhatsApp contact button |
| Trust Badges | `NEXT_PUBLIC_FEATURE_TRUST_BADGES` | `true` | Trust/certification badges on homepage |

### E-commerce Features

| Feature | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| Related Products | `NEXT_PUBLIC_FEATURE_RELATED_PRODUCTS` | `true` | "You May Also Like" section on product pages |
| Recommended Products | `NEXT_PUBLIC_FEATURE_RECOMMENDED_PRODUCTS` | `true` | Product recommendations in empty cart |
| Quick Add to Cart | `NEXT_PUBLIC_FEATURE_QUICK_ADD_CART` | `true` | Add to cart button on product listing cards |
| Product Zoom | `NEXT_PUBLIC_FEATURE_PRODUCT_ZOOM` | `true` | Click-to-zoom on product detail images |

### UI/UX Features

| Feature | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| Back to Top | `NEXT_PUBLIC_FEATURE_BACK_TO_TOP` | `true` | Scroll-to-top button |
| Search Bar | `NEXT_PUBLIC_FEATURE_SEARCH_BAR` | `true` | Search functionality in header |

### Advanced Features

| Feature | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| Product Reviews | `NEXT_PUBLIC_FEATURE_PRODUCT_REVIEWS` | `false` | Customer reviews with star ratings |
| Wishlist | `NEXT_PUBLIC_FEATURE_WISHLIST` | `true` | Save favorite products (localStorage) |
| Compare Products | `NEXT_PUBLIC_FEATURE_COMPARE_PRODUCTS` | `true` | Side-by-side product comparison |
| Checkout | `NEXT_PUBLIC_FEATURE_CHECKOUT` | `false` | Full checkout flow (disabled for quote-based model) |
| Show Prices | `NEXT_PUBLIC_FEATURE_SHOW_PRICES` | `true` | Display product prices |

### User Features

| Feature | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| User Auth | `NEXT_PUBLIC_FEATURE_USER_AUTH` | `true` | User registration and login |
| View History | `NEXT_PUBLIC_FEATURE_VIEW_HISTORY` | `true` | Track product view history |
| Recently Viewed | `NEXT_PUBLIC_FEATURE_RECENTLY_VIEWED` | `true` | Show recently viewed products |

## Usage in Code

### Server Components

```tsx
import { featureFlags } from '@/config/featureFlags';

export default function Page() {
  return (
    <>
      {featureFlags.testimonials && <Testimonials />}
    </>
  );
}
```

### Client Components

```tsx
'use client';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function Component() {
  const showWishlist = useFeatureFlag('wishlist');

  return (
    <>
      {showWishlist && <WishlistButton />}
    </>
  );
}
```

### FeatureFlag Wrapper Component

```tsx
import { FeatureFlag } from '@/components/FeatureFlag';

export default function Component() {
  return (
    <FeatureFlag feature="testimonials" fallback={<p>Coming soon</p>}>
      <Testimonials />
    </FeatureFlag>
  );
}
```

## Feature Details

### Product Reviews
- Location: Product detail pages (`/products/[id]`)
- Shows rating summary, individual reviews, and review submission form
- Reviews are stored client-side (demo mode) - connect to API for production

### Wishlist
- Location: Product cards, product detail page, `/wishlist` page
- Persisted in localStorage
- Heart icon button to add/remove items
- Dedicated page to view and manage wishlist

### Compare Products
- Location: Product cards, product detail page, `/compare` page
- Compare up to 4 products side-by-side
- Floating comparison bar appears when items are added
- Comparison table shows specs, price, availability

## Quick Reference

```bash
# All feature flags with defaults

# Marketing & Engagement
NEXT_PUBLIC_FEATURE_TESTIMONIALS=true
NEXT_PUBLIC_FEATURE_NEWSLETTER=true
NEXT_PUBLIC_FEATURE_WHATSAPP=true
NEXT_PUBLIC_FEATURE_TRUST_BADGES=true

# E-commerce Features
NEXT_PUBLIC_FEATURE_RELATED_PRODUCTS=true
NEXT_PUBLIC_FEATURE_RECOMMENDED_PRODUCTS=true
NEXT_PUBLIC_FEATURE_QUICK_ADD_CART=true
NEXT_PUBLIC_FEATURE_PRODUCT_ZOOM=true
NEXT_PUBLIC_FEATURE_WISHLIST=true
NEXT_PUBLIC_FEATURE_COMPARE_PRODUCTS=true
NEXT_PUBLIC_FEATURE_SHOW_PRICES=true
NEXT_PUBLIC_FEATURE_CHECKOUT=false          # Quote-based model by default

# UI/UX Features
NEXT_PUBLIC_FEATURE_BACK_TO_TOP=true
NEXT_PUBLIC_FEATURE_SEARCH_BAR=true

# User Features
NEXT_PUBLIC_FEATURE_USER_AUTH=true
NEXT_PUBLIC_FEATURE_VIEW_HISTORY=true
NEXT_PUBLIC_FEATURE_RECENTLY_VIEWED=true

# Disabled by default
NEXT_PUBLIC_FEATURE_PRODUCT_REVIEWS=false
```

## Adding New Feature Flags

1. Add the flag to `src/config/featureFlags.ts`:
```typescript
export const featureFlags: FeatureFlags = {
  // ...existing flags
  myNewFeature: envBool(process.env.NEXT_PUBLIC_FEATURE_MY_NEW_FEATURE, false),
};
```

2. Update the `FeatureFlags` interface in the same file

3. Use the flag in your component (see Usage examples above)

4. Document the new flag in this file and `.env.example`
