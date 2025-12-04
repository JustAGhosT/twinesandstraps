# Testing & QA

## Overview

The project uses Jest with React Testing Library for unit and integration testing. Tests are organized by type (api, components, contexts) within the `src/__tests__` directory.

## Testing Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Jest** | 29.7.0 | Test runner |
| **@testing-library/react** | 16.3.0 | React component testing |
| **@testing-library/jest-dom** | 6.6.3 | Extended DOM matchers |
| **ts-jest** | 29.2.5 | TypeScript support |
| **jest-environment-jsdom** | 29.7.0 | Browser environment |

## Configuration

### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid)/)',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Jest Setup

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
```

## Test Directory Structure

```
src/__tests__/
├── api/
│   ├── api-response.test.ts    # API response helpers
│   ├── settings.test.ts        # Settings API tests
│   ├── image-cache.test.ts     # Image cache tests
│   └── upload.test.ts          # Upload API tests
├── components/
│   └── WhatsAppButton.test.tsx # Component tests
└── contexts/
    └── SiteSettingsContext.test.tsx # Context tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- WhatsAppButton

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

## Writing Tests

### Component Test Example

```typescript
// src/__tests__/components/WhatsAppButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatsAppButton from '@/components/WhatsAppButton';

// Mock dependencies
jest.mock('@/contexts/SiteSettingsContext', () => ({
  useSiteSettings: jest.fn(),
}));

describe('WhatsAppButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the WhatsApp button', () => {
    render(<WhatsAppButton />);

    const button = screen.getByRole('button', {
      name: /contact us on whatsapp/i
    });
    expect(button).toBeInTheDocument();
  });

  it('should open WhatsApp with correct URL', () => {
    const mockWindowOpen = jest.fn();
    window.open = mockWindowOpen;

    render(<WhatsAppButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/'),
      '_blank',
      'noopener,noreferrer'
    );
  });
});
```

### API Test Example

```typescript
// src/__tests__/api/api-response.test.ts
import { successResponse, errorResponse } from '@/types/api';

describe('API Response Helpers', () => {
  describe('successResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data, 'Success');

      expect(response).toEqual({
        success: true,
        message: 'Success',
        data: { id: 1, name: 'Test' },
      });
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', () => {
      const response = errorResponse('Something went wrong');

      expect(response).toEqual({
        success: false,
        message: 'Something went wrong',
        error: 'Something went wrong',
      });
    });

    it('should include validation details', () => {
      const details = { email: 'Invalid email' };
      const response = errorResponse('Validation failed', details);

      expect(response.details).toEqual(details);
    });
  });
});
```

### Context Test Example

```typescript
// src/__tests__/contexts/SiteSettingsContext.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SiteSettingsProvider, useSiteSettings } from '@/contexts/SiteSettingsContext';

// Test component to access context
function TestComponent() {
  const { settings, loading } = useSiteSettings();

  if (loading) return <div>Loading...</div>;
  return <div>{settings.companyName}</div>;
}

describe('SiteSettingsContext', () => {
  it('should provide default settings', async () => {
    render(
      <SiteSettingsProvider>
        <TestComponent />
      </SiteSettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Twines and Straps/)).toBeInTheDocument();
    });
  });
});
```

## Mocking Patterns

### Mocking Contexts

```typescript
jest.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    items: [],
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    getTotalItems: () => 0,
  }),
}));
```

### Mocking API Calls

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  })
) as jest.Mock;
```

### Mocking Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

### Mocking localStorage

```typescript
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});
```

## Test Utilities

### Custom Render with Providers

```typescript
// src/__tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { Providers } from '@/components/Providers';

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: Providers,
    ...options,
  });
}

export * from '@testing-library/react';
export { customRender as render };
```

## Coverage Configuration

### Coverage Thresholds (Recommended)

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
},
```

### Coverage Report

```bash
npm run test:coverage
```

Generates reports in `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml
test:
  name: Run Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npx prisma generate
    - run: npm test -- --ci --passWithNoTests
```

## Testing Best Practices

### Do

- Test behavior, not implementation
- Use descriptive test names
- Test error states and edge cases
- Mock external dependencies
- Keep tests isolated
- Use `beforeEach` for setup
- Clean up after tests

### Don't

- Test third-party library code
- Write tests that depend on each other
- Use arbitrary timeouts
- Test private implementation details
- Over-mock (prefer integration tests)

## Test Naming Convention

```typescript
describe('ComponentName', () => {
  describe('feature or method', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test
    });
  });
});
```

## E2E Testing (Future)

Consider adding Playwright for E2E tests:

```bash
npm install -D @playwright/test
npx playwright install
```

Critical flows to test:
- Product browsing and search
- Add to cart flow
- User registration/login
- Admin product management

## Related Documentation

- [Tooling & Dev Experience](./07-tooling-dev-experience.md)
- [Best Practices - Testing](../best-practices/04-testing.md)
