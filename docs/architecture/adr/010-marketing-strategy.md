# ADR 010: Marketing Strategy & Integration Roadmap

## Status
Proposed

## Context
A comprehensive marketing strategy is needed to drive customer acquisition, retention, and revenue growth. This ADR consolidates all marketing-related integrations and provides a unified roadmap.

## Marketing Pillars

### 1. Search Engine Marketing (SEM)

#### SEO - Already Implemented
- [x] Product schema markup (JSON-LD)
- [x] Meta tags and Open Graph
- [x] Sitemap.xml
- [x] Clean URLs

#### SEO - To Implement
- [ ] Blog/content marketing section
- [ ] Category landing page optimization
- [ ] FAQ schema markup
- [ ] Local business schema

#### Paid Search (Google Ads)
- Integration via Google Merchant Center (ADR 007)
- Shopping campaigns for product visibility
- Search campaigns for brand terms

### 2. Social Commerce

#### Facebook/Instagram Shops (ADR 007)
- Product catalog sync
- Shopping posts
- Dynamic retargeting ads

#### Content Strategy
- Product showcase posts
- Customer success stories
- Behind-the-scenes content
- Industry tips and guides

### 3. Email Marketing (ADR 004)

#### Automated Flows
- [ ] Welcome series (new subscribers)
- [ ] Abandoned cart recovery
- [ ] Post-purchase follow-up
- [ ] Win-back campaigns
- [ ] Birthday/anniversary emails

#### Manual Campaigns
- Monthly newsletters
- Promotional announcements
- New product launches
- Seasonal campaigns

### 4. Referral & Loyalty

#### Customer Referral Program
- Refer-a-friend discounts
- Tiered rewards
- Social sharing incentives

#### Loyalty Program
- Points per purchase
- Tier-based benefits
- Exclusive member discounts

### 5. Marketplace Expansion (ADR 007)

#### Primary Marketplaces
- Google Shopping (immediate)
- Facebook Catalog (immediate)
- Takealot (Phase 2)

#### B2B Channels
- Industry directories
- Trade platforms
- Supplier networks

## Marketing Technology Stack

| Category | Current | Recommended | ADR |
|----------|---------|-------------|-----|
| Email | None | Brevo (Sendinblue) | 004 |
| Analytics | None | GA4 + Mixpanel | 009 |
| Search | Database | Algolia | 006 |
| Feeds | None | Custom feeds | 007 |
| CRM | None | HubSpot Free | - |

## Integration Roadmap Summary

### Phase 1: Foundation (Month 1)
| Task | ADR | Priority |
|------|-----|----------|
| Set up GA4 | 009 | High |
| Configure email service | 004 | High |
| Implement discount codes | - | High |
| Set up Google Merchant Center | 007 | High |

### Phase 2: Growth (Month 2)
| Task | ADR | Priority |
|------|-----|----------|
| Facebook Catalog integration | 007 | High |
| Email automation flows | 004 | Medium |
| Product search (Algolia) | 006 | Medium |
| Session recording (Clarity) | 009 | Low |

### Phase 3: Expansion (Month 3)
| Task | ADR | Priority |
|------|-----|----------|
| Takealot integration | 007 | Medium |
| Advanced analytics | 009 | Medium |
| Referral program | - | Medium |
| Blog/content section | - | Low |

### Phase 4: Optimization (Month 4+)
| Task | ADR | Priority |
|------|-----|----------|
| A/B testing | 009 | Medium |
| Personalization | 006 | Medium |
| Loyalty program | - | Low |
| Inventory optimization | 008 | Medium |

## Budget Considerations

### Free/Low-Cost Options (Recommended Start)
- Google Analytics 4: Free
- Microsoft Clarity: Free
- Brevo (Sendinblue): Free up to 300 emails/day
- Google Merchant Center: Free listings
- Facebook Shops: Free

### Paid Services (Scale Phase)
- Algolia Search: From $0 (free tier)
- Brevo Premium: From $25/month
- Mixpanel Growth: From $24/month
- Google Ads: Variable (PPC)
- Facebook Ads: Variable (PPC)

### Estimated Monthly Costs
- **Startup Phase:** R0 - R500/month (tools only)
- **Growth Phase:** R500 - R2,000/month
- **Scale Phase:** R2,000 - R10,000/month
- **Ad Spend:** Variable based on ROI

## Key Performance Indicators (KPIs)

### Traffic & Acquisition
- Organic search traffic
- Referral traffic
- Social traffic
- Email click-through rate
- Cost per acquisition (CPA)

### Conversion
- Conversion rate
- Cart abandonment rate
- Average order value (AOV)
- Revenue per visitor

### Retention
- Customer lifetime value (CLV)
- Repeat purchase rate
- Email subscriber growth
- Net promoter score (NPS)

## Admin Dashboard Integration

The marketing admin page should provide:

1. **Quick Stats Overview**
   - Active discount codes
   - Email subscriber count
   - Recent campaign performance
   - Revenue from discounts

2. **Integration Status Panel**
   - Connected services checkmarks
   - Setup wizard for pending integrations
   - Health indicators

3. **Campaign Management**
   - Discount code CRUD
   - Email campaign builder
   - Scheduling tools

4. **Analytics Widgets**
   - Traffic sources chart
   - Conversion funnel
   - Campaign ROI comparison

## Implementation Notes

### Discount Code System (Current)
The current implementation supports:
- Percentage discounts
- Fixed amount discounts
- Free shipping
- Minimum order values
- Usage limits
- Date ranges

### Email Marketing Integration
Requires implementation of:
- Newsletter subscription API
- Webhook for subscriber sync
- Email template system
- Campaign scheduling

### Feed Management
Requires implementation of:
- Product feed endpoints (JSON/XML)
- Automatic feed updates on product changes
- Feed health monitoring

## Consequences

### Positive
- Unified marketing strategy
- Clear implementation priorities
- Measurable outcomes
- Scalable approach

### Negative
- Multiple integrations to maintain
- Learning curve for tools
- Ongoing optimization required

## Related ADRs
- ADR 004: Email Marketing Integration
- ADR 006: Product Search Integration
- ADR 007: Marketplace Feed Integration
- ADR 008: Inventory Management Integration
- ADR 009: Product Analytics Integration
