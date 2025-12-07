# Product Requirements Document (PRD)

Full product vision and business requirements for the Twines and Straps SA e-commerce platform.

---

## 1. Executive Summary

Twines and Straps SA will launch a combined **B2C/B2B e-commerce platform** with direct online sales, VAT-compliant pricing, and a streamlined request-for-quote (RFQ) flow for business buyers. The platform will enable non-technical staff to manage products, pricing, and content safely and quickly, while integrating secure online payments and foundational analytics. The solution is phased to deliver a revenue-generating MVP, followed by robust B2B quoting and reporting enhancements.

---

## 2. Business Objectives & Success Criteria

### Objectives
- Grow incremental digital revenue with a reliable online storefront.
- Reduce admin workload via self-service and efficient catalog tools.
- Improve time-to-market for price and content changes.
- Establish a compliant foundation for VAT, privacy, and payments.

### Success Metrics (12 months unless stated)
- **Online revenue contribution:** ≥ 10% of total.
- **Quote conversion rate:** ≥ 20% within 6 months.
- **Catalog update latency:** < 2 hours from publish to live.
- **Checkout CSAT:** ≥ 4.3/5; **NPS** ≥ 40.
- **Admin time saved:** ≥ 30% on catalog/order tasks.
- **Site reliability:** ≥ 99.5% monthly uptime.

---

## 3. Scope

### In Scope (MVP + Phased)
- Catalog browsing, advanced filtering, product detail pages.
- Cart and checkout with **PayFast** payment integration (Partially Implemented - Interface Ready).
- Basic customer accounts with order history.
- Admin portal for product, price, and media management.
- VAT display and calculation; transactional emails; **GA4 analytics**.
- **Phase 2:** B2B quote request, admin quote adjustments, PDF generation, and acceptance → order conversion.
- Basic reporting for orders and quotes.

### Out of Scope (Initially)
- Same-day shipping and complex fulfillment automation.
- B2B credit accounts and automated invoicing.
- Native mobile apps and complex loyalty/subscription programs.
- Deep ERP/CRM integrations (post-MVP).

---

## 4. Architectural Overview

The application follows a layered architecture to ensure maintainability and testability:

- **Presentation Layer**: Next.js App Router (React Server Components).
- **Service/Logic Layer**: Dedicated services for business logic (e.g., `PayFastService`, `WhatsAppService`).
- **Data Access Layer**: Repository Pattern (`IProductRepository`, `PrismaProductRepository`) abstracting the ORM (Prisma).

### Key Integrations
- **Database**: PostgreSQL (via Prisma ORM).
- **Payments**: PayFast (Abstracted via `IPaymentGateway`).
- **Messaging**: WhatsApp (Abstracted via `IMessagingService`).

---

## 5. Stakeholders

- **Directors:** Strategy, approvals, budget.
- **Marketing:** Content, campaigns, analytics.
- **Finance:** Reconciliation, VAT compliance, payouts.
- **IT/Development:** Implementation, security, support.
- **Operations/Admin:** Catalog updates, order/quote handling.
- **Customer Support:** Order inquiries, returns, quote follow-ups.

---

## 6. Personas

### Retail Customer (Consumer)
- **Needs:** Clear specs, transparent VAT/shipping, trusted payments, mobile-friendly flow.
- **Behaviors:** Price-sensitive, mobile-first, expects self-service.

### Business Buyer (Procurement/SME)
- **Needs:** Bulk pricing, VAT-compliant quotes/invoices, predictable lead times, downloadable PDFs.
- **Behaviors:** Desktop-oriented, requires documentation for approvals.

### Admin Staff (Catalog/Operations)
- **Needs:** Fast product updates, low error risk, bulk import, previews, rollback, audit trail.
- **Behaviors:** Time-constrained, non-technical, needs clear guardrails.

---

## 7. User Stories & Acceptance Criteria

*(High-level stories, detailed requirements in Section 8)*

---

## 8. Key User Flows

### Retail Checkout Flow
1.  **Home Page:** User arrives, sees featured products/categories.
2.  **Catalog/Search:** User navigates to a category page or uses search to find products. Applies filters (e.g., material, price).
3.  **Product Detail Page:** User views product images, specs, price, and stock status. Selects a variant (if any) and quantity.
4.  **Add to Cart:** User clicks "Add to Cart." A confirmation toast/modal appears.
5.  **Cart Page:** User reviews items, adjusts quantities, or removes products. Sees subtotal, VAT, and estimated shipping.
6.  **Checkout:** User proceeds to checkout, chooses between Guest or Login.
7.  **Shipping & Billing:** User enters or confirms shipping and billing addresses.
8.  **Payment:** User is redirected to PayFast to complete payment securely.
9.  **Confirmation:** User returns to the site, sees an order confirmation page, and receives a confirmation email.

