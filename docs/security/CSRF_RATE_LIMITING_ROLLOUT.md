# CSRF Protection & Rate Limiting Rollout

## Status: ✅ Complete

All API endpoints have been protected with CSRF tokens and rate limiting.

---

## Implementation Summary

### CSRF Protection
- **Pattern:** Double Submit Cookie
- **Token Header:** `X-CSRF-Token`
- **Cookie:** `csrf-token` (accessible to JavaScript)
- **Verification:** Constant-time comparison to prevent timing attacks

### Rate Limiting
- **System:** In-memory (can be upgraded to Redis)
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response:** HTTP 429 with `Retry-After` header

---

## Protected Endpoints

### Admin Endpoints (Rate Limit: 200 req/15min)
- ✅ `POST /api/admin/products` - Create product
- ✅ `PUT /api/admin/products/[id]` - Update product
- ✅ `DELETE /api/admin/products/[id]` - Delete product
- ✅ `POST /api/admin/categories` - Create category
- ✅ `PUT /api/admin/categories/[id]` - Update category
- ✅ `DELETE /api/admin/categories/[id]` - Delete category
- ✅ `POST /api/admin/settings` - Update site settings
- ✅ `POST /api/admin/inventory/supplier-delivery` - Record supplier delivery
- ✅ `POST /api/admin/orders/[id]/fulfill` - Fulfill order
- ✅ `POST /api/admin/upload` - Upload file
- ✅ `POST /api/admin/suppliers` - Create supplier
- ✅ `PUT /api/admin/suppliers/[id]` - Update supplier
- ✅ `DELETE /api/admin/suppliers/[id]` - Delete supplier

### Authentication Endpoints (Rate Limit: 10 req/15min)
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/logout` - User logout
- ✅ `POST /api/auth/forgot-password` - Request password reset
- ✅ `POST /api/auth/reset-password` - Reset password

### Public Endpoints (Rate Limit: 100 req/15min)
- ✅ `POST /api/quotes` - Submit quote request
- ✅ `POST /api/reviews` - Submit review
- ✅ `POST /api/user/addresses` - Create address
- ✅ `PUT /api/user/addresses/[id]` - Update address
- ✅ `DELETE /api/user/addresses/[id]` - Delete address

### Excluded Endpoints
- `GET` requests (read-only, no CSRF needed)
- `/api/webhooks/*` (use signature verification instead)
- `/api/csrf-token` (token generation endpoint)

---

## Usage Pattern

### Server-Side (API Routes)
```typescript
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  // ... handler logic
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));
```

### Client-Side
The `CsrfProvider` component automatically:
1. Fetches CSRF token on mount
2. Stores token in cookie
3. Includes token in all requests via `X-CSRF-Token` header

For manual token handling:
```typescript
import { getCsrfHeaders, fetchWithCsrf } from '@/lib/security/csrf-client';

// Option 1: Get headers for fetch
const headers = getCsrfHeaders();
fetch('/api/endpoint', { headers, method: 'POST', body: JSON.stringify(data) });

// Option 2: Use helper function
await fetchWithCsrf('/api/endpoint', { method: 'POST', body: JSON.stringify(data) });
```

---

## Rate Limit Configurations

| Endpoint Type | Max Requests | Window | Key Prefix |
|--------------|--------------|--------|------------|
| Public API | 100 | 15 minutes | `api:public` |
| Admin API | 200 | 15 minutes | `api:admin` |
| Auth Endpoints | 10 | 15 minutes | `api:auth` |
| Payment Webhooks | 10 | 1 minute | (existing) |

---

## Testing

### CSRF Protection
1. Make a POST request without `X-CSRF-Token` header → Should return 403
2. Make a POST request with invalid token → Should return 403
3. Make a POST request with valid token → Should succeed

### Rate Limiting
1. Make multiple requests rapidly → Should return 429 after limit
2. Check response headers for rate limit info
3. Wait for window to reset → Should allow requests again

---

## Future Enhancements

1. **Redis Rate Limiting:** Upgrade from in-memory to Redis for distributed rate limiting
2. **User-Based Rate Limiting:** Different limits for authenticated vs anonymous users
3. **Adaptive Rate Limiting:** Adjust limits based on user behavior
4. **Rate Limit Dashboard:** Admin interface to view and adjust rate limits

---

## Notes

- CSRF tokens are automatically refreshed by `CsrfProvider`
- Rate limit counters reset at the end of each window
- Webhook endpoints use signature verification instead of CSRF (more secure for external services)
- GET requests are excluded from CSRF checks (read-only operations)

