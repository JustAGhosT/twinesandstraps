# External Integrations

## Overview

The application integrates with several external services for storage, communication, and optional AI features. This document details each integration and its configuration.

## Integration Summary

| Service | Purpose | Status |
|---------|---------|--------|
| **Azure Blob Storage** | Image uploads | Configured |
| **WhatsApp Business** | Quote requests | Configured |
| **Azure AI (OpenAI)** | AI assistant | Optional |
| **GA4 Analytics** | User analytics | Planned |
| **PayFast** | Payment gateway | Planned |
| **SendGrid/Mailgun** | Transactional email | Planned |

## Azure Blob Storage

### Purpose

Store product images, logos, and other uploaded files.

### Configuration

```bash
# Environment Variables
AZURE_STORAGE_ACCOUNT_NAME="devstassastorage"
AZURE_STORAGE_ACCOUNT_KEY="your-key-here"
AZURE_STORAGE_CONTAINER_NAME="images"
```

### Implementation

```typescript
// src/lib/blob-storage.ts
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

class BlobStorageService {
  private containerClient: ContainerClient;

  constructor() {
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${
      process.env.AZURE_STORAGE_ACCOUNT_NAME
    };AccountKey=${
      process.env.AZURE_STORAGE_ACCOUNT_KEY
    };EndpointSuffix=core.windows.net`;

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME || 'images'
    );
  }

  async upload(file: Buffer, filename: string, contentType: string): Promise<string> {
    const blobClient = this.containerClient.getBlockBlobClient(filename);
    await blobClient.upload(file, file.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blobClient.url;
  }

  async delete(filename: string): Promise<void> {
    const blobClient = this.containerClient.getBlockBlobClient(filename);
    await blobClient.deleteIfExists();
  }
}

export const blobStorage = new BlobStorageService();
```

### Usage

```typescript
// Upload product image
const imageUrl = await blobStorage.upload(
  imageBuffer,
  `products/${productId}-${Date.now()}.jpg`,
  'image/jpeg'
);
```

### Image URL Pattern

```
https://{account}.blob.core.windows.net/images/products/{filename}
```

### Next.js Image Configuration

```javascript
// next.config.js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.blob.core.windows.net',
      pathname: '/**',
    },
  ],
},
```

## WhatsApp Business

### Purpose

Enable customers to request quotes directly via WhatsApp.

### Configuration

```bash
# Environment Variable
NEXT_PUBLIC_WHATSAPP_NUMBER="27639690773"
```

### Implementation

```typescript
// src/components/WhatsAppButton.tsx
const handleClick = () => {
  const phone = settings.whatsappNumber || '27639690773';
  const message = encodeURIComponent(
    'Hi! I would like to inquire about your products.'
  );
  const url = `https://wa.me/${phone}?text=${message}`;

  window.open(url, '_blank', 'noopener,noreferrer');
};
```

### URL Format

```
https://wa.me/{phone}?text={encoded_message}
```

### Dynamic Configuration

WhatsApp number is stored in `SiteSetting` model and can be updated via admin portal.

## Azure AI (OpenAI) - Optional

### Purpose

AI-powered product assistant for customer queries.

### Configuration

```bash
# Environment Variables
AZURE_AI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_AI_API_KEY="your-api-key"
AZURE_AI_DEPLOYMENT_NAME="gpt-4o"
```

### Implementation

```typescript
// src/lib/ai.ts
import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_AI_ENDPOINT,
  apiKey: process.env.AZURE_AI_API_KEY,
  apiVersion: '2024-02-15-preview',
});

export async function getAIResponse(prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: process.env.AZURE_AI_DEPLOYMENT_NAME || 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant for a rope and twine store.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || '';
}
```

### Feature Flag

```typescript
// Controlled via feature flag
if (featureFlags.aiAssistant) {
  // Show AI chat component
}
```

## Google Analytics 4 (Planned)

### Purpose

Track user behavior, conversions, and site performance.

### Configuration (Future)

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### Implementation Plan

```typescript
// src/lib/analytics.ts
export function trackEvent(eventName: string, parameters?: object) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

// Track product views
trackEvent('view_item', {
  item_id: product.sku,
  item_name: product.name,
  price: product.price,
});

// Track add to cart
trackEvent('add_to_cart', {
  items: [{ item_id: product.sku, quantity: 1 }],
  value: product.price,
  currency: 'ZAR',
});
```

### Key Events to Track

| Event | Trigger |
|-------|---------|
| `page_view` | Page load |
| `view_item` | Product detail view |
| `add_to_cart` | Add to cart click |
| `begin_checkout` | Checkout start |
| `purchase` | Order completion |
| `search` | Product search |

## PayFast Payment Gateway (Planned)

### Purpose

Process online payments for e-commerce transactions.

### Configuration (Future)

```bash
PAYFAST_MERCHANT_ID="your-merchant-id"
PAYFAST_MERCHANT_KEY="your-merchant-key"
PAYFAST_PASSPHRASE="your-passphrase"
PAYFAST_SANDBOX="true"  # false for production
```

### Integration Points

1. **Checkout Page**: Generate payment form
2. **ITN Handler**: Process payment notifications
3. **Return URL**: Handle successful payments
4. **Cancel URL**: Handle cancelled payments

### Implementation Plan

```typescript
// src/lib/payfast.ts
interface PayFastPayment {
  merchant_id: string;
  merchant_key: string;
  amount: string;
  item_name: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
}

export function generatePaymentForm(order: Order): PayFastPayment {
  return {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    amount: order.total.toFixed(2),
    item_name: `Order #${order.order_number}`,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/itn`,
  };
}
```

### Security Considerations

- Validate ITN requests
- Verify payment amounts
- Use HTTPS for all callbacks
- Store passphrase securely

## Transactional Email (Planned)

### Purpose

Send order confirmations, password resets, and notifications.

### Provider Options

| Provider | Pros | Cons |
|----------|------|------|
| **SendGrid** | Easy setup, good deliverability | Cost at scale |
| **Mailgun** | Developer-friendly | EU data residency |
| **Azure Communication Services** | Native Azure integration | Newer service |

### Configuration (Future)

```bash
# SendGrid
SENDGRID_API_KEY="your-api-key"
EMAIL_FROM="orders@tassa.co.za"

# OR Mailgun
MAILGUN_API_KEY="your-api-key"
MAILGUN_DOMAIN="mg.tassa.co.za"
```

### Implementation Plan

```typescript
// src/lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendOrderConfirmation(order: Order, user: User) {
  await sgMail.send({
    to: user.email,
    from: process.env.EMAIL_FROM!,
    subject: `Order Confirmation #${order.order_number}`,
    templateId: 'd-order-confirmation-template-id',
    dynamicTemplateData: {
      order_number: order.order_number,
      items: order.items,
      total: order.total,
    },
  });
}
```

### Email Templates (Planned)

| Template | Trigger |
|----------|---------|
| Order Confirmation | Order placed |
| Order Shipped | Tracking added |
| Password Reset | Reset requested |
| Welcome | Registration |
| Quote Response | Admin sends quote |

## Integration Security

### API Key Management

- Store in environment variables
- Use Azure Key Vault in production
- Rotate keys periodically
- Never commit to repository

### Webhook Security

- Validate webhook signatures
- Use HTTPS endpoints
- Implement idempotency
- Log all webhook events

### Rate Limiting

- Implement per-service limits
- Handle rate limit errors gracefully
- Queue requests when needed

## Related Documentation

- [Backend Stack](./04-backend-stack.md)
- [Deployments & Ops](./09-deployments-ops.md)
- [Best Practices - Security](../best-practices/02-security.md)
