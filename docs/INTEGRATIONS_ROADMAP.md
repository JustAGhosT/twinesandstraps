# Third-Party Integrations Roadmap

This document outlines the recommended third-party integrations for Twines and Straps, organized by priority and implementation phases. Focus is on South African market relevance.

---

## Integration Categories

1. [Payment Gateways](#1-payment-gateways)
2. [Shipping & Logistics](#2-shipping--logistics)
3. [Marketing & Analytics](#3-marketing--analytics)
4. [Inventory & Accounting](#4-inventory--accounting)
5. [Marketplace Integrations](#5-marketplace-integrations)
6. [Supplier/Product Data Integrations](#6-supplierproduct-data-integrations)

---

## 1. Payment Gateways

### Phase 1: Core Payment (High Priority)

#### PayFast (Recommended Primary)
**Why:** South Africa's most trusted payment gateway, supports all local payment methods.

| Aspect | Details |
|--------|---------|
| **Website** | https://www.payfast.co.za |
| **API Docs** | https://developers.payfast.co.za |
| **Payment Methods** | Credit/Debit Cards, Instant EFT, Mobicred, SnapScan, Zapper, Masterpass |
| **Fees** | 3.5% + R2 per transaction (cards), 2% (Instant EFT) |
| **Settlement** | T+2 business days |
| **Technical Requirements** | Merchant ID, Merchant Key, Passphrase, ITN callback URL |

**Implementation Steps:**
1. Create PayFast merchant account
2. Obtain API credentials (sandbox + production)
3. Implement checkout redirect flow
4. Set up ITN (Instant Transaction Notification) webhook
5. Handle payment confirmations and update order status
6. Implement refund API for order cancellations

**Files to Create:**
```
src/lib/payfast/
├── config.ts        # PayFast credentials & endpoints
├── signature.ts     # MD5 signature generation/validation
├── checkout.ts      # Generate checkout URL
├── itn.ts           # ITN webhook handler
└── refund.ts        # Refund processing
```

#### Yoco (Recommended Secondary)
**Why:** Modern API, excellent developer experience, growing SA market share.

| Aspect | Details |
|--------|---------|
| **Website** | https://www.yoco.com |
| **API Docs** | https://developer.yoco.com |
| **Payment Methods** | Cards, EFT (via Stitch) |
| **Fees** | 2.95% per transaction |
| **Settlement** | Next business day |

**Implementation Steps:**
1. Register Yoco merchant account
2. Get API keys from dashboard
3. Implement Yoco Popup or Inline checkout
4. Handle webhooks for payment status
5. Implement recurring payments if needed

---

### Phase 2: International Payments (Medium Priority)

#### Stripe
**Why:** Best-in-class API, required for international customers.

| Aspect | Details |
|--------|---------|
| **API Docs** | https://stripe.com/docs |
| **Features** | Cards, Apple Pay, Google Pay, Klarna, Afterpay |
| **Fees** | 2.9% + 30c per transaction |

**Implementation:** Use official `stripe` npm package with Next.js API routes.

#### PayPal
**Why:** Trusted globally, customers may prefer for large orders.

| Aspect | Details |
|--------|---------|
| **API Docs** | https://developer.paypal.com |
| **Integration** | PayPal JS SDK or REST API |

---

## 2. Shipping & Logistics

### Phase 1: Core Shipping (High Priority)

#### The Courier Guy
**Why:** Most popular courier in SA, excellent tracking, affordable rates.

| Aspect | Details |
|--------|---------|
| **Website** | https://www.thecourierguy.co.za |
| **API** | REST API via partner portal |
| **Features** | Quote generation, waybill creation, tracking, POD |
| **Integration Level** | Full API (business account required) |

**Implementation:**
1. Apply for business account with API access
2. Implement quote API for checkout shipping estimates
3. Auto-create waybills on order confirmation
4. Display tracking in customer portal
5. Webhook for delivery status updates

**API Endpoints Needed:**
- `POST /quote` - Get shipping quote
- `POST /shipment` - Create waybill
- `GET /tracking/{waybill}` - Track shipment
- `GET /pod/{waybill}` - Get proof of delivery

#### Pargo (Collection Points)
**Why:** SA's largest parcel locker/collection network, cost-effective.

| Aspect | Details |
|--------|---------|
| **Website** | https://pargo.co.za |
| **Features** | 3000+ collection points, API integration |
| **Use Case** | Offer cheaper "Click & Collect" option |

**Implementation:**
1. Integrate Pargo point selector in checkout
2. Generate Pargo waybills
3. Notify customers of pickup readiness

---

### Phase 2: Additional Carriers (Medium Priority)

#### Aramex
- SA and international shipping
- Good for bulk/heavy items (rope coils)

#### RAM Hand to Hand
- Door-to-door delivery
- Good for urgent same-day delivery

#### DHL Express
- Premium international shipping
- Corporate/bulk order customers

---

## 3. Marketing & Analytics

### Phase 1: Essential Analytics (High Priority)

#### Google Analytics 4
**Why:** Industry standard, free, comprehensive.

| Aspect | Details |
|--------|---------|
| **Setup** | GA4 property + GTM container |
| **Events** | page_view, view_item, add_to_cart, purchase |
| **Enhanced E-commerce** | Product impressions, checkout steps |

**Implementation:**
```typescript
// src/lib/analytics/gtag.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
};

export const event = (action: string, params: object) => {
  window.gtag('event', action, params);
};
```

#### Meta Pixel (Facebook/Instagram)
**Why:** Essential for social media advertising ROI tracking.

| Aspect | Details |
|--------|---------|
| **Events** | ViewContent, AddToCart, InitiateCheckout, Purchase |
| **Setup** | Pixel ID in environment variables |

**Implementation:**
1. Install Meta Pixel base code
2. Fire standard e-commerce events
3. Enable Conversions API for server-side tracking
4. Set up product catalog for dynamic ads

---

### Phase 2: Email Marketing (High Priority)

#### Brevo (formerly Sendinblue)
**Why:** Affordable, GDPR-compliant, good transactional + marketing.

| Aspect | Details |
|--------|---------|
| **Website** | https://www.brevo.com |
| **API** | REST API + SMTP relay |
| **Features** | Transactional emails, campaigns, automation |
| **Pricing** | Free tier: 300 emails/day |

**Implementation:**
1. Set up Brevo account and API key
2. Configure SMTP for transactional emails
3. Create email templates (order confirmation, shipping, etc.)
4. Set up automation workflows:
   - Welcome series
   - Abandoned cart
   - Post-purchase follow-up
   - Re-engagement campaigns

**Files to Create:**
```
src/lib/email/
├── brevo.ts         # Brevo API client
├── templates/
│   ├── order-confirmation.ts
│   ├── shipping-notification.ts
│   ├── password-reset.ts
│   └── welcome.ts
└── automation/
    ├── abandoned-cart.ts
    └── review-request.ts
```

#### Alternative: Mailchimp
- More established but more expensive
- Better template builder
- Strong Shopify integration

---

### Phase 3: Advanced Marketing (Lower Priority)

#### Google Ads Integration
- Conversion tracking
- Dynamic remarketing
- Shopping ads feed

#### HubSpot CRM
- Lead tracking
- Sales pipeline
- Marketing automation

---

## 4. Inventory & Accounting

### Phase 1: Accounting Integration (High Priority)

#### Xero
**Why:** Cloud-based, popular in SA, excellent API.

| Aspect | Details |
|--------|---------|
| **Website** | https://www.xero.com/za |
| **API Docs** | https://developer.xero.com |
| **Features** | Invoices, payments, bank feeds, inventory |

**Implementation:**
1. Connect via OAuth 2.0
2. Sync orders as invoices
3. Sync payments received
4. Generate financial reports

**Sync Strategy:**
- Order confirmed → Create draft invoice
- Payment received → Mark invoice as paid
- Daily sync of inventory levels

#### Sage Accounting (Alternative)
**Why:** Dominant in SA market, especially for established businesses.

| Aspect | Details |
|--------|---------|
| **API** | Sage One / Sage Business Cloud API |
| **Features** | Full accounting suite, SA tax compliance |

---

### Phase 2: Inventory Management (Medium Priority)

#### Custom Inventory System (Built-in)
The existing supplier management system can be extended for:
- Real-time stock tracking
- Low stock alerts
- Automated reorder points
- Stock take functionality

**Recommended Approach:**
Enhance existing Prisma schema rather than external integration:
```prisma
model InventoryMovement {
  id            Int      @id @default(autoincrement())
  product_id    Int
  type          String   // SALE, PURCHASE, ADJUSTMENT, RETURN
  quantity      Int      // +/- depending on type
  reference     String?  // Order ID, PO number, etc.
  notes         String?
  created_at    DateTime @default(now())

  product Product @relation(...)
}
```

---

## 5. Marketplace Integrations

### Phase 2: Takealot Seller Portal (Medium Priority)

**Why:** SA's largest online marketplace, significant reach.

| Aspect | Details |
|--------|---------|
| **Website** | https://seller.takealot.com |
| **Model** | Fulfilled by Takealot (FBT) or Fulfilled by Seller (FBS) |
| **Requirements** | Seller account, product data feed, inventory sync |

**Implementation Steps:**
1. Apply for Takealot seller account
2. Map product catalog to Takealot categories
3. Create product feed (CSV/XML)
4. Set up inventory sync (manual or API)
5. Handle order fulfillment workflows

**Integration Level:**
- Basic: Manual product upload, separate order management
- Advanced: API integration for real-time inventory/orders

---

### Phase 3: Amazon South Africa (Future)

**Why:** Amazon SA launching soon, early mover advantage.

| Preparation | Actions |
|-------------|---------|
| Product Data | Ensure GTIN/UPC barcodes on products |
| Images | High-quality product images meeting Amazon standards |
| Descriptions | SEO-optimized product descriptions |

---

## 6. Supplier/Product Data Integrations

### Existing: Manual Supplier Import (Complete)
Already implemented via `/admin/suppliers` with:
- CSV import
- API import endpoint
- SKU generation
- Markup calculation

### Phase 2: Automated Supplier Feeds (Medium Priority)

#### Supplier EDI/API Connections
For major suppliers, implement automated feeds:

**Feed Types:**
1. **Product Catalog Feed**
   - New products
   - Price updates
   - Description changes

2. **Inventory Feed**
   - Real-time stock levels
   - Lead times
   - Availability status

3. **Order Feed**
   - Purchase order submission
   - Order confirmation
   - Shipping notification

**Implementation Architecture:**
```
src/lib/suppliers/
├── feeds/
│   ├── base-feed.ts        # Abstract feed handler
│   ├── csv-feed.ts         # CSV file processor
│   ├── sftp-feed.ts        # SFTP file retrieval
│   └── api-feed.ts         # REST API integration
├── processors/
│   ├── product-sync.ts     # Product upsert logic
│   └── inventory-sync.ts   # Stock level updates
└── schedulers/
    └── feed-scheduler.ts   # Cron job management
```

---

## Implementation Priority Matrix

| Integration | Business Impact | Technical Effort | Priority | Phase |
|-------------|-----------------|------------------|----------|-------|
| PayFast | High | Medium | 🔴 Critical | 1 |
| Google Analytics | High | Low | 🔴 Critical | 1 |
| Meta Pixel | High | Low | 🔴 Critical | 1 |
| The Courier Guy | High | Medium | 🔴 Critical | 1 |
| Brevo (Email) | High | Medium | 🟠 High | 1 |
| Xero | Medium | Medium | 🟠 High | 2 |
| Pargo | Medium | Low | 🟡 Medium | 2 |
| Yoco | Medium | Medium | 🟡 Medium | 2 |
| Takealot | Medium | High | 🟡 Medium | 2 |
| Stripe | Low (SA focus) | Low | 🟢 Low | 3 |
| HubSpot | Low | High | 🟢 Low | 3 |
| Supplier EDI | High (scale) | High | 🟢 Low | 3 |

---

## Phase 1 Implementation Timeline

### Immediate (Sprint 1-2)
1. **PayFast Integration**
   - Sandbox implementation
   - Testing all payment methods
   - Production deployment

2. **Analytics Setup**
   - GA4 property configuration
   - E-commerce event tracking
   - Meta Pixel installation

### Short-term (Sprint 3-4)
3. **Courier Integration**
   - The Courier Guy API setup
   - Quote at checkout
   - Waybill generation
   - Tracking page

4. **Email Marketing**
   - Brevo setup
   - Transactional email templates
   - Abandoned cart automation

---

## API Keys & Environment Variables

Add to `.env`:
```bash
# Payment Gateways
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true

YOCO_API_KEY=
YOCO_WEBHOOK_SECRET=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_META_PIXEL_ID=

# Email
BREVO_API_KEY=
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587

# Shipping
TCG_API_KEY=
TCG_ACCOUNT_NUMBER=
PARGO_API_KEY=

# Accounting
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
```

---

## Technical Requirements

### Webhooks Infrastructure
Most integrations require webhook handling:

```typescript
// src/app/api/webhooks/[provider]/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;

  switch (provider) {
    case 'payfast':
      return handlePayFastITN(request);
    case 'yoco':
      return handleYocoWebhook(request);
    case 'courier-guy':
      return handleCourierWebhook(request);
    default:
      return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
  }
}
```

### Background Jobs
For feed processing and scheduled tasks, implement job queue:
- Consider Vercel Cron (simple) or BullMQ (robust)
- Daily inventory sync
- Hourly order status updates
- Nightly accounting sync

---

## Security Considerations

1. **API Key Storage**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Webhook Verification**
   - Verify signatures on all webhooks
   - Use webhook secrets
   - Log all webhook events

3. **PCI Compliance**
   - Never store full card numbers
   - Use hosted payment pages
   - Redirect to payment gateway

4. **Data Privacy (POPIA)**
   - Customer consent for marketing
   - Data retention policies
   - Right to deletion support

---

*Last Updated: November 2025*
