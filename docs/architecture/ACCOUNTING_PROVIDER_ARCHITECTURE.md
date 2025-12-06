# Accounting Provider Architecture

**Last Updated:** December 2025

## Overview

The accounting system uses a **provider pattern** architecture, allowing seamless integration with multiple accounting providers (Xero, QuickBooks, Sage, etc.) through a unified interface.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Order Processing, Payment Webhooks, Admin Dashboard)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Accounting Provider Factory                      │
│  (src/lib/accounting/provider.factory.ts)                      │
│  - Registers providers                                       │
│  - Selects default provider                                  │
│  - Manages provider lifecycle                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────────┐       ┌───────────────────┐
│ IAccountingProvider│       │  Provider Impl    │
│   (Interface)     │       │  - Xero           │
│                   │       │  - Mock           │
│  - createInvoice()│       │  - (Future...)    │
│  - recordPayment()│       │                   │
│  - createContact()│       │                   │
└───────────────────┘       └───────────────────┘
```

---

## Provider Interface

All accounting providers must implement the `IAccountingProvider` interface:

```typescript
interface IAccountingProvider {
  readonly name: string;
  readonly displayName: string;
  isConfigured(): boolean;
  isConnected(): Promise<boolean>;
  getAuthorizationUrl(redirectUri: string, state?: string): Promise<string>;
  handleCallback(code: string, state?: string): Promise<{success: boolean; error?: string}>;
  createInvoice(request: InvoiceRequest): Promise<InvoiceResult>;
  recordPayment(request: PaymentRequest): Promise<PaymentResult>;
  createOrUpdateContact(request: ContactRequest): Promise<ContactResult>;
  getInvoice(invoiceId: string): Promise<InvoiceInfo | null>;
  getSupportedCurrencies(): string[];
  getDefaultTaxRates(): Array<{name: string; rate: number; code?: string}>;
}
```

---

## Available Providers

### 1. Xero

- **Provider Name:** `xero`
- **Type:** Cloud accounting platform
- **OAuth:** ✅ OAuth 2.0
- **Features:**
  - Invoice creation from orders
  - Payment recording
  - Contact management
  - Real-time sync
- **Configuration:**
  - `XERO_CLIENT_ID` (required)
  - `XERO_CLIENT_SECRET` (required)
  - `XERO_TENANT_ID` (required)
  - `XERO_PAYMENT_ACCOUNT_CODE` (optional, defaults to '090')

**Use Case:** Primary accounting integration for SA market

---

### 2. Mock Accounting Provider

- **Provider Name:** `mock`
- **Type:** Testing/Development provider
- **OAuth:** ❌ Not required
- **Features:**
  - Simulates all accounting operations
  - Logs to console in development
  - Stores data in memory
- **Configuration:** None required

**Use Case:** Development, testing, CI/CD

---

## Usage Examples

### Get Accounting Provider

```typescript
import { getAccountingProvider } from '@/lib/accounting/provider.factory';

// Get default provider (Xero if connected)
const provider = await getAccountingProvider();

// Get specific provider
const xeroProvider = await getAccountingProvider('xero');
const mockProvider = await getAccountingProvider('mock');
```

### Create Invoice

```typescript
const result = await provider.createInvoice({
  orderId: '123',
  orderNumber: 'ORD-123',
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+27 11 123 4567',
    address: {
      street: '123 Main St',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      country: 'South Africa',
    },
  },
  items: [
    {
      name: 'Product Name',
      quantity: 2,
      unitPrice: 100.00,
      taxRate: 15,
    },
  ],
  subtotal: 200.00,
  tax: 30.00,
  total: 230.00,
  currency: 'ZAR',
  invoiceDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```

### Record Payment

```typescript
const result = await provider.recordPayment({
  invoiceId: 'xero-invoice-id',
  amount: 230.00,
  paymentDate: new Date(),
  paymentMethod: 'PayFast',
  reference: 'PF-123456',
});
```

### Create/Update Contact

```typescript
const result = await provider.createOrUpdateContact({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+27 11 123 4567',
  address: {
    street: '123 Main St',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2000',
    country: 'South Africa',
  },
  isCustomer: true,
  isSupplier: false,
});
```

---

## Adding a New Provider

1. **Create Provider Class:**

```typescript
// src/lib/accounting/providers/quickbooks.provider.ts
import { IAccountingProvider } from '../provider.interface';
import { /* types */ } from '../provider.interface';

export class QuickBooksProvider implements IAccountingProvider {
  readonly name = 'quickbooks';
  readonly displayName = 'QuickBooks';

  isConfigured(): boolean {
    return !!(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET);
  }

  // Implement all interface methods...
}
```

2. **Register Provider:**

```typescript
// src/lib/accounting/provider.factory.ts
import { QuickBooksProvider } from './providers/quickbooks.provider';

constructor() {
  // ... existing providers ...
  this.registerProvider(new QuickBooksProvider());
}
```

3. **Add Configuration:**

Update `.env.example` with provider-specific environment variables.

---

## OAuth Flow

For OAuth-based providers (like Xero):

1. **Initiate OAuth:**
```typescript
const provider = await getAccountingProvider('xero');
const authUrl = await provider.getAuthorizationUrl('/api/accounting/callback');
// Redirect user to authUrl
```

2. **Handle Callback:**
```typescript
const provider = await getAccountingProvider('xero');
const result = await provider.handleCallback(code, state);
if (result.success) {
  // Provider is now connected
}
```

3. **Check Connection:**
```typescript
const isConnected = await provider.isConnected();
```

---

## Best Practices

1. **Always check if provider is configured** before use
2. **Check connection status** for OAuth providers
3. **Handle errors gracefully** - providers may fail
4. **Use mock provider** for development/testing
5. **Store invoice mappings** in database for reconciliation
6. **Sync payments immediately** after order confirmation

---

## Environment Variables

```env
# Xero
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_TENANT_ID=your_tenant_id
XERO_PAYMENT_ACCOUNT_CODE=090

# Enable Mock Providers (optional)
ENABLE_MOCK_PROVIDERS=true
```

---

## Migration Status

✅ **Abandoned Cart Migration Applied Successfully**

The `AbandonedCart` table has been created in the database with all required indexes.

---

## References

- **Accounting Provider Interface:** `src/lib/accounting/provider.interface.ts`
- **Provider Factory:** `src/lib/accounting/provider.factory.ts`
- **Xero Provider:** `src/lib/accounting/providers/xero.provider.ts`
- **Mock Provider:** `src/lib/accounting/providers/mock.provider.ts`
- **Xero API Docs:** https://developer.xero.com/documentation/

