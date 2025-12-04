# Testing Standards

## Overview

This document outlines testing strategies, coverage standards, and best practices for the Jest/React Testing Library stack.

## Testing Pyramid

```
        /\
       /  \     E2E Tests (10%)
      /----\    Critical user flows
     /      \
    /--------\  Integration Tests (20%)
   /          \ API routes, database
  /------------\
 /              \ Unit Tests (70%)
/________________\ Components, utilities, hooks
```

## Coverage Targets

| Test Type | Coverage | Focus |
|-----------|----------|-------|
| **Unit** | 70-80% | Business logic, utilities |
| **Component** | 60-70% | Key UI components |
| **Integration** | 40-50% | API routes, data flow |
| **E2E** | Critical paths | User journeys |

## Unit Testing

### Standard: Test Behavior, Not Implementation

```typescript
// ✅ Good - Test behavior
describe('formatPrice', () => {
  it('should format ZAR currency with two decimal places', () => {
    expect(formatPrice(1234.5)).toBe('R1,234.50');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('R0.00');
  });
});

// ❌ Bad - Test implementation
describe('formatPrice', () => {
  it('should call toFixed(2)', () => {
    const spy = jest.spyOn(Number.prototype, 'toFixed');
    formatPrice(100);
    expect(spy).toHaveBeenCalledWith(2);
  });
});
```

### Validation Testing

```typescript
describe('createProductSchema', () => {
  it('should accept valid product data', () => {
    const validProduct = {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99,
      category_id: 1,
    };

    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject negative price', () => {
    const invalidProduct = {
      name: 'Test',
      sku: 'TEST-001',
      price: -10,
      category_id: 1,
    };

    const result = createProductSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('price');
  });
});
```

## Component Testing

### Standard: Test User Interactions

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 99.99,
    stock_status: 'IN_STOCK',
  };

  it('should display product information', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('R99.99')).toBeInTheDocument();
  });

  it('should add product to cart on button click', async () => {
    const mockAddToCart = jest.fn();
    jest.mock('@/contexts/CartContext', () => ({
      useCart: () => ({ addToCart: mockAddToCart }),
    }));

    render(<ProductCard product={mockProduct} />);

    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('should disable add button when out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      stock_status: 'OUT_OF_STOCK',
    };

    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
  });
});
```

### Accessibility Testing

```tsx
it('should have accessible button label', () => {
  render(<WhatsAppButton />);

  const button = screen.getByRole('button', {
    name: /contact us on whatsapp/i,
  });

  expect(button).toHaveAttribute('aria-label', 'Contact us on WhatsApp');
});

it('should be keyboard accessible', () => {
  render(<SearchBar />);

  const input = screen.getByRole('searchbox');
  input.focus();

  expect(document.activeElement).toBe(input);
});
```

## Integration Testing

### API Route Testing

```typescript
import { GET, POST } from '@/app/api/products/route';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  product: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(2);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with valid data', async () => {
      const newProduct = {
        name: 'New Product',
        sku: 'NEW-001',
        price: 99.99,
        category_id: 1,
      };

      prisma.product.create.mockResolvedValue({ id: 1, ...newProduct });

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid data', async () => {
      const invalidProduct = { name: '' }; // Missing required fields

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidProduct),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
```

## Context Testing

```tsx
describe('CartContext', () => {
  function TestComponent() {
    const { items, addToCart, getTotalItems } = useCart();
    return (
      <div>
        <span data-testid="count">{getTotalItems()}</span>
        <button onClick={() => addToCart(mockProduct, 1)}>Add</button>
      </div>
    );
  }

  it('should add items to cart', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
```

## Mocking Patterns

### Mocking Modules

```typescript
// Mock entire module
jest.mock('@/lib/prisma', () => ({
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock specific export
jest.mock('@/contexts/CartContext', () => ({
  ...jest.requireActual('@/contexts/CartContext'),
  useCart: jest.fn(),
}));
```

### Mocking Fetch

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
) as jest.Mock;
```

### Mocking Browser APIs

```typescript
// localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen });
```

## Test Organization

### File Naming

```
src/__tests__/
├── api/
│   └── products.test.ts       # API tests
├── components/
│   └── ProductCard.test.tsx   # Component tests
├── contexts/
│   └── CartContext.test.tsx   # Context tests
└── utils/
    └── formatters.test.ts     # Utility tests
```

### Test Structure

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('feature or method', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const props = { ... };

      // Act
      render(<Component {...props} />);

      // Assert
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error when API fails', async () => {
      // Test error states
    });
  });
});
```

## Best Practices

### Do

- Test behavior, not implementation
- Use descriptive test names
- Test edge cases and error states
- Keep tests independent
- Use `beforeEach` for setup
- Mock external dependencies

### Don't

- Test third-party library code
- Write tests that depend on each other
- Use arbitrary timeouts
- Over-mock (prefer real implementations)
- Test private methods directly

## CI Integration

```yaml
test:
  name: Run Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    - run: npm ci
    - run: npx prisma generate
    - run: npm test -- --ci --coverage
    - uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## Related Documentation

- [Testing & QA](../stack/08-testing-qa.md)
- [Error Handling](./11-error-handling.md)
