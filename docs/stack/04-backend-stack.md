# Backend Stack

## Overview

The backend is built using Next.js API Routes (Route Handlers) with Prisma as the ORM. It follows a RESTful architecture with centralized validation and standardized response formats.

## Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **API Framework** | Next.js Route Handlers | 14.2.32 | REST API endpoints |
| **ORM** | Prisma | 6.19.0 | Type-safe database access |
| **Validation** | Zod | 4.1.13 | Schema-based input validation |
| **Authentication** | Custom (session-based) | - | Cookie-based sessions |
| **File Storage** | Azure Blob Storage | - | Image uploads |

## Route Handler Structure

### Basic Route Handler

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/types/api';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });

    return NextResponse.json(
      successResponse(products, 'Products retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch products'),
      { status: 500 }
    );
  }
}
```

### Dynamic Route Handler

```typescript
// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = parseInt(params.id, 10);

  if (isNaN(productId)) {
    return NextResponse.json(
      errorResponse('Invalid product ID'),
      { status: 400 }
    );
  }

  // Fetch and return product
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Update product
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Delete product
}
```

## Prisma Configuration

### Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Schema Example

```prisma
// prisma/schema.prisma
model Product {
  id              Int      @id @default(autoincrement())
  name            String
  sku             String   @unique
  description     String
  price           Float
  stock_status    String   @default("IN_STOCK")
  image_url       String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  category_id     Int
  category        Category @relation(fields: [category_id], references: [id])
}
```

## Validation with Zod

### Schema Definition

```typescript
// src/lib/validations.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(50),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  category_id: z.number().int().positive(),
  stock_status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

### Validation Helper

```typescript
// src/lib/validations.ts
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

export function formatZodErrors(errors: z.ZodIssue[]): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const error of errors) {
    formatted[error.path.join('.') || 'general'] = error.message;
  }
  return formatted;
}
```

### Usage in Route Handler

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(createProductSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', formatZodErrors(validation.errors)),
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: validation.data,
    });

    return NextResponse.json(
      successResponse(product, 'Product created'),
      { status: 201 }
    );
  } catch (error) {
    // Handle error
  }
}
```

## API Response Standards

### Response Types

```typescript
// src/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: Record<string, string>;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore?: boolean;
  };
}
```

### Response Helpers

```typescript
// src/types/api.ts
export function successResponse<T>(
  data: T,
  message: string = 'Operation successful'
): ApiSuccessResponse<T> {
  return { success: true, message, data };
}

export function errorResponse(
  error: string,
  details?: Record<string, string>
): ApiErrorResponse {
  return { success: false, message: error, error, details };
}
```

## Authentication

### Admin Authentication

```typescript
// src/lib/admin-auth.ts
import { cookies } from 'next/headers';
import prisma from './prisma';

export async function validateAdminSession(): Promise<boolean> {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');

  if (!session?.value) return false;

  const adminSession = await prisma.adminSession.findUnique({
    where: { token: session.value },
  });

  if (!adminSession || adminSession.expires_at < new Date()) {
    return false;
  }

  return true;
}
```

### User Authentication

```typescript
// src/lib/user-auth.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow login page
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('admin_session');

  if (!session?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

## Data Access Layer

```typescript
// src/lib/data.ts
import prisma from './prisma';

export async function getProduct(id: string) {
  const productId = parseInt(id, 10);
  if (isNaN(productId) || productId <= 0) return null;

  try {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

export async function getRelatedProducts(productId: number, categoryId?: number) {
  // Implementation
}

export async function getFeaturedProducts(count: number = 4) {
  // Implementation
}
```

## File Upload (Azure Blob Storage)

```typescript
// src/lib/blob-storage.ts
import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'images';

export async function uploadFile(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(filename);

  await blockBlobClient.upload(file, file.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}
```

## Error Handling

```typescript
// Standard error handling pattern
export async function GET(request: NextRequest) {
  try {
    // Business logic
    return NextResponse.json(successResponse(data));
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('Validation error', formatZodErrors(error.issues)),
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          errorResponse('Duplicate entry'),
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
```

## Related Documentation

- [API Architecture](./05-api-architecture.md)
- [Data & Storage](./06-data-storage.md)
- [Best Practices - Security](../best-practices/02-security.md)
