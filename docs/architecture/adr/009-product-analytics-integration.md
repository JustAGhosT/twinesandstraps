# ADR 009: Product Analytics Integration

## Status
Proposed

## Context
Understanding product performance, customer behavior, and conversion metrics is essential for business growth. An analytics strategy that combines web analytics, product analytics, and business intelligence is needed.

## Decision Drivers
- Product performance tracking
- Customer journey analysis
- Conversion optimization
- Search behavior insights
- Revenue attribution
- Privacy compliance (POPIA)

## Analytics Layers

### Layer 1: Web Analytics (Traffic & Conversion)

#### Google Analytics 4 (Recommended)
**Status:** Should be implemented

**Features:**
- E-commerce tracking
- User journey analysis
- Conversion funnels
- Audience insights
- Free for most use cases

**Integration:**
- GA4 property setup
- E-commerce events
- Enhanced measurements

#### Microsoft Clarity (Complementary)
**Features:**
- Session recordings
- Heatmaps
- Click tracking
- Free unlimited use

### Layer 2: Product Analytics (User Behavior)

#### Mixpanel
**Pros:**
- Event-based analytics
- User segmentation
- Funnel analysis
- Retention tracking

**Cons:**
- Can be expensive at scale
- Learning curve

**Pricing:**
- Free: 20M events/month
- Growth: From $24/month

#### Amplitude (Alternative)
**Pros:**
- Strong cohort analysis
- Product intelligence
- Generous free tier

**Cons:**
- Complex setup
- US data hosting

#### PostHog (Self-hosted option)
**Pros:**
- Open source
- Self-hosted option
- Feature flags included
- Session recording

**Cons:**
- Infrastructure required
- Less polished UI

### Layer 3: Business Intelligence

#### Metabase (Recommended for Start)
**Pros:**
- Open source
- Direct database queries
- Custom dashboards
- Easy setup

**Cons:**
- Self-hosted
- Limited real-time

#### Google Looker Studio
**Pros:**
- Free
- GA4 integration
- Shareable reports

**Cons:**
- Limited data sources
- GA4 dependency

## Decision
**Recommended Stack:**
1. **Google Analytics 4** - Web analytics & e-commerce (Free)
2. **Microsoft Clarity** - Session recordings & heatmaps (Free)
3. **Mixpanel or PostHog** - Product analytics (based on privacy requirements)
4. **Metabase** - Business intelligence (Self-hosted)

## Integration Roadmap

### Phase 1: Google Analytics 4 Setup (Week 1)
- [ ] Create GA4 property
- [ ] Install gtag.js or next/third-parties
- [ ] Configure e-commerce events
- [ ] Set up conversion goals
- [ ] Enable enhanced e-commerce

### Phase 2: E-commerce Event Tracking (Week 1-2)
- [ ] Track view_item events
- [ ] Track add_to_cart events
- [ ] Track begin_checkout events
- [ ] Track purchase events
- [ ] Track search events

### Phase 3: Microsoft Clarity (Week 2)
- [ ] Create Clarity project
- [ ] Install tracking code
- [ ] Configure recording settings
- [ ] Set up content masking (POPIA)
- [ ] Review first recordings

### Phase 4: Product Analytics (Week 3-4)
- [ ] Choose Mixpanel or PostHog
- [ ] Install SDK
- [ ] Define event taxonomy
- [ ] Implement core events
- [ ] Build first dashboards

### Phase 5: Business Intelligence (Week 4-5)
- [ ] Deploy Metabase
- [ ] Connect to database
- [ ] Create core dashboards
- [ ] Set up automated reports
- [ ] Share with stakeholders

## Technical Implementation

### GA4 E-commerce Events
```typescript
// src/lib/analytics.ts
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const analytics = {
  viewProduct: (product: Product) => {
    window.gtag?.('event', 'view_item', {
      currency: 'ZAR',
      value: product.price,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        item_category: product.category?.name,
        price: product.price,
      }],
    });
  },

  addToCart: (product: Product, quantity: number) => {
    window.gtag?.('event', 'add_to_cart', {
      currency: 'ZAR',
      value: product.price * quantity,
      items: [{
        item_id: product.id.toString(),
        item_name: product.name,
        item_category: product.category?.name,
        price: product.price,
        quantity,
      }],
    });
  },

  beginCheckout: (cart: CartItem[]) => {
    window.gtag?.('event', 'begin_checkout', {
      currency: 'ZAR',
      value: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      items: cart.map(item => ({
        item_id: item.id.toString(),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },

  purchase: (order: Order) => {
    window.gtag?.('event', 'purchase', {
      transaction_id: order.order_number,
      currency: 'ZAR',
      value: order.total,
      tax: order.vat_amount,
      shipping: order.shipping_cost,
      items: order.items.map(item => ({
        item_id: item.product_id.toString(),
        item_name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
      })),
    });
  },

  search: (query: string, results_count: number) => {
    window.gtag?.('event', 'search', {
      search_term: query,
      results_count,
    });
  },
};
```

### Analytics Provider Component
```typescript
// src/components/AnalyticsProvider.tsx
'use client';

import Script from 'next/script';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA4_ID;
  const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <>
      {/* Google Analytics 4 */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity */}
      {CLARITY_ID && (
        <Script id="clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${CLARITY_ID}");
          `}
        </Script>
      )}

      {children}
    </>
  );
}
```

### Mixpanel Integration
```typescript
// src/lib/mixpanel.ts
import mixpanel from 'mixpanel-browser';

export function initMixpanel() {
  if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
}

export const productAnalytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    mixpanel.track(event, properties);
  },

  identify: (userId: string, traits?: Record<string, unknown>) => {
    mixpanel.identify(userId);
    if (traits) mixpanel.people.set(traits);
  },

  trackProductView: (product: Product) => {
    mixpanel.track('Product Viewed', {
      product_id: product.id,
      product_name: product.name,
      category: product.category?.name,
      price: product.price,
    });
  },

  trackAddToCart: (product: Product, quantity: number) => {
    mixpanel.track('Added to Cart', {
      product_id: product.id,
      product_name: product.name,
      quantity,
      value: product.price * quantity,
    });
  },
};
```

## Key Metrics Dashboard

### Product Performance
- Page views per product
- Add to cart rate
- Conversion rate by product
- Revenue per product
- Return rate by product

### Customer Behavior
- Sessions by source
- Average session duration
- Pages per session
- Bounce rate by page
- Search query analysis

### Business Metrics
- Revenue by day/week/month
- Average order value
- Customer acquisition cost
- Customer lifetime value
- Cart abandonment rate

## Environment Variables
```env
# Google Analytics 4
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX

# Microsoft Clarity
NEXT_PUBLIC_CLARITY_ID=xxxxxxxxxx

# Mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token

# PostHog (Alternative)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Privacy Considerations (POPIA)

- [ ] Implement cookie consent banner
- [ ] Configure data retention policies
- [ ] Enable IP anonymization
- [ ] Set up data masking in Clarity
- [ ] Create privacy policy updates
- [ ] Configure user data deletion capability

## Consequences

### Positive
- Data-driven product decisions
- Improved conversion rates
- Better customer understanding
- Revenue optimization
- Marketing attribution

### Negative
- Implementation effort
- Privacy considerations
- Data overload risk
- Multiple tool management

## Related ADRs
- ADR 006: Product Search Integration (search analytics)
- ADR 004: Email Marketing Integration (campaign tracking)