### B2B Quote Flow
1.  **Catalog/Product Page:** User finds a product and clicks "Request a Quote."
2.  **Quote Form:** User adds multiple products/SKUs and quantities. Fills in company details, VAT number, and contact information. Adds notes or attaches a file (e.g., PO).
3.  **Submission:** User submits the form and receives an on-screen confirmation and tracking link via email. Admin is notified.
4.  **Admin Review:** Admin logs in, reviews the quote request, adjusts pricing/quantities as needed.
5.  **Send Quote:** Admin approves and sends the official PDF quote to the buyer via email.
6.  **Buyer Acceptance:** Buyer reviews the PDF, and clicks an "Accept Quote" link from the email.
7.  **Order Conversion:** The quote is automatically converted into an order. The buyer receives a payment link to complete the purchase via PayFast.

### Admin Catalog Update Flow
1.  **Login:** Admin user logs into the secure admin portal.
2.  **Dashboard:** Views a summary of recent orders and quotes.
3.  **Product List:** Navigates to the product catalog management section.
4.  **Create/Edit Product:** Fills out a form with product details: name, SKU, description, specs, images, categories, price, VAT status, and stock level.
5.  **Preview:** Admin previews the changes as they would appear on the live site.
6.  **Publish:** Admin saves and publishes the changes. The system validates the data.
7.  **Propagation:** Changes are reflected on the storefront within the defined SLA (<15 minutes). An audit log entry is created.

---

## 19. Admin Roles & Permissions

| Feature / Action            | Editor                               | Admin                                |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| **Product Management**      | Create, Edit, Delete Own Products    | Full CRUD on All Products            |
| **Category Management**     | Assign products to categories        | Create, Edit, Delete Categories      |
| **Price Management**        | View Prices                          | Edit Prices, Set Discounts           |
| **Order Management**        | View Orders                          | View & Update Order Status           |
| **Quote Management**        | View & Draft Quotes                  | Full CRUD on Quotes, Approve & Send  |
| **User Management**         | -                                    | Invite/Manage Admin & Editor Users   |
| **Site Content (Pages)**    | Edit Pages                           | Full CRUD on Pages                   |
| **Settings & Configuration**| -                                    | Manage Shipping, Tax, Payment Config |

---

## 22. Risks & Mitigations

| Risk Category         | Description                                             | Likelihood | Impact | Mitigation Strategy                                                                                             |
| --------------------- | ------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| **Technical Risk**    | Payment gateway (PayFast) outage                        | Low        | High   | Implement graceful degradation with clear user messaging. Set up monitoring and alerts. Plan for a secondary gateway (PayGate) post-MVP. |
| **Project Risk**      | Scope Creep                                             | Medium     | High   | Adhere strictly to the phased release plan. All changes to go through a formal change request process reviewed by stakeholders. |
| **Security Risk**     | Data breach or unauthorized access to admin portal      | Low        | High   | Enforce strong passwords, implement role-based access control (RBAC), conduct regular security audits, and follow OWASP Top 10 guidelines. |
| **Operational Risk**  | Incorrect product data or pricing uploaded by admin staff | Medium     | Medium | Implement CSV validation, a mandatory "preview" step before publishing, and versioning with rollback functionality. |
| **Compliance Risk**   | Non-compliance with POPIA or VAT regulations          | Low        | High   | Consult with legal and financial experts during development. Ensure clear privacy notices, consent capture, and accurate VAT calculations. |

---

## 24. Open Questions

-   **Shipping:** For the MVP, should we use a single flat rate, or a table-rate based on region/weight? What are the initial serviceable regions?
-   **VAT Display:** Should prices be displayed as VAT-inclusive or exclusive by default? Should there be a toggle for users?
-   **Product Data:** What is the minimum viable set of product attributes and specifications required for launch?
-   **Quotes:** What should be the default expiry period for quotes (e.g., 14 or 30 days)? Are there predefined discount limits for editors vs. admins?
-   **Returns:** What is the official returns and refunds policy? This needs to be available on the storefront and in transactional emails.
-   **Email:** Which email provider (e.g., SendGrid, Mailgun) and sender domains will be used? This is needed for SPF/DKIM setup.
-   **Content:** Who is responsible for providing the initial product data, images, and other marketing content?

---

*(Other sections remain as previously defined)*
