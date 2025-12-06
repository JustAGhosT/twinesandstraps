# Shipping Provider Architecture

**Last Updated:** December 2025

## Overview

The shipping system uses a **provider pattern** architecture, allowing seamless integration with multiple shipping providers (The Courier Guy, Pargo, etc.) through a unified interface.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (API Routes, Business Logic, Order Processing)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shipping Service                          │
│  (src/lib/shipping/service.ts)                               │
│  - getShippingQuotes()                                       │
│  - getBestShippingQuote()                                    │
│  - createWaybill()                                           │
│  - getTrackingInfo()                                         │
│  - searchCollectionPoints()                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Provider Factory                                │
│  (src/lib/shipping/provider.factory.ts)                      │
│  - Registers providers                                       │
│  - Selects best provider                                     │
│  - Manages provider lifecycle                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────────┐       ┌───────────────────┐
│  IShippingProvider│       │  Provider Impl    │
│   (Interface)     │       │  - CourierGuy     │
│                   │       │  - Pargo          │
│  - getQuote()     │       │  - (Future...)    │
│  - createWaybill()│       │                   │
│  - getTracking()  │       │                   │
└───────────────────┘       └───────────────────┘
```

---

## Provider Interface

All shipping providers must implement the `IShippingProvider` interface:

```typescript
interface IShippingProvider {
  readonly name: string;
  readonly displayName: string;
  isConfigured(): boolean;
  getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null>;
  createWaybill(request: WaybillRequest): Promise<Waybill | null>;
  getTracking(waybillNumber: string): Promise<TrackingInfo | null>;
  cancelWaybill(waybillNumber: string, reason?: string): Promise<boolean>;
  supportsCollectionPoints(): boolean;
  searchCollectionPoints(...): Promise<CollectionPoint[]>;
  getMaxWeight(): number;
  getSupportedServiceTypes(): string[];
}
```

---

## Available Providers

### 1. The Courier Guy

- **Provider Name:** `courier-guy`
- **Type:** Door-to-door delivery
- **Max Weight:** 70kg
- **Service Types:** standard, express, overnight
- **Collection Points:** ❌ Not supported
- **Configuration:**
  - `COURIER_GUY_API_KEY` (required)
  - `COURIER_GUY_API_URL` (optional, defaults to production API)

**Use Case:** Standard and heavy items, door-to-door delivery

---

### 2. Pargo

- **Provider Name:** `pargo`
- **Type:** Collection point delivery
- **Max Weight:** 20kg
- **Service Types:** standard
- **Collection Points:** ✅ Supported
- **Configuration:**
  - `PARGO_API_KEY` (required)
  - `PARGO_CLIENT_ID` (required)
  - `PARGO_API_URL` (optional, defaults to production API)

**Use Case:** Lightweight items, cost-effective option, customer collection

---

## Usage Examples

### Get Shipping Quotes

```typescript
import { getShippingQuotes, getBestShippingQuote } from '@/lib/shipping/service';

