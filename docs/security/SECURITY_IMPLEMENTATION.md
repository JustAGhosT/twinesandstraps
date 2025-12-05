# Security Implementation Guide

## Overview

This document outlines the security features implemented in the TASSA e-commerce platform, including CSRF protection, rate limiting, and POPIA compliance.

---

## 1. CSRF Protection

### Implementation

**Location:** `src/lib/security/csrf.ts`

**Pattern:** Double Submit Cookie

**How it works:**

1. Server generates a CSRF token and sets it in a cookie (`csrf-token`)
2. Client reads the token from the cookie and includes it in the `X-CSRF-Token` header
3. Server verifies that the cookie token matches the header token

**Protected Endpoints:**

- All POST, PUT, DELETE, PATCH API routes
- Excludes: GET, HEAD, OPTIONS requests
- Excludes: Webhook endpoints (they use signature verification)

**Client Integration:**

- `CsrfProvider` component automatically fetches token on mount
- Token is stored in cookie and automatically included in requests
- Helper functions in `src/lib/security/csrf-client.ts` for manual token handling

**Usage in API Routes:**

```typescript
import { requireCsrfToken } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;
  
  // ... rest of handler
}
```

---

## 2. Rate Limiting

### Rate Limiting Implementation

**Location:** `src/lib/rate-limit.ts` and `src/lib/security/rate-limit-wrapper.ts`

**Current System:** In-memory rate limiting (can be upgraded to Redis)

**Rate Limit Configurations:**

| Endpoint Type | Max Requests | Window |
|--------------|--------------|--------|
| Public API | 100 | 15 minutes |
| Admin API | 200 | 15 minutes |
| Auth Endpoints | 10 | 15 minutes |
| Payment Webhooks | 10 | 1 minute |
| Newsletter Signup | 3 | 1 hour |

**Usage:**

```typescript
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

async function handlePOST(request: NextRequest) {
  // ... handler logic
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));
```

**Response Headers:**

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when the limit resets
- `Retry-After`: Seconds to wait before retrying (on 429)

---

## 3. POPIA Compliance (In Progress)

### Requirements

**POPIA (Protection of Personal Information Act)** is South Africa's data protection law.

**Key Requirements:**

1. **Consent Management**

   - Users must consent to data collection
   - Clear privacy policy
   - Opt-in for marketing communications

2. **Data Access Rights**

   - Users can request their data
   - Data export functionality
   - Data deletion (right to be forgotten)

3. **Data Security**

   - Encryption of sensitive data
   - Secure storage
   - Access controls

4. **Data Breach Notification**

   - Notification procedures
   - Incident response plan

### Implementation Status

- [ ] User consent management UI
- [ ] Privacy policy page
- [ ] Data export API endpoint
- [ ] Data deletion API endpoint
- [ ] Cookie consent banner
- [ ] Data retention policies
- [ ] Audit logging for data access

---

## 4. Security Audit Checklist

### Authentication & Authorization

- [x] Admin authentication with secure sessions
- [x] User authentication system
- [x] Password hashing (bcrypt)
- [x] Session management
- [ ] Two-factor authentication (optional)
- [ ] Password strength requirements

### Input Validation

- [x] Zod schema validation
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React auto-escaping)
- [ ] File upload validation
- [ ] URL validation

### API Security

- [x] CSRF protection
- [x] Rate limiting
- [x] CORS configuration
- [ ] API key authentication (for external integrations)
- [ ] Request signing for webhooks

### Data Security

- [x] Environment variable management
- [ ] Database encryption at rest
- [ ] HTTPS enforcement
- [ ] Secure cookie settings
- [ ] PII encryption

### Infrastructure

- [ ] Security headers (HSTS, CSP, etc.)
- [ ] DDoS protection
- [ ] WAF (Web Application Firewall)
- [ ] Regular security updates
- [ ] Backup and disaster recovery

---

## 5. Security Headers

### Recommended Headers

Add these headers via Next.js middleware or Azure configuration:

``` text
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.facebook.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 6. Next Steps

### Immediate (High Priority)

1. ✅ CSRF Protection - Complete
2. ✅ Rate Limiting Enhancement - In Progress
3. ⏳ POPIA Compliance Features - Next
4. ⏳ Security Headers - Next

### Short Term (Medium Priority)

1. Security audit by external firm
2. Penetration testing
3. Automated security scanning (SAST/DAST)
4. Dependency vulnerability scanning

### Long Term (Ongoing)

1. Regular security updates
2. Security monitoring and alerting
3. Incident response procedures
4. Security training for team

---

## 7. Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [POPIA Guidelines](https://popia.co.za/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
