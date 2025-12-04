# Security Best Practices

## Overview

This document outlines security best practices aligned with OWASP guidelines and framework-specific recommendations for the Next.js/Prisma stack.

## Input Validation

### Standard: Validate ALL Inputs with Zod

```typescript
// ✅ Good - Schema validation
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(50),
  price: z.number().positive(),
  category_id: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = createProductSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, errors: validation.error.issues },
      { status: 400 }
    );
  }

  // Use validated data
  const product = await prisma.product.create({
    data: validation.data,
  });
}
```

```typescript
// ❌ Bad - No validation
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Directly using unvalidated input
  const product = await prisma.product.create({
    data: body, // Dangerous!
  });
}
```

### Validation Rules

| Input Type | Validation |
|------------|------------|
| **Strings** | Min/max length, pattern matching |
| **Numbers** | Type, range, positive/negative |
| **IDs** | Integer, positive |
| **Email** | Email format |
| **URL** | URL format |
| **Enum** | Allowed values |

## SQL Injection Prevention

### Standard: Use Prisma Parameterized Queries

```typescript
// ✅ Good - Prisma ORM (parameterized)
const products = await prisma.product.findMany({
  where: {
    name: { contains: searchTerm, mode: 'insensitive' },
    category_id: categoryId,
  },
});

// ✅ Good - Raw query with parameters
const results = await prisma.$queryRaw`
  SELECT * FROM products WHERE name ILIKE ${`%${searchTerm}%`}
`;
```

```typescript
// ❌ Bad - String concatenation (SQL injection vulnerable)
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'`
);
```

## XSS Prevention

### Standard: Let React Handle Escaping

```tsx
// ✅ Good - React escapes by default
function ProductDescription({ description }) {
  return <p>{description}</p>;
}

// ✅ Good - Sanitize if HTML is needed
import DOMPurify from 'dompurify';

function ProductDescription({ htmlContent }) {
  const sanitized = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

```tsx
// ❌ Bad - Unsanitized HTML
function ProductDescription({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}
```

## Authentication

### Standard: Secure Session Management

```typescript
// Session token generation
import { randomBytes } from 'crypto';

function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Secure cookie settings
cookies().set('admin_session', token, {
  httpOnly: true,           // Prevent XSS access
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'lax',          // CSRF protection
  maxAge: 60 * 60 * 24,     // 24 hours
  path: '/',
});
```

### Password Requirements

```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain a number');
```

### Password Hashing

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hash = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

## Authorization

### Standard: Check Permissions on Every Request

```typescript
// ✅ Good - Permission check
export async function PUT(request: NextRequest, { params }) {
  // Verify admin session
  const isAdmin = await validateAdminSession();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Proceed with authorized action
}
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| **Customer** | View products, manage own orders |
| **Editor** | Create/edit own products |
| **Admin** | Full access |

## Secrets Management

### Standard: Never Commit Secrets

```bash
# .env (NEVER commit)
DATABASE_URL="postgresql://..."
ADMIN_PASSWORD="..."
AZURE_STORAGE_KEY="..."

# .env.example (safe to commit)
DATABASE_URL="postgresql://user:password@host/db"
ADMIN_PASSWORD="your-secure-password"
AZURE_STORAGE_KEY="your-storage-key"
```

### Environment Variables

```typescript
// ✅ Good - Server-side only
const apiKey = process.env.API_KEY; // Only on server

// ✅ Good - Public variables
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL; // Available on client
```

## CSRF Protection

### Standard: SameSite Cookies + Origin Validation

```typescript
// Cookie with SameSite
cookies().set('session', token, {
  sameSite: 'lax', // or 'strict'
});

// Origin validation for state-changing requests
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL];

  if (!allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { success: false, error: 'Invalid origin' },
      { status: 403 }
    );
  }
}
```

## Rate Limiting

### Standard: Implement on Sensitive Endpoints

```typescript
// Rate limiting configuration
export const RATE_LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
  MAX_API_REQUESTS_PER_MINUTE: 60,
};

// Implementation example
const attempts = await getLoginAttempts(email);
if (attempts >= RATE_LIMITS.MAX_LOGIN_ATTEMPTS) {
  return NextResponse.json(
    { success: false, error: 'Too many attempts. Try again later.' },
    { status: 429 }
  );
}
```

## Security Headers

### Standard: Configure Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## External Links

### Standard: Use noopener noreferrer

```tsx
// ✅ Good - Secure external link
<a
  href="https://external-site.com"
  target="_blank"
  rel="noopener noreferrer"
>
  External Link
</a>

// ✅ Good - window.open with security
window.open(url, '_blank', 'noopener,noreferrer');
```

## File Upload Security

### Standard: Validate File Type and Size

```typescript
const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Validate type
  if (!FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid file type' },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > FILE_LIMITS.MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'File too large' },
      { status: 400 }
    );
  }

  // Generate safe filename
  const safeFilename = `${uuidv4()}.${file.type.split('/')[1]}`;
}
```

## Dependency Security

### Standard: Regular Audits and Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Security Checklist

| Category | Check |
|----------|-------|
| **Input** | All inputs validated with Zod |
| **Database** | Using Prisma parameterized queries |
| **Auth** | Secure session tokens, httpOnly cookies |
| **Passwords** | bcrypt hashing, strong requirements |
| **CSRF** | SameSite cookies enabled |
| **XSS** | No unsafe innerHTML |
| **Secrets** | No secrets in code, using env vars |
| **Headers** | Security headers configured |
| **Files** | Type and size validation |
| **External Links** | noopener noreferrer |
| **Dependencies** | Regular audit |

## Related Documentation

- [Backend Stack](../stack/04-backend-stack.md)
- [Error Handling](./11-error-handling.md)
