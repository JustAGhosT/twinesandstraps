# Provider Pattern & Abandoned Cart Implementation

**Last Updated:** December 2025

## Overview

Successfully implemented three major enhancements:
1. **Abandoned Cart Database Storage** - Migrated from in-memory Map to database
2. **Payment Provider Implementation** - Refactored PayFast to use provider pattern
3. **Mock Provider Implementations** - Created mock providers for all integration types

---

## ✅ 1. Abandoned Cart Database Storage

### Changes Made

**Prisma Schema:**
- Added `AbandonedCart` model with fields:
  - `email` - Customer email address
  - `items` - JSON array of cart items
  - `total` - Cart total amount
  - `reminder_sent` - Reminder level (0-3)
  - `recovered` - Whether cart was recovered
  - `recovered_at` - Timestamp when recovered
  - `created_at` / `updated_at` - Timestamps

**Migration:**
- Created migration: `20251207000000_add_abandoned_cart`
- Added indexes for efficient queries:
  - `email` - Find carts by email
  - `recovered` - Filter recovered/unrecovered carts
  - `updated_at` - Time-based queries
  - `reminder_sent, updated_at` - Composite index for reminder queries

**Code Updates:**
- Refactored `src/lib/abandoned-cart.ts` to use Prisma instead of in-memory Map
- All functions now async and database-backed
- Improved error handling and logging

### Benefits

- ✅ **Persistence:** Carts survive server restarts
- ✅ **Scalability:** Works across multiple server instances
- ✅ **Analytics:** Can query and analyze abandoned cart data
- ✅ **Reliability:** No data loss on server crashes

---

## ✅ 2. Payment Provider Implementation

### Changes Made

**PayFast Provider:**
- Created `src/lib/payment/providers/payfast.provider.ts`
- Implements `IPaymentProvider` interface
- Wraps existing PayFast functionality:
  - `initiatePayment()` - Uses `generateCheckoutUrl()`
  - `processWebhook()` - Uses existing ITN handler logic
  - `processRefund()` - Uses `processRefund()` from refund.ts
  - `verifyWebhookSignature()` - Uses `validateSignature()`

**Payment Factory:**
- Created `src/lib/payment/provider.factory.ts`
- Manages provider registration
- Provides convenience functions
- Auto-registers PayFast and Mock (in dev)

### Usage

```typescript
import { getPaymentProvider } from '@/lib/payment/provider.factory';

// Get default provider (PayFast)
const provider = getPaymentProvider();

// Initiate payment
const result = await provider.initiatePayment({
  amount: 1000,
  currency: 'ZAR',
  orderId: '123',
  orderNumber: 'ORD-123',
  customer: { name: 'John Doe', email: 'john@example.com' },
  items: [{ name: 'Product', quantity: 1, price: 1000 }],
  returnUrl: '/checkout/success',
  cancelUrl: '/checkout/cancel',
});
```

### Benefits

- ✅ **Extensibility:** Easy to add new payment providers
- ✅ **Testability:** Can use mock provider for testing
- ✅ **Consistency:** Unified interface across all providers
- ✅ **Future-ready:** Ready for PayStack, Stripe, etc.

---

## ✅ 3. Mock Provider Implementations

### Created Mock Providers

**1. MockPaymentProvider** (`src/lib/payment/providers/mock.provider.ts`)
- Simulates payment flow without real API calls
- Stores mock payments in memory
- Logs to console in development
- Always returns success for testing

**2. MockShippingProvider** (`src/lib/shipping/providers/mock.provider.ts`)
- Simulates shipping quotes and waybill creation
- Returns realistic mock data
- Supports collection points
- Simulates tracking status progression

**3. MockEmailProvider** (`src/lib/email/providers/mock.provider.ts`)
- Simulates email sending
- Logs emails to console in development
- Stores sent emails for testing
- Supports bulk sending

**Email Factory:**
- Created `src/lib/email/provider.factory.ts`
- Ready for Brevo provider refactoring
- Currently registers Mock provider in dev mode

### Enabling Mock Providers

Mock providers are automatically enabled in:
- `NODE_ENV === 'development'`
- Or when `ENABLE_MOCK_PROVIDERS=true`

### Benefits

- ✅ **Testing:** Test without external API dependencies
- ✅ **Development:** Develop features without API keys
- ✅ **CI/CD:** Run tests in CI without real integrations
- ✅ **Cost Savings:** No API costs during development

---

## 📁 Files Created/Modified

### New Files

**Abandoned Cart:**
- `prisma/migrations/20251207000000_add_abandoned_cart/migration.sql`

**Payment Providers:**
- `src/lib/payment/providers/payfast.provider.ts`
- `src/lib/payment/providers/mock.provider.ts`
- `src/lib/payment/provider.factory.ts`

**Shipping Providers:**
- `src/lib/shipping/providers/mock.provider.ts`
- Updated `src/lib/shipping/provider.factory.ts` (added mock registration)

**Email Providers:**
- `src/lib/email/providers/mock.provider.ts`
- `src/lib/email/provider.factory.ts`

### Modified Files

- `prisma/schema.prisma` - Added AbandonedCart model
- `src/lib/abandoned-cart.ts` - Migrated to database
- `src/lib/shipping/provider.factory.ts` - Added mock provider registration

---

## 🚀 Next Steps

### 1. Apply Database Migration

```bash
npx dotenv-cli -e .env -- npx prisma migrate dev --name add_abandoned_cart
```

Or for production:
```bash
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

### 2. Test Abandoned Cart Tracking

- Add items to cart
- Leave cart without checking out
- Verify cart is stored in database
- Test reminder emails

### 3. Test Payment Provider

- Test payment initiation with PayFast provider
- Test webhook processing
- Test refund processing
- Test with mock provider in development

### 4. Future Enhancements

**Email Provider Refactoring:**
- Refactor Brevo to implement `IEmailProvider`
- Register in email factory
- Update all email sending code to use provider

**Additional Payment Providers:**
- PayStack integration
- Stripe integration
- Yoco integration

**Additional Shipping Providers:**
- FastWay integration
- PostNet integration
- Bob Go aggregator

---

## 📊 Architecture Benefits

### Provider Pattern Benefits

1. **Unified Interface:** All providers implement the same interface
2. **Easy Testing:** Mock providers for unit/integration tests
3. **Extensibility:** Add new providers without changing application code
4. **Flexibility:** Switch providers based on configuration
5. **Maintainability:** Provider-specific code isolated

### Database Storage Benefits

1. **Persistence:** Data survives server restarts
2. **Scalability:** Works across multiple instances
3. **Analytics:** Query and analyze data
4. **Reliability:** No data loss
5. **Performance:** Indexed queries for fast lookups

---

## 🔧 Configuration

### Environment Variables

No new environment variables required. Existing ones:
- `DATABASE_URL` - For abandoned cart storage
- `PAYFAST_*` - For PayFast provider
- `ENABLE_MOCK_PROVIDERS` - Optional, enables mocks in production

---

## 📚 References

- **Payment Provider Interface:** `src/lib/payment/provider.interface.ts`
- **Shipping Provider Interface:** `src/lib/shipping/provider.interface.ts`
- **Email Provider Interface:** `src/lib/email/provider.interface.ts`
- **Provider Pattern Overview:** `docs/architecture/PROVIDER_PATTERN_OVERVIEW.md`
- **Shipping Architecture:** `docs/architecture/SHIPPING_PROVIDER_ARCHITECTURE.md`

