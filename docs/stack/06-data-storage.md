# Data & Storage

## Overview

The application uses PostgreSQL as the primary database, accessed through Prisma ORM, with Azure Blob Storage for file uploads and localStorage for client-side persistence.

## Database Architecture

### Primary Database: PostgreSQL

| Attribute | Value |
|-----------|-------|
| **Provider** | Azure PostgreSQL Flexible Server |
| **ORM** | Prisma 6.19.0 |
| **Migration Tool** | Prisma Migrate |
| **Connection Pooling** | Prisma built-in |

### Connection Configuration

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}
```

### Connection String Format

```bash
# Azure PostgreSQL
DATABASE_URL="postgresql://{username}:{password}@{server}.postgres.database.azure.com:5432/{database}?sslmode=require"

# Local Development
DATABASE_URL="postgresql://user:password@localhost:5432/twinesandstraps"
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Product   │──────▶│  Category   │       │  Supplier   │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                           ▲
       │                                           │
       └───────────────────────────────────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │──────▶│   Address   │       │   Order     │
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │                     │
       │                     └─────────────────────┘
       │
       ▼
┌─────────────┐       ┌─────────────┐
│   Review    │       │ ViewHistory │
└─────────────┘       └─────────────┘
```

### Core Models

#### Product

```prisma
model Product {
  id              Int       @id @default(autoincrement())
  name            String
  sku             String    @unique
  description     String
  material        String?
  diameter        Float?
  length          Float?
  strength_rating String?
  price           Float
  vat_applicable  Boolean   @default(true)
  stock_status    String    @default("IN_STOCK")
  image_url       String?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Third-party product fields
  is_third_party    Boolean   @default(false)
  supplier_id       Int?
  supplier_sku      String?
  supplier_price    Float?
  markup_percentage Float?
  last_synced_at    DateTime?

  // Relations
  category_id  Int
  category     Category      @relation(fields: [category_id], references: [id])
  supplier     Supplier?     @relation(fields: [supplier_id], references: [id])
  order_items  OrderItem[]
  view_history ViewHistory[]
  reviews      Review[]
}
```

#### User

```prisma
model User {
  id                Int       @id @default(autoincrement())
  name              String
  email             String    @unique
  phone             String?
  password_hash     String
  role              String    @default("CUSTOMER")
  marketing_consent Boolean   @default(false)
  created_at        DateTime  @default(now())
  last_login        DateTime?

  // Relations
  addresses             Address[]
  orders                Order[]
  view_history          ViewHistory[]
  password_reset_tokens PasswordResetToken[]
  reviews               Review[]
}
```

#### Order

```prisma
model Order {
  id                  Int       @id @default(autoincrement())
  order_number        String    @unique
  user_id             Int
  status              String    @default("PENDING")
  payment_status      String    @default("PENDING")
  payment_method      String?
  subtotal            Float
  vat_amount          Float
  shipping_cost       Float     @default(0)
  total               Float
  notes               String?
  shipping_address_id Int?
  billing_address_id  Int?
  tracking_number     String?
  shipped_at          DateTime?
  delivered_at        DateTime?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  // Relations
  user             User                 @relation(fields: [user_id], references: [id])
  shipping_address Address?             @relation("ShippingAddress", ...)
  billing_address  Address?             @relation("BillingAddress", ...)
  items            OrderItem[]
  status_history   OrderStatusHistory[]
}
```

### Supporting Models

| Model | Purpose |
|-------|---------|
| `Category` | Product categories with slugs |
| `Address` | User addresses (shipping/billing) |
| `OrderItem` | Line items in orders |
| `OrderStatusHistory` | Order status tracking |
| `ViewHistory` | Product view tracking |
| `Review` | Product reviews/testimonials |
| `Supplier` | Third-party product suppliers |
| `AdminSession` | Admin authentication tokens |
| `AdminActivityLog` | Admin audit trail |
| `SiteSetting` | Dynamic site configuration |
| `AdminSetupTask` | Onboarding checklist |
| `PasswordResetToken` | Password reset tokens |
| `ProductImportBatch` | Bulk import tracking |

## Migrations

### Running Migrations

```bash
# Development: Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Production: Apply pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Migration Directory

