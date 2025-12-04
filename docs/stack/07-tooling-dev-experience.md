# Tooling & Dev Experience

## Overview

The development environment is configured for TypeScript-first development with comprehensive tooling for linting, type checking, and testing.

## Package Manager

| Tool | Version | Purpose |
|------|---------|---------|
| **npm** | 9+ | Package management |
| **package-lock.json** | - | Dependency locking |

### Key Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "seed": "tsx prisma/seed.ts",
    "seed:reset": "npx prisma generate && npm run seed"
  }
}
```

## TypeScript Configuration

### Compiler Options

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Key Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `strict` | true | Enable all strict type checks |
| `paths` | `@/*` | Path alias for clean imports |
| `incremental` | true | Faster rebuilds |
| `moduleResolution` | bundler | Modern resolution for Next.js |

### Path Aliases

```typescript
// Instead of:
import { Button } from '../../../components/Button';

// Use:
import { Button } from '@/components/Button';
```

## ESLint Configuration

```json
// .eslintrc.json
{
  "extends": "next/core-web-vitals"
}
```

### What's Included

The `next/core-web-vitals` preset includes:

- Next.js specific rules
- React hooks rules
- Accessibility rules
- Import/export rules
- Core Web Vitals optimizations

### Running ESLint

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## PostCSS Configuration

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## Project Structure

```
twinesandstraps/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docs/                   # Documentation
├── infra/
│   ├── bicep/             # Azure infrastructure
│   └── scripts/           # Deployment scripts
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration history
│   └── seed.ts            # Seed script
├── public/                # Static assets
├── scripts/               # Build/deploy scripts
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   └── ...           # Pages
│   ├── components/       # React components
│   ├── config/           # Feature flags
│   ├── constants/        # App constants
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── types/            # TypeScript types
│   └── __tests__/        # Test files
├── .env.example          # Environment template
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind config
├── tsconfig.json         # TypeScript config
├── jest.config.js        # Jest config
└── package.json          # Dependencies
```

## Development Workflow

### Starting Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Database Operations

```bash
# Create migration
npx prisma migrate dev --name <name>

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Seed database
npm run seed

# Open Prisma Studio
npx prisma studio
```

### Type Generation

```bash
# Generate Prisma types
npx prisma generate

# Check types
npx tsc --noEmit
```

## Constants Organization

```
src/constants/
├── index.ts        # Central export
├── statuses.ts     # Stock status, order status
├── routes.ts       # Route constants
├── api.ts          # API endpoints
├── ui.ts           # Timeouts, storage keys
├── theme.ts        # Brand colors, presets
├── messages.ts     # User messages
└── images.ts       # Image constants
```

### Usage

```typescript
import { STOCK_STATUS, ROUTES, TIMEOUTS } from '@/constants';

if (product.stock_status === STOCK_STATUS.OUT_OF_STOCK) {
  // Handle out of stock
}
```

## Environment Variables

### Local Development

```bash
# Copy template
cp .env.example .env

# Edit with your values
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Required Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | WhatsApp number |
| `AZURE_STORAGE_ACCOUNT_NAME` | Prod | Blob storage account |
| `AZURE_STORAGE_ACCOUNT_KEY` | Prod | Blob storage key |
| `ADMIN_PASSWORD` | No | Admin portal password |

## Debugging

### VS Code Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Prisma Logging

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Code Generation

### Prisma Types

After schema changes:

```bash
npx prisma generate
```

This generates types in `node_modules/@prisma/client`.

### Type Exports

```typescript
// src/types/database.ts
import type {
  Product as PrismaProduct,
  Category as PrismaCategory,
} from '@prisma/client';

export type Product = PrismaProduct;
export type Category = PrismaCategory;

export type ProductWithCategory = Product & {
  category?: Category;
};
```

## Spell Checking

```json
// .cspell.json
{
  "version": "0.2",
  "language": "en",
  "words": [
    "tassa",
    "twines",
    "straps",
    "prisma"
  ]
}
```

## Git Hooks (Recommended)

Consider adding Husky for pre-commit hooks:

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Related Documentation

- [Testing & QA](./08-testing-qa.md)
- [Deployments & Ops](./09-deployments-ops.md)
- [Best Practices - Code Organization](../best-practices/09-code-organization.md)
