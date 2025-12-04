# Project Domain & Scale

## Overview

This document describes the business domain, target market, and scaling considerations for the Twines and Straps SA e-commerce platform.

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | B2C/B2B E-commerce Platform |
| **Domain** | Industrial Supplies |
| **Industry** | Manufacturing & Distribution |
| **Business Model** | Hybrid (Direct Sales + Quote-based) |
| **Target Market** | South Africa |

## Business Domain

### Product Domain

**Primary Products:**
- Industrial twines
- Ropes (various materials)
- Strapping solutions
- Related accessories

**Product Attributes:**
- Material (polypropby, sisal, manila, nylon)
- Diameter (mm)
- Length (meters)
- Strength rating (kg/kN)
- Price (ZAR)
- Stock status

### Industry Context

| Sector | Use Cases |
|--------|-----------|
| **Agriculture** | Baling twine, crop support |
| **Marine** | Mooring, fishing |
| **Construction** | Safety lines, hoisting |
| **Manufacturing** | Packaging, bundling |
| **Retail** | Consumer ropes, DIY |

## Target Users

### Customer Segments

| Segment | Description | Characteristics |
|---------|-------------|-----------------|
| **Retail Buyers** | Individual consumers | Price-sensitive, mobile-first, small orders |
| **Business Buyers** | Procurement teams, SMEs | Volume orders, need documentation, desktop-oriented |
| **Procurement Teams** | Corporate buyers | Require specs, quotes, VAT compliance |

### User Personas

#### Retail Customer

```
Name: Johan van der Merwe
Role: Farm owner
Needs:
- Clear product specifications
- Transparent pricing with VAT
- Mobile-friendly ordering
- Quick delivery information
Behavior:
- Browses on mobile
- Compares products
- Prefers self-service
```

#### Business Buyer

```
Name: Sipho Ndlovu
Role: Procurement Manager at Construction Co.
Needs:
- Bulk pricing
- VAT-compliant quotes and invoices
- Product datasheets
- Reliable lead times
Behavior:
- Uses desktop for orders
- Requires documentation for approvals
- Builds ongoing relationships
```

#### Admin Staff

```
Name: Maria Botha
Role: Catalog Manager
Needs:
- Easy product updates
- Bulk import capabilities
- Preview before publish
- Audit trail
Behavior:
- Non-technical
- Time-constrained
- Needs clear guardrails
```

## Geographic Scope

### Primary Market

**South Africa**
- Currency: ZAR (South African Rand)
- VAT Rate: 15%
- Primary Language: English
- Azure Region: South Africa North

### Regional Considerations

| Factor | Approach |
|--------|----------|
| **Currency** | ZAR only (no multi-currency) |
| **Tax** | VAT-inclusive display |
| **Shipping** | Domestic only initially |
| **Payment** | PayFast (SA gateway) |
| **Language** | English (single language) |

## Scale Expectations

### Current Scale

| Metric | Expected Range |
|--------|----------------|
| **Products** | 100 - 1,000 |
| **Categories** | 10 - 50 |
| **Users** | < 10,000 |
| **Orders/Month** | < 1,000 |
| **Concurrent Users** | < 100 |

### Growth Targets (12 months)

| Metric | Target |
|--------|--------|
| **Online Revenue** | ≥ 10% of total |
| **Quote Conversion** | ≥ 20% |
| **Monthly Orders** | 500+ |
| **Registered Users** | 1,000+ |

### Architecture Implications

| Scale Factor | Current Approach | Future Consideration |
|--------------|------------------|---------------------|
| **Database** | Single PostgreSQL | Read replicas if needed |
| **Caching** | ISR + Browser cache | Redis/CDN if needed |
| **File Storage** | Azure Blob | CDN for images |
| **Search** | Database queries | Algolia/Elasticsearch |
| **Sessions** | Database | Redis if needed |

## Feature Flags

The platform uses feature flags to control feature rollout:

```typescript
// Current feature flags
{
  // Enabled
  testimonials: true,
  newsletterSignup: true,
  whatsappButton: true,
  wishlist: true,
  compareProducts: true,

  // Disabled (future features)
  productReviews: false,
  checkout: false,  // Currently quote-based only
}
```

## Business Requirements

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | ≥ 99.5% | Azure monitoring |
| **Page Load** | < 3s | Core Web Vitals |
| **Catalog Update** | < 2 hours | Time to publish |
| **Checkout CSAT** | ≥ 4.3/5 | User surveys |
| **Admin Time Saved** | ≥ 30% | Time tracking |

### Compliance Requirements

| Requirement | Status |
|-------------|--------|
| **POPIA** (Data Protection) | Privacy notice implemented |
| **VAT Compliance** | 15% VAT calculated |
| **OWASP Security** | Guidelines followed |
| **Accessibility** | WCAG 2.1 AA target |

## Team Structure Hints

Based on codebase analysis:

### Team Characteristics

| Indicator | Observation |
|-----------|-------------|
| **Repository** | Single repo (monolithic) |
| **Workspaces** | No monorepo configuration |
| **ADRs** | Documentation-focused culture |
| **Comments** | Comprehensive inline docs |
| **AI Tooling** | Copilot instructions present |
| **Feature Flags** | Staged rollout approach |

### Inferred Team Size

**Estimated: 1-3 developers**

Evidence:
- Single coding style throughout
- No CODEOWNERS file
- Simple branching strategy
- Direct commit history
- Comprehensive self-documentation

### Development Approach

| Practice | Evidence |
|----------|----------|
| **Trunk-based** | Main branch focus |
| **CI/CD** | GitHub Actions |
| **IaC** | Bicep templates |
| **Documentation** | Extensive docs/ folder |
| **Testing** | Jest setup present |

## Technology Decisions

### Why These Choices?

| Decision | Rationale |
|----------|-----------|
| **Next.js** | Full-stack, SEO-friendly, React ecosystem |
| **PostgreSQL** | Relational data, Azure integration |
| **Tailwind CSS** | Rapid development, consistent styling |
| **Azure** | South African region, integrated services |
| **TypeScript** | Type safety, maintainability |

### Trade-offs Accepted

| Trade-off | Benefit | Cost |
|-----------|---------|------|
| **No headless CMS** | Simpler architecture | Limited content flexibility |
| **No CDN** | Reduced complexity | Slower for distant users |
| **Single language** | Faster development | Limited market reach |
| **Quote-based** | Flexibility | No instant purchase |

## Future Considerations

### Phase 2 Features

- Full e-commerce checkout
- B2B quote management
- PDF generation
- Advanced reporting

### Scaling Triggers

| Trigger | Action |
|---------|--------|
| Products > 5,000 | Add search service |
| Users > 50,000 | Add caching layer |
| Orders > 10,000/month | Consider microservices |
| International expansion | Multi-currency, CDN |

## Related Documentation

- [Technology Summary](./01-technology-summary.md)
- [Deployments & Ops](./09-deployments-ops.md)
- [PRD](../PRD.md)
