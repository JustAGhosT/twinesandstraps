# API Documentation

REST API reference for the Twines and Straps SA platform.

> **Looking for setup instructions?** See the [Setup Guide](../../getting-started/setup.md) for environment configuration.

---

## Overview

This document describes the API endpoints for the TASSA e-commerce platform.

## Authentication

### Admin Authentication

Admin endpoints require authentication via Bearer token or HTTP-only cookie.

**Login:**
```
POST /api/admin/auth
Content-Type: application/json

{
  "password": "your-admin-password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "uuid-session-token",
  "expiry": 1234567890123
}
```

**Logout:**
```
DELETE /api/admin/auth
Authorization: Bearer <token>
```

### Rate Limiting

The login endpoint is rate-limited to 5 attempts per 15 minutes per IP address.

**429 Response:**
```json
{
  "error": "Too many login attempts. Please try again later.",
  "retryAfter": 900
}
```

---

## Public Endpoints

### Products

#### List Products
```
GET /api/products
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search by name, description, or SKU |
| category | string | - | Filter by category slug |
| status | string | - | Filter by stock status (IN_STOCK, LOW_STOCK, OUT_OF_STOCK) |
| sort | string | created_at | Sort field (name, price, created_at, updated_at) |
| order | string | desc | Sort order (asc, desc) |

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

#### Get Single Product
```
GET /api/products/{id}
```

**Response:**
```json
{
  "id": 1,
  "name": "Product Name",
  "sku": "SKU-001",
  "description": "...",
  "price": 99.99,
  "stock_status": "IN_STOCK",
  "category": {
    "id": 1,
    "name": "Category",
    "slug": "category"
  }
}
```

### Categories

#### List Categories
```
GET /api/categories
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| parentOnly | boolean | false | Only return top-level categories |
| includeProducts | boolean | false | Include products in response |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Category Name",
    "slug": "category-slug",
    "parent_id": null,
    "_count": {
      "products": 10
    }
  }
]
```

---

## Admin Endpoints

All admin endpoints require authentication.

### Dashboard Stats
```
GET /api/admin/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalProducts": 100,
  "totalCategories": 10,
  "lowStockProducts": 5,
  "outOfStockProducts": 2
}
```

### Products Management

#### Create Product
```
POST /api/admin/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "sku": "SKU-001",
  "description": "Product description",
  "price": 99.99,
  "category_id": 1,
  "stock_status": "IN_STOCK",
  "vat_applicable": true,
  "material": "Cotton",
  "diameter": 10.5,
  "length": 100,
  "strength_rating": "500kg",
  "image_url": "/uploads/image.jpg"
}
```

**Validation Rules:**
- `name`: Required, max 255 characters
- `sku`: Required, unique, max 50 characters
- `description`: Required
- `price`: Required, positive number
- `category_id`: Required, must exist
- `stock_status`: IN_STOCK, LOW_STOCK, or OUT_OF_STOCK

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Product Name",
  ...
}
```

#### Update Product
```
PUT /api/admin/products/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 149.99
}
```

**Response:** `200 OK`

#### Delete Product
```
DELETE /api/admin/products/{id}
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Categories Management

#### Create Category
```
POST /api/admin/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Category Name",
  "slug": "category-slug",
  "parent_id": null
}
```

**Validation Rules:**
- `name`: Required, max 100 characters
- `slug`: Required, unique, lowercase letters, numbers, and hyphens only
- `parent_id`: Optional, must exist if provided

#### Update Category
```
PUT /api/admin/categories/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Category
```
DELETE /api/admin/categories/{id}
Authorization: Bearer <token>
```

**Note:** Cannot delete categories with products or subcategories.

### File Upload
```
POST /api/admin/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**Allowed File Types:**
- `.jpg`, `.jpeg` (image/jpeg)
- `.png` (image/png)
- `.webp` (image/webp)
- `.gif` (image/gif)
- `.svg` (image/svg+xml)

**Max File Size:** 5MB

**Response:**
```json
{
  "url": "/uploads/uuid.jpg",
  "filename": "uuid.jpg",
  "size": 12345,
  "type": "image/jpeg"
}
```

### Site Settings

#### Get Settings
```
GET /api/admin/settings
Authorization: Bearer <token>
```

#### Update Settings
```
POST /api/admin/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "Company Name",
  "email": "email@example.com",
  "phone": "+27 123 456 7890",
  "whatsappNumber": "27123456789",
  "vatRate": "15"
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request - Validation Error:**
```json
{
  "error": "Validation failed",
  "details": {
    "name": "Product name is required",
    "price": "Price must be positive"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized. Please log in."
}
```

**404 Not Found:**
```json
{
  "error": "Product not found"
}
```

**409 Conflict:**
```json
{
  "error": "Duplicate SKU",
  "details": {
    "sku": "A product with this SKU already exists"
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create product. Please try again."
}
```

---

## Security Considerations

1. **Authentication**: All admin endpoints require a valid session token
2. **Rate Limiting**: Login endpoint is rate-limited to prevent brute force attacks
3. **Input Validation**: All inputs are validated using Zod schemas
4. **File Upload**: Only specific image types allowed, max 5MB
5. **CSRF Protection**: HTTP-only cookies with SameSite=Strict
6. **No Default Password**: Admin password MUST be set via environment variable