// Get quotes from all providers
const allQuotes = await getShippingQuotes({
  origin: { city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' },
  destination: { city: 'Cape Town', province: 'Western Cape', postalCode: '8001' },
  weight: 5, // kg
  serviceType: 'standard',
});

// Get cheapest quote
const cheapestQuote = await getBestShippingQuote(request, 'cheapest');

// Get fastest quote
const fastestQuote = await getBestShippingQuote(request, 'fastest');
```

### Create Waybill

```typescript
import { createWaybill } from '@/lib/shipping/service';

// Auto-select provider
const waybill = await createWaybill(waybillRequest);

// Use specific provider
const waybill = await createWaybill(waybillRequest, 'pargo');
```

### Search Collection Points

```typescript
import { searchCollectionPoints } from '@/lib/shipping/service';

const points = await searchCollectionPoints(
  '8001', // postal code
  'Cape Town', // city (optional)
  'Western Cape', // province (optional)
  10 // radius in km (optional, default: 10)
);
```

---

## API Endpoints

### Get Shipping Quote

**Endpoint:** `POST /api/shipping/quote`

**Request:**
```json
{
  "origin": {
    "city": "Johannesburg",
    "province": "Gauteng",
    "postalCode": "2000"
  },
  "destination": {
    "city": "Cape Town",
    "province": "Western Cape",
    "postalCode": "8001"
  },
  "weight": 5,
  "serviceType": "standard",
  "provider": "auto", // "auto" | "all" | "courier-guy" | "pargo"
  "preference": "cheapest" // "cheapest" | "fastest"
}
```

**Response (single quote):**
```json
{
  "success": true,
  "quote": {
    "provider": "courier-guy",
    "serviceType": "standard",
    "estimatedDays": 3,
    "cost": 125.50,
    "currency": "ZAR"
  }
}
```

**Response (all quotes):**
```json
{
  "success": true,
  "quotes": [
    {
      "provider": "courier-guy",
      "serviceType": "standard",
      "estimatedDays": 3,
      "cost": 125.50,
      "currency": "ZAR"
    },
    {
      "provider": "pargo",
      "serviceType": "standard",
      "estimatedDays": 3,
      "cost": 70.00,
      "currency": "ZAR",
      "collectionPoint": {
        "id": "pargo-123",
        "name": "Pick n Pay - Claremont",
        "address": "123 Main Road",
        "city": "Cape Town",
        "distance": 2.5
      }
    }
  ],
  "count": 2
}
```

### Search Collection Points

**Endpoint:** `POST /api/shipping/collection-points`

**Request:**
```json
{
  "postalCode": "8001",
  "city": "Cape Town",
  "province": "Western Cape",
  "radiusKm": 10
}
```

**Response:**
```json
{
  "success": true,
  "collectionPoints": [
    {
      "id": "pargo-123",
      "name": "Pick n Pay - Claremont",
      "address": "123 Main Road",
      "city": "Cape Town",
      "province": "Western Cape",
      "postalCode": "7700",
      "latitude": -33.9718,
      "longitude": 18.4776,
      "distance": 2.5,
      "hours": "Mon-Fri: 08:00-18:00",
      "phone": "+27 21 123 4567"
    }
  ],
  "count": 1
}
```

---

## Adding a New Provider

1. **Create Provider Class:**

```typescript
// src/lib/shipping/providers/my-provider.provider.ts
import { IShippingProvider } from '../provider.interface';
import { /* types */ } from '../types';

export class MyProvider implements IShippingProvider {
  readonly name = 'my-provider';
  readonly displayName = 'My Shipping Provider';

  isConfigured(): boolean {
    return !!process.env.MY_PROVIDER_API_KEY;
  }

  // Implement all interface methods...
}
```

2. **Register Provider:**

```typescript
// src/lib/shipping/provider.factory.ts
import { MyProvider } from './providers/my-provider.provider';

constructor() {
  // ... existing providers ...
  this.registerProvider(new MyProvider());
}
```

3. **Add Configuration:**

Update `.env.example` with provider-specific environment variables.

---

## Backward Compatibility

The old `courier-guy.ts` file is still available for backward compatibility through the adapter (`src/lib/shipping/adapter.ts`). Existing code will continue to work, but new code should use the provider system.

---

## Best Practices

1. **Always use the service layer** (`src/lib/shipping/service.ts`) for shipping operations
2. **Let the factory auto-select providers** unless you have specific requirements
3. **Check weight limits** before requesting quotes
4. **Handle errors gracefully** - providers may fail or be unavailable
5. **Cache quotes** when appropriate to reduce API calls
6. **Monitor provider health** and fallback when needed

---

## Environment Variables

```env
# The Courier Guy
COURIER_GUY_API_KEY=your_api_key
COURIER_GUY_API_URL=https://api.thecourierguy.co.za

# Pargo
PARGO_API_KEY=your_api_key
PARGO_CLIENT_ID=your_client_id
PARGO_API_URL=https://api.pargo.co.za/v1

# Warehouse Address (for waybill creation)
WAREHOUSE_NAME=TASSA Warehouse
WAREHOUSE_ADDRESS=123 Warehouse Street
WAREHOUSE_CITY=Johannesburg
WAREHOUSE_PROVINCE=Gauteng
WAREHOUSE_POSTAL_CODE=2000
WAREHOUSE_PHONE=+27 (0)63 969 0773
WAREHOUSE_EMAIL=admin@tassa.co.za
```

---

## References

- **Provider Interface:** `src/lib/shipping/provider.interface.ts`
- **Provider Factory:** `src/lib/shipping/provider.factory.ts`
- **Shipping Service:** `src/lib/shipping/service.ts`
- **Types:** `src/lib/shipping/types.ts`
- **Pargo API Docs:** https://docs.pargo.co.za/
- **The Courier Guy API Docs:** https://thecourierguy.co.za/api-documentation

