# API Architecture

## Overview

The application exposes a RESTful API through Next.js Route Handlers. The API is organized by domain with clear separation between public endpoints, authenticated user endpoints, and admin-only endpoints.

## API Structure

```
src/app/api/
├── admin/                    # Admin-only endpoints (protected)
│   ├── auth/
│   │   └── route.ts          # POST: login, DELETE: logout
│   ├── products/
│   │   ├── route.ts          # GET: list, POST: create
│   │   └── [id]/
│   │       └── route.ts      # GET, PUT, DELETE
│   ├── categories/
│   │   ├── route.ts          # GET: list, POST: create
│   │   └── [id]/
│   │       └── route.ts      # GET, PUT, DELETE
│   ├── orders/
│   │   ├── route.ts          # GET: list
│   │   └── [id]/
│   │       └── route.ts      # GET, PUT
│   ├── customers/
│   │   ├── route.ts          # GET: list
│   │   └── [id]/
│   │       └── route.ts      # GET, PUT, DELETE
│   ├── suppliers/
│   │   ├── route.ts          # GET: list, POST: create
│   │   └── [id]/
│   │       ├── route.ts      # GET, PUT, DELETE
│   │       └── import/
│   │           └── route.ts  # POST: bulk import
│   ├── reviews/
│   │   ├── route.ts          # GET: list
│   │   └── [id]/
│   │       └── route.ts      # PUT: moderate
│   ├── settings/
│   │   └── route.ts          # GET, PUT
│   ├── stats/
│   │   └── route.ts          # GET: dashboard stats
│   ├── activity/
│   │   └── route.ts          # GET: activity log
│   ├── upload/
│   │   └── route.ts          # POST: file upload
│   ├── logo/
│   │   └── route.ts          # POST: logo upload
│   └── theme/
│       └── route.ts          # GET, PUT
│
├── auth/                     # Customer authentication
│   ├── login/
│   │   └── route.ts          # POST
│   ├── logout/
│   │   └── route.ts          # POST
│   ├── register/
│   │   └── route.ts          # POST
│   ├── me/
│   │   └── route.ts          # GET: current user
│   ├── forgot-password/
│   │   └── route.ts          # POST
│   └── reset-password/
│       └── route.ts          # POST
│
├── user/                     # Authenticated user endpoints
│   ├── profile/
│   │   └── route.ts          # GET, PUT
│   ├── addresses/
│   │   ├── route.ts          # GET: list, POST: create
│   │   └── [id]/
│   │       └── route.ts      # PUT, DELETE
│   ├── orders/
│   │   ├── route.ts          # GET: list
│   │   └── [id]/
│   │       └── route.ts      # GET: detail
│   └── view-history/
│       └── route.ts          # GET, POST
│
├── products/                 # Public product endpoints
│   ├── route.ts              # GET: list with pagination
│   ├── featured/
│   │   └── route.ts          # GET: featured products
│   └── [id]/
│       └── route.ts          # GET: detail
│
├── categories/
│   └── route.ts              # GET: list
│
├── reviews/
│   └── route.ts              # GET: approved reviews, POST: submit
│
├── settings/
│   └── route.ts              # GET: public site settings
│
├── theme/
│   └── route.ts              # GET: theme settings
│
├── health/
│   └── route.ts              # GET: health check
│
└── images/
    └── cache/
        └── route.ts          # Image caching
```

## API Endpoints Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with pagination/filtering |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/[id]` | Get product details |
| GET | `/api/categories` | List categories |
| GET | `/api/settings` | Get public site settings |
| GET | `/api/reviews` | Get approved reviews |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/health` | Health check |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### User Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/addresses` | List addresses |
| POST | `/api/user/addresses` | Add address |
| PUT | `/api/user/addresses/[id]` | Update address |
| DELETE | `/api/user/addresses/[id]` | Delete address |
| GET | `/api/user/orders` | List orders |
| GET | `/api/user/orders/[id]` | Order details |

### Admin Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/auth` | Admin login |
| DELETE | `/api/admin/auth` | Admin logout |
| GET | `/api/admin/products` | List all products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/[id]` | Update product |
| DELETE | `/api/admin/products/[id]` | Delete product |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/activity` | Activity log |
| POST | `/api/admin/upload` | File upload |

## Request/Response Formats

### Standard Response Format

```typescript
// Success Response
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": { ... }
}

// Error Response
{
  "success": false,
  "message": "Validation failed",
  "error": "Validation failed",
  "details": {
    "name": "Product name is required",
    "price": "Price must be positive"
  }
}
```

### Paginated Response

```typescript
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasMore": true
    }
  }
}
```

## Query Parameters

### Products Listing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | - | Search in name, description, SKU |
| `category` | string | - | Filter by category slug |
| `status` | string | - | Filter by stock status |
| `sort` | string | created_at | Sort field |
| `order` | string | desc | Sort order (asc/desc) |

### Example Request

```bash
GET /api/products?page=1&limit=10&category=ropes&status=IN_STOCK&sort=price&order=asc
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry |
| 500 | Server Error | Internal error |

## Authentication Headers

### Admin Authentication

Admin authentication uses HTTP-only cookies:

```typescript
// Set on login
cookies().set('admin_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24, // 24 hours
});
```

### User Authentication

User authentication also uses cookies:

```typescript
cookies().set('user_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

## Rate Limiting

Currently implemented limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 attempts | 15 minutes |
| `/api/auth/register` | 3 attempts | 15 minutes |
| General API | 60 requests | 1 minute |

## Error Handling Patterns

### Validation Errors

```typescript
const validation = validateBody(schema, body);
if (!validation.success) {
  return NextResponse.json(
    errorResponse('Validation failed', formatZodErrors(validation.errors)),
    { status: 400 }
  );
}
```

### Not Found

```typescript
const product = await prisma.product.findUnique({ where: { id } });
if (!product) {
  return NextResponse.json(
    errorResponse('Product not found'),
    { status: 404 }
  );
}
```

### Database Errors

```typescript
try {
  // Database operation
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        errorResponse('SKU already exists'),
        { status: 409 }
      );
    }
  }
  throw error;
}
```

## Related Documentation

- [Backend Stack](./04-backend-stack.md)
- [Data & Storage](./06-data-storage.md)
- [Best Practices - Security](../best-practices/02-security.md)