```
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration history
│   ├── 20240101_init/
│   │   └── migration.sql
│   └── ...
└── seed.ts                # Seed data script
```

### Production Migrations

The deployment pipeline runs migrations via a custom script:

```javascript
// scripts/migrate-production.js
// Handles baselining for existing databases
// Runs prisma migrate deploy
```

## File Storage

### Azure Blob Storage

| Container | Purpose | Access |
|-----------|---------|--------|
| `images` | Product images, logos | Public read |

### Configuration

```bash
# .env
AZURE_STORAGE_ACCOUNT_NAME="devstassastorage"
AZURE_STORAGE_ACCOUNT_KEY="..."
AZURE_STORAGE_CONTAINER_NAME="images"
```

### Upload Implementation

```typescript
// src/lib/blob-storage.ts
import { BlobServiceClient } from '@azure/storage-blob';

export async function uploadToBlob(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );

  const containerClient = blobServiceClient.getContainerClient('images');
  const blobClient = containerClient.getBlockBlobClient(filename);

  await blobClient.upload(file, file.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blobClient.url;
}
```

### Allowed File Types

```typescript
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CSV_SIZE: 10 * 1024 * 1024,  // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_IMPORT_TYPES: ['text/csv', 'application/json'],
};
```

## Client-Side Storage

### localStorage Usage

| Key | Purpose | Data |
|-----|---------|------|
| `tassa_cart` | Shopping cart | Cart items array |
| `tassa_wishlist` | Saved products | Product ID array |
| `tassa_compare` | Comparison list | Product ID array |
| `tassa_theme_mode` | Theme preference | 'light' / 'dark' / 'system' |
| `tassa_theme_colors` | Custom colors | Color object |
| `tassa_recently_viewed` | View history | Product ID array |

### Storage Pattern

```typescript
// Save to localStorage
const saveCart = (items: CartItem[]) => {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
};

// Load from localStorage
const loadCart = (): CartItem[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CART);
  return stored ? JSON.parse(stored) : [];
};
```

## Data Access Patterns

### Repository Pattern

```typescript
// src/lib/data.ts
export async function getProduct(id: string) {
  const productId = parseInt(id, 10);
  if (isNaN(productId) || productId <= 0) return null;

  try {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, supplier: true },
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}
```

### Query Optimization

```typescript
// Select only needed fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    image_url: true,
    category: { select: { name: true, slug: true } },
  },
});

// Use include sparingly
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    supplier: true,
    reviews: {
      where: { status: 'APPROVED' },
      take: 5,
    },
  },
});
```

## Backup & Recovery

### Azure PostgreSQL

- **Automated Backups**: Daily full backups
- **Point-in-Time Recovery**: Up to 35 days
- **Geo-redundant Backups**: Enabled for production

### Backup Schedule

| Environment | Retention | Geo-redundant |
|-------------|-----------|---------------|
| dev | 7 days | No |
| staging | 14 days | No |
| prod | 35 days | Yes |

## Performance Considerations

### Indexing Strategy

```prisma
// Indexes are defined in schema
model Product {
  sku String @unique  // Automatic index

  @@index([category_id])
  @@index([stock_status])
  @@index([created_at])
}

model AdminActivityLog {
  @@index([entity_type])
  @@index([action])
  @@index([created_at])
}
```

### Connection Pooling

Prisma handles connection pooling automatically. For serverless:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

## Related Documentation

- [Backend Stack](./04-backend-stack.md)
- [API Architecture](./05-api-architecture.md)
- [Deployments & Ops](./09-deployments-ops.md)
