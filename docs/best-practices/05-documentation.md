# Documentation Standards

## Overview

This document outlines documentation conventions for code, APIs, and project documentation.

## Code Documentation

### JSDoc Comments

```typescript
/**
 * Validates and creates a new product in the database.
 *
 * @param data - The product data to create
 * @returns The created product with its generated ID
 * @throws {ValidationError} If the data fails schema validation
 * @throws {PrismaClientKnownRequestError} If SKU already exists
 *
 * @example
 * const product = await createProduct({
 *   name: 'Rope 10mm',
 *   sku: 'ROPE-10MM',
 *   price: 99.99,
 *   category_id: 1,
 * });
 */
export async function createProduct(data: CreateProductInput): Promise<Product> {
  // Implementation
}
```

### When to Use JSDoc

| Situation | Documentation |
|-----------|---------------|
| **Public APIs** | Full JSDoc with params, returns, throws |
| **Complex Logic** | Explain the "why" |
| **Type Definitions** | Document interfaces |
| **Constants** | Document purpose and valid values |

### Inline Comments

```typescript
// ✅ Good - Explain why
// Skip validation for admin users to allow manual SKU override
if (!isAdmin) {
  validateSku(sku);
}

// ❌ Bad - Explain what (obvious from code)
// Loop through products
for (const product of products) {
  // ...
}
```

## Type Documentation

### Interface Documentation

```typescript
/**
 * Represents a product in the catalog.
 */
export interface Product {
  /** Unique identifier */
  id: number;

  /** Display name shown to customers */
  name: string;

  /** Stock Keeping Unit - must be unique */
  sku: string;

  /** Price in ZAR, excluding VAT */
  price: number;

  /** Current availability status */
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}
```

### Enum Documentation

```typescript
/**
 * Stock status options for products.
 * Used for inventory management and display.
 */
export const STOCK_STATUS = {
  /** Product is available for purchase */
  IN_STOCK: 'IN_STOCK',

  /** Limited quantity remaining (< 10 units) */
  LOW_STOCK: 'LOW_STOCK',

  /** No inventory available */
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;
```

## API Documentation

### Route Handler Documentation

```typescript
/**
 * Products API
 *
 * @route GET /api/products
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query search - Search term for name/description
 * @query category - Filter by category slug
 * @query status - Filter by stock status
 * @returns {PaginatedData<Product>} Paginated product list
 *
 * @example
 * GET /api/products?page=1&limit=10&category=ropes
 *
 * @response 200
 * {
 *   "success": true,
 *   "data": {
 *     "items": [...],
 *     "pagination": { "page": 1, "limit": 10, "total": 100 }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

### API.md Format

```markdown
# Products API

## List Products

Get a paginated list of products.

### Request

```
GET /api/products
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search term |

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Rope 10mm",
        "price": 99.99
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid query parameters |
| 500 | Server error |
```

## README Structure

```markdown
# Project Name

Brief description of the project.

## Features

- Feature 1
- Feature 2

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](./docs/SETUP.md) | Environment setup |
| [API Reference](./docs/API.md) | API documentation |

## Tech Stack

- Next.js 14
- TypeScript
- PostgreSQL

## Contributing

Instructions for contributors.

## License

License information.
```

## Architecture Decision Records (ADRs)

### ADR Template

```markdown
# ADR-XXX: [Short Title]

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Decision Makers:** [Names/Roles]

## Context and Problem Statement

What is the issue that we're seeing that is motivating this decision?

## Decision Drivers

- Driver 1
- Driver 2

## Considered Options

### Option 1: [Name]

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1

### Option 2: [Name]

...

## Decision Outcome

**Chosen Option:** [Option Name]

### Rationale

Why this option was chosen.

### Consequences

#### Positive
- Benefit 1

#### Negative
- Drawback 1

## Links

- Related ADR
- External documentation
```

## Environment Documentation

### .env.example

```bash
# =============================================================================
# Application Environment Variables
# =============================================================================
# Copy this file to .env and fill in your values.
# NEVER commit .env with real secrets.

# -----------------------------------------------------------------------------
# DATABASE
# -----------------------------------------------------------------------------
# PostgreSQL connection string
# Format: postgresql://user:password@host:port/database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# -----------------------------------------------------------------------------
# SITE CONFIGURATION
# -----------------------------------------------------------------------------
# Public URL of your site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Changelog

### CHANGELOG.md Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Product catalog
- Admin portal
```

## Documentation Checklist

| Type | Requirement |
|------|-------------|
| **README** | Project overview, setup, tech stack |
| **API** | All endpoints documented |
| **ADRs** | Significant decisions recorded |
| **Code** | Public APIs have JSDoc |
| **Types** | Interfaces documented |
| **Environment** | All vars in .env.example |
| **Changelog** | Changes tracked |

## Related Documentation

- [Code Organization](./09-code-organization.md)
- [API Architecture](../stack/05-api-architecture.md)
