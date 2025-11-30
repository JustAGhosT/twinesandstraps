# ADR-002: Payment Gateway Integration

**Status:** Proposed
**Date:** 2025-11-29
**Decision Makers:** Development Team, Business Owner
**Technical Story:** Implement payment processing for e-commerce checkout

## Context and Problem Statement

Twines and Straps needs to process online payments for customer orders. The business operates primarily in South Africa with potential for international customers. We need to select and integrate payment gateway(s) that:

- Support South African payment methods (EFT, local cards, mobile wallets)
- Are trusted by local customers
- Have reasonable transaction fees
- Provide good developer experience
- Handle security and PCI compliance

## Decision Drivers

- **Local Payment Methods:** Must support Instant EFT, SnapScan, Zapper for SA market
- **Trust Factor:** SA customers prefer familiar payment brands
- **Fees:** Transaction costs impact margins
- **Developer Experience:** API quality, documentation, testing tools
- **Settlement Time:** Cash flow considerations
- **International Support:** Future-proofing for export customers

## Considered Options

### Option 1: PayFast Only

| Aspect | Details |
|--------|---------|
| **Coverage** | SA comprehensive |
| **Payment Methods** | Cards, Instant EFT, Mobicred, SnapScan, Zapper, Masterpass |
| **Fees** | 3.5% + R2 (cards), 2% (EFT) |
| **Settlement** | T+2 business days |
| **Sandbox** | Full testing environment |

**Pros:**
- Most recognized payment brand in SA
- Supports all local payment methods
- Well-documented API
- Extensive Shopify/WooCommerce experience

**Cons:**
- Higher fees than some alternatives
- Limited international support
- Settlement time slower than some competitors

### Option 2: Yoco Only

| Aspect | Details |
|--------|---------|
| **Coverage** | SA focused |
| **Payment Methods** | Cards, EFT (via Stitch) |
| **Fees** | 2.95% per transaction |
| **Settlement** | Next business day |
| **Sandbox** | Test mode available |

**Pros:**
- Lower transaction fees
- Faster settlement (T+1)
- Modern API design
- Growing market trust

**Cons:**
- Fewer payment methods than PayFast
- Smaller market share (brand recognition)
- No mobile wallet integration

### Option 3: PayFast Primary + Yoco Secondary

**Description:** Use PayFast as primary gateway, add Yoco as alternative.

**Pros:**
- Maximum payment method coverage
- Customer choice builds trust
- Redundancy if one provider has issues
- A/B test conversion rates

**Cons:**
- More complex implementation
- Multiple dashboards to manage
- Higher maintenance overhead

### Option 4: Stripe + Local Gateway

**Description:** Use Stripe for international cards, PayFast for local methods.

**Pros:**
- Best-in-class international card processing
- Apple Pay, Google Pay support
- Excellent developer experience

**Cons:**
- Stripe fees higher for SA
- Added complexity
- Most customers will use local methods anyway

## Decision Outcome

**Chosen Option: Option 3 - PayFast Primary + Yoco Secondary**

### Rationale

1. **PayFast as Primary:** Widest payment method coverage, highest brand trust in SA
2. **Yoco as Optional:** Lower fees for card-only customers, faster settlement
3. **Customer Choice:** Let customers select preferred method at checkout
4. **Future-Proof:** Can add Stripe later for international expansion

### Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Checkout Page                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  PayFast Button │  │   Yoco Button   │  │ EFT Details │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
└───────────┼────────────────────┼──────────────────┼────────┘
            │                    │                   │
            ▼                    ▼                   ▼
     ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
     │ PayFast API  │    │   Yoco API   │   │  Manual EFT  │
     │   (Redirect) │    │   (Popup)    │   │  (Invoice)   │
     └──────┬───────┘    └──────┬───────┘   └──────┬───────┘
            │                   │                   │
            ▼                   ▼                   ▼
     ┌──────────────────────────────────────────────────────┐
     │               Webhook Handler                         │
     │  POST /api/webhooks/[provider]                       │
     │  - Verify signature                                  │
     │  - Update order status                               │
     │  - Send confirmation email                           │
     └──────────────────────────────────────────────────────┘
```

### Technical Specification

#### PayFast Integration

**File Structure:**
```
src/lib/payments/
├── payfast/
│   ├── config.ts        # Environment-based configuration
│   ├── signature.ts     # MD5 signature generation/validation
│   ├── checkout.ts      # Generate checkout redirect URL
│   ├── itn.ts           # Instant Transaction Notification handler
│   └── refund.ts        # Process refunds via API
├── yoco/
│   ├── config.ts        # API keys and endpoints
│   ├── checkout.ts      # Yoco Popup integration
│   └── webhook.ts       # Payment status webhook
└── index.ts             # Unified payment interface
```

**PayFast Checkout Flow:**
```typescript
// src/lib/payments/payfast/checkout.ts
import { generateSignature } from './signature';
import { PAYFAST_CONFIG } from './config';

interface PayFastPaymentData {
  orderId: string;
  amount: number;
  itemName: string;
  customerEmail: string;
  customerName: string;
}

interface PayFastFormData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  email_address: string;
  name_first: string;
  name_last: string;
  signature: string;
}

