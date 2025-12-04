# Accessibility Standards (WCAG 2.1 AA)

## Overview

This document outlines accessibility requirements and implementation guidelines targeting WCAG 2.1 Level AA compliance.

## Core Principles (POUR)

| Principle | Description |
|-----------|-------------|
| **Perceivable** | Information must be presentable in ways users can perceive |
| **Operable** | Interface components must be operable by all users |
| **Understandable** | Information and operation must be understandable |
| **Robust** | Content must be robust enough for various technologies |

## Color Contrast

### Standard: Meet Minimum Contrast Ratios

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+ or 14px+ bold) | 3:1 |
| UI components | 3:1 |

### Implementation

```css
/* ✅ Good - Sufficient contrast */
:root {
  --text-primary: #1a1a1a;    /* On white: 16:1 */
  --text-secondary: #6b6b6b;  /* On white: 5.7:1 */
  --primary: #E31E24;         /* On white: 4.6:1 */
}

/* ❌ Bad - Insufficient contrast */
.light-text {
  color: #a0a0a0;  /* On white: 2.5:1 - fails */
}
```

### Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Accessibility Panel
- axe DevTools extension

## Keyboard Navigation

### Standard: All Interactive Elements Focusable

```tsx
// ✅ Good - Keyboard accessible
<button onClick={handleClick}>
  Click me
</button>

<a href="/products">View Products</a>

// ✅ Good - Custom element with keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Button
</div>

// ❌ Bad - Not keyboard accessible
<div onClick={handleClick}>
  Click me
</div>
```

### Focus Order

```tsx
// ✅ Good - Logical focus order
<form>
  <input name="email" />     {/* Tab 1 */}
  <input name="password" />  {/* Tab 2 */}
  <button type="submit" />   {/* Tab 3 */}
</form>

// ❌ Bad - Disrupted focus order with positive tabIndex
<input tabIndex={3} />
<input tabIndex={1} />
<input tabIndex={2} />
```

## Focus Indicators

### Standard: Visible Focus States

```css
/* ✅ Good - Clear focus indicator */
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ✅ Good - Custom focus ring */
.focus-ring:focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}

/* ❌ Bad - Removing focus without replacement */
button:focus {
  outline: none;
}
```

## Skip Links

### Standard: Provide Skip Navigation

```tsx
// src/components/SkipLink.tsx
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white"
    >
      Skip to main content
    </a>
  );
}

// Usage in layout
<body>
  <SkipLink />
  <Header />
  <main id="main-content">
    {children}
  </main>
</body>
```

## Semantic HTML

### Standard: Use Proper HTML Elements

```tsx
// ✅ Good - Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Product Name</h1>
    <section aria-labelledby="description-heading">
      <h2 id="description-heading">Description</h2>
      <p>...</p>
    </section>
  </article>
</main>

<footer>...</footer>

// ❌ Bad - Div soup
<div class="header">
  <div class="nav">
    <div class="nav-item">Home</div>
  </div>
</div>
```

### Heading Hierarchy

```tsx
// ✅ Good - Proper hierarchy
<h1>Products</h1>
  <h2>Ropes</h2>
    <h3>Polypropylene Rope</h3>
  <h2>Twines</h2>
    <h3>Sisal Twine</h3>

// ❌ Bad - Skipped levels
<h1>Products</h1>
<h3>Ropes</h3>  {/* Skipped h2 */}
<h4>Twine</h4>
```

## ARIA Labels

### Standard: Label Non-Text Controls

```tsx
// ✅ Good - Icon button with label
<button aria-label="Add to cart">
  <CartIcon aria-hidden="true" />
</button>

// ✅ Good - Close button
<button aria-label="Close modal">
  <XIcon aria-hidden="true" />
</button>

// ✅ Good - Link with context
<a href="/products/1" aria-label="View Rope 10mm details">
  View Details
</a>

// ❌ Bad - No accessible name
<button>
  <CartIcon />
</button>
```

### ARIA States

```tsx
// ✅ Good - Toggle state
<button
  aria-pressed={isExpanded}
  aria-expanded={isExpanded}
  onClick={() => setIsExpanded(!isExpanded)}
>
  {isExpanded ? 'Collapse' : 'Expand'}
</button>

// ✅ Good - Loading state
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

## Form Accessibility

### Standard: Label All Inputs

```tsx
// ✅ Good - Explicit label association
<label htmlFor="email">Email Address</label>
<input id="email" type="email" name="email" />

// ✅ Good - Wrapped label
<label>
  Email Address
  <input type="email" name="email" />
</label>

// ✅ Good - Visually hidden label
<label htmlFor="search" className="sr-only">
  Search products
</label>
<input id="search" type="search" placeholder="Search..." />

// ❌ Bad - No label
<input type="email" placeholder="Email" />
```

### Error Messages

```tsx
// ✅ Good - Associated error message
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" role="alert">
      {error}
    </span>
  )}
</div>
```

## Image Accessibility

### Standard: Provide Alt Text

```tsx
// ✅ Good - Descriptive alt text
<Image
  src={product.image_url}
  alt="10mm polypropylene rope coiled on wooden pallet"
/>

// ✅ Good - Decorative image
<Image
  src="/decorative-pattern.png"
  alt=""
  aria-hidden="true"
/>

// ❌ Bad - Missing or useless alt
<Image src={product.image_url} alt="image" />
<Image src={product.image_url} alt={product.image_url} />
```

## Motion and Animation

### Standard: Respect User Preferences

```css
/* ✅ Good - Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// ✅ Good - Check preference in JS
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // Run animation
}
```

## Screen Reader Testing

### Tools

- **NVDA** (Windows, free)
- **VoiceOver** (macOS/iOS, built-in)
- **JAWS** (Windows, commercial)
- **TalkBack** (Android, built-in)

### Key Tests

1. Can all content be accessed?
2. Is focus order logical?
3. Are form labels read correctly?
4. Are error messages announced?
5. Are dynamic updates announced?

## Accessibility Checklist

| Category | Check |
|----------|-------|
| **Contrast** | Text meets 4.5:1 ratio |
| **Keyboard** | All interactive elements reachable |
| **Focus** | Visible focus indicators |
| **Skip Link** | Skip to main content available |
| **Headings** | Proper hierarchy, no skipped levels |
| **Labels** | All inputs have labels |
| **Images** | Descriptive alt text |
| **Links** | Descriptive link text |
| **ARIA** | Icons and buttons labeled |
| **Errors** | Associated with inputs |
| **Motion** | Respects reduced motion |

## Tailwind CSS Utilities

```css
/* Screen reader only (visually hidden) */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
  clip: rect(0, 0, 0, 0);
}

/* Visible when focused */
.focus\:not-sr-only:focus {
  @apply static w-auto h-auto p-0 m-0 overflow-visible whitespace-normal;
  clip: auto;
}
```

## Related Documentation

- [Frontend Stack](../stack/02-frontend-stack.md)
- [Testing](./04-testing.md)
