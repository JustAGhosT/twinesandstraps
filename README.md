# Twines and Straps SA

[![CI/CD Pipeline](https://github.com/JustAGhosT/twinesandstraps/actions/workflows/ci.yml/badge.svg)](https://github.com/JustAGhosT/twinesandstraps/actions/workflows/ci.yml)
[![Deploy to Azure](https://github.com/JustAGhosT/twinesandstraps/actions/workflows/azure-deploy.yml/badge.svg)](https://github.com/JustAGhosT/twinesandstraps/actions/workflows/azure-deploy.yml)
[![Azure Health Check](https://github.com/JustAGhosT/twinesandstraps/actions/workflows/azure-health-check.yml/badge.svg)](https://github.com/JustAGhosT/twinesandstraps/actions/workflows/azure-health-check.yml)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![Azure](https://img.shields.io/badge/Azure-App_Service-0078D4?logo=microsoft-azure)](https://azure.microsoft.com/)

**An e-commerce platform for South Africa's premier industrial twines and ropes manufacturer.**

🌐 **Live Sites:**

| Environment | URL | Status |
|-------------|-----|--------|
| **Production** | [prod-app-san-tassa.azurewebsites.net](https://prod-app-san-tassa.azurewebsites.net) | 🟢 Live |
| **Staging** | [staging-app-san-tassa.azurewebsites.net](https://staging-app-san-tassa.azurewebsites.net) | 🟡 Pre-release |
| **Development** | [dev-app-san-tassa.azurewebsites.net](https://dev-app-san-tassa.azurewebsites.net) | 🔵 Development |

---

## What We Do

Twines and Straps SA manufactures and supplies high-quality industrial twines, ropes, and strapping solutions to businesses across South Africa. This platform serves as our digital storefront, enabling:

- **Easy Product Discovery** — Browse our complete catalog of industrial twines, ropes, and straps with detailed specifications
- **Request for Quote** — Get personalized pricing for bulk orders via our WhatsApp integration
- **Self-Service for Businesses** — B2B buyers can explore products, compare specifications, and request quotes 24/7

## Who It's For

| Customer Type             | How We Help                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| **Retail Buyers**         | Browse products, view prices, and request quotes for smaller orders                 |
| **Business Buyers (B2B)** | Explore bulk options, compare specs, and get personalized quotes for large orders   |
| **Procurement Teams**     | Access technical specifications, product datasheets, and streamlined quote requests |

## Key Features

### 🛒 Product Catalog
- **Comprehensive listings** with technical specifications (material, diameter, length, strength rating)
- **Category-based browsing** for easy navigation
- **Stock availability** at a glance
- **South African pricing** in ZAR with VAT support

### 💬 Quote-Based Purchasing
- **WhatsApp integration** for instant quote requests
- **Cart functionality** to collect items and request bulk quotes
- **No commitment checkout** — just easy communication with our sales team

### ⚙️ Admin Portal
- **Product management** — add, edit, and organize your catalog
- **Category management** — create and maintain product categories
- **Feature flags** — toggle site features without code changes
- **No technical knowledge required** — designed for non-technical staff

### 📱 Mobile-First Design
- Fully responsive across all devices
- Touch-friendly interface
- Fast loading times

## Recent Improvements

As part of a comprehensive analysis, several improvements have been implemented to enhance the project's performance, user experience, and code quality:

- **Performance:**
  - Implemented a loading skeleton for the product detail page to provide immediate feedback to users.
  - Parallelized data fetching to reduce page load times.
  - Implemented Incremental Static Regeneration (ISR) to serve static content with periodic revalidation.
  - Optimized font loading with `next/font`.
- **User Experience:**
  - Added a custom error boundary to provide a better user experience on data fetching errors.
  - Implemented focus-trapping for the image zoom modal to improve accessibility.
  - Added a custom `NotFound` component for a more consistent user experience.
- **Code Quality:**
  - Created a dedicated `Button` component to ensure consistent button styles.
  - Centralized data fetching logic to improve maintainability.
  - Implemented a CSS variable-based theming system for easier customization.
  - Added the `ProductWithCategory` type for improved type safety.
  - Refactored the JSON-LD script for better SEO.
  - Fixed accessibility issues in the breadcrumbs.
  - Added the `NEXT_PUBLIC_SITE_URL` environment variable to the `.env.example` file.

## Design System

The project's design system has been reverse-engineered from the existing UI. For a detailed overview of the color palette, typography, and component styles, please see the [Design System Documentation](./docs/guides/development/design-system.md).

## Theming

The project uses a CSS variable-based theming system, defined in `src/styles/globals.css`. This allows for easy customization of the site's appearance. The theme can be updated by modifying the CSS variables in this file.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** Tailwind CSS
- **Hosting:** Azure App Service

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/JustAGhosT/twinesandstraps.git
cd twinesandstraps

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Documentation

| Document                                       | Description                                               |
| ---------------------------------------------- | --------------------------------------------------------- |
| [Setup Guide](./docs/getting-started/setup.md) | Environment setup, database configuration, and deployment |
| [Azure Deployment](./docs/guides/deployment/azure-deployment.md) | Deploy to Azure with Bicep infrastructure and CI/CD       |
| [Design System](./docs/guides/development/design-system.md) | Color palette, typography, and component styles           |
| [Best Practices](./docs/guides/development/best-practices.md) | Industry standards for the project's tech stack           |
| [Product Requirements](./docs/planning/product-requirements.md) | Full product vision and business requirements             |
| [Feature Flags](./docs/guides/administration/feature-flags.md) | Toggle features on/off without code changes               |
| [API Reference](./docs/guides/development/api-reference.md) | REST API documentation for developers                     |
| [All Documentation](./docs/README.md)          | Complete documentation index                              |

## Future Development Guidance

For future development, please adhere to the following guidelines:

- **Component Library:** Utilize the existing component library and contribute to it when creating new UI elements.
- **Data Fetching:** Use the centralized data fetching functions in `src/lib/data.ts`.
- **Error Handling:** Implement error boundaries for all pages that fetch data.
- **Testing:** Write unit tests for all new components and business logic.

## Contributing

We welcome contributions! Please see our documentation for development guidelines.

## License

This project is proprietary software for Twines and Straps SA.