export function generatePayFastForm(data: PayFastPaymentData): PayFastFormData {
  const paymentData = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: `${PAYFAST_CONFIG.baseUrl}/checkout/success`,
    cancel_url: `${PAYFAST_CONFIG.baseUrl}/checkout/cancel`,
    notify_url: `${PAYFAST_CONFIG.baseUrl}/api/webhooks/payfast`,
    m_payment_id: data.orderId,
    amount: data.amount.toFixed(2),
    item_name: data.itemName,
    email_address: data.customerEmail,
    name_first: data.customerName.split(' ')[0],
    name_last: data.customerName.split(' ').slice(1).join(' ') || '',
  };

  const signature = generateSignature(paymentData, PAYFAST_CONFIG.passphrase);

  return { ...paymentData, signature };
}
```

**ITN (Webhook) Handler:**
```typescript
// src/app/api/webhooks/payfast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateITN, parseITNData } from '@/lib/payments/payfast/itn';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = parseITNData(body);

    // Validate ITN signature and source
    const isValid = await validateITN(data, request);
    if (!isValid) {
      console.error('Invalid PayFast ITN');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Update order status
    const order = await prisma.order.update({
      where: { order_number: data.m_payment_id },
      data: {
        payment_status: data.payment_status === 'COMPLETE' ? 'PAID' : 'FAILED',
        status: data.payment_status === 'COMPLETE' ? 'CONFIRMED' : 'PENDING',
        payment_method: `PayFast - ${data.payment_method}`,
      },
      include: { user: true },
    });

    // Send confirmation email
    if (data.payment_status === 'COMPLETE') {
      await sendOrderConfirmation(order);
    }

    // Log transaction
    await prisma.adminActivityLog.create({
      data: {
        action: 'PAYMENT',
        entity_type: 'ORDER',
        entity_id: order.id,
        description: `Payment ${data.payment_status} via PayFast`,
        metadata: JSON.stringify(data),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayFast ITN error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

#### Yoco Integration

**Popup Checkout:**
```typescript
// src/lib/payments/yoco/checkout.ts
import { YOCO_CONFIG } from './config';

interface YocoPaymentData {
  amountInCents: number;
  currency: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
}

export function initYocoPopup(data: YocoPaymentData): Promise<string> {
  return new Promise((resolve, reject) => {
    const yoco = new window.YocoSDK({
      publicKey: YOCO_CONFIG.publicKey,
    });

    yoco.showPopup({
      ...data,
      callback: (result: { id?: string; error?: { message: string } }) => {
        if (result.error) {
          reject(new Error(result.error.message));
        } else {
          resolve(result.id!);
        }
      },
    });
  });
}

// Server-side charge creation
export async function createYocoCharge(
  token: string,
  amountInCents: number,
  orderId: string
) {
  const response = await fetch('https://online.yoco.com/v1/charges/', {
    method: 'POST',
    headers: {
      'X-Auth-Secret-Key': YOCO_CONFIG.secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      amountInCents,
      currency: 'ZAR',
      metadata: { orderId },
    }),
  });

  return response.json();
}
```

### Database Schema Updates

```prisma
// Add to Order model
model Order {
  // ... existing fields
  payment_provider    String?   // 'PAYFAST', 'YOCO', 'EFT'
  payment_reference   String?   // Provider's transaction ID
  payment_metadata    String?   // JSON - additional payment data
}
```

### Environment Variables

```bash
# PayFast
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true
NEXT_PUBLIC_PAYFAST_URL=https://sandbox.payfast.co.za/eng/process

# Yoco
YOCO_PUBLIC_KEY=pk_test_xxx
YOCO_SECRET_KEY=sk_test_xxx
YOCO_WEBHOOK_SECRET=whsec_xxx
```

### Security Considerations

1. **Signature Validation:** Always validate ITN signatures before processing
2. **IP Whitelisting:** Verify webhook requests from known PayFast IPs
3. **HTTPS Only:** All payment pages must use HTTPS
4. **No Card Storage:** Never store full card numbers - use tokenization
5. **Logging:** Log payment events but mask sensitive data
6. **Idempotency:** Handle duplicate webhooks gracefully

### Testing Strategy

1. **Sandbox Testing:**
   - Use PayFast sandbox for all payment methods
   - Use Yoco test keys
   - Test all success/failure scenarios

2. **Test Card Numbers:**
   - PayFast: 4000000000000002 (success), 4000000000000010 (decline)
   - Yoco: 4242424242424242 (success)

3. **Webhook Testing:**
   - Use ngrok for local webhook testing
   - Verify signature validation
   - Test order status updates

### Implementation Timeline

**Phase 1: PayFast (Sprint 1)**
- [ ] Create payment library structure
- [ ] Implement PayFast signature generation
- [ ] Build checkout redirect flow
- [ ] Implement ITN webhook handler
- [ ] Add payment status to order flow
- [ ] Test with sandbox

**Phase 2: Yoco (Sprint 2)**
- [ ] Add Yoco SDK to frontend
- [ ] Implement popup checkout
- [ ] Create server-side charge endpoint
- [ ] Add webhook handler
- [ ] A/B test checkout options

**Phase 3: Refinement (Sprint 3)**
- [ ] Add refund functionality
- [ ] Implement retry logic
- [ ] Add payment analytics
- [ ] Production deployment

### Consequences

**Positive:**
- Comprehensive SA payment coverage
- Customer payment choice
- Redundancy for reliability
- Clear upgrade path for international

**Negative:**
- Two integrations to maintain
- Multiple fee structures to track
- Dashboard fragmentation

### Metrics to Track

- Conversion rate by payment method
- Average transaction value by provider
- Failed payment rate
- Refund frequency
- Customer payment method preference

---

## Appendix: PayFast ITN Parameters

| Parameter | Description |
|-----------|-------------|
| m_payment_id | Your order reference |
| pf_payment_id | PayFast's transaction ID |
| payment_status | COMPLETE, FAILED, PENDING |
| item_name | Product description |
| amount_gross | Total amount |
| amount_fee | PayFast fee |
| amount_net | Amount after fees |
| custom_str1-5 | Custom data fields |
| signature | MD5 signature for validation |

---

*Last Updated: November 2025*
