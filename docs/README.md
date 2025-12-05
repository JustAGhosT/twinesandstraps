# Documentation

Welcome to the Twines and Straps SA documentation. This index helps you find the right guide for your needs.

---

## 📚 Documentation Structure

Our documentation is organized into logical categories for easy navigation:

- **[Getting Started](#getting-started)** - Setup and onboarding guides
- **[Guides](#guides)** - Operational documentation for different roles
- **[Architecture](#architecture)** - Technical architecture and design decisions
- **[Planning](#planning)** - Product planning and roadmaps
- **[Analysis](#analysis)** - Project analysis and reports
- **[Reference](#reference)** - Quick reference materials

---

## Getting Started

New to the project? Start here.

| Document | Description |
|----------|-------------|
| [Setup Guide](./getting-started/setup.md) | Installation, environment setup, database configuration, and deployment |
| [Demo Workflow](./getting-started/demo-workflow.md) | Step-by-step guide for presenting the platform |

---

## Guides

### Deployment

| Document | Description |
|----------|-------------|
| [Azure Deployment](./guides/deployment/azure-deployment.md) | Deploy to Azure with Bicep infrastructure and CI/CD |
| [Deployment Pipeline](./guides/deployment/deployment-pipeline.md) | CI/CD workflows, build configuration, and troubleshooting |

### Administration

| Document | Description |
|----------|-------------|
| [Feature Flags](./guides/administration/feature-flags.md) | Toggle site features on/off without code changes |
| [Implementation Summary](./guides/administration/implementation-summary.md) | Overview of the WhatsApp quote system |

### Development

| Document | Description |
|----------|-------------|
| [API Reference](./guides/development/api-reference.md) | REST API endpoints for products, categories, and admin |
| [Design System](./guides/development/design-system.md) | Color palette, typography, and component styles |
| [Best Practices](./guides/development/best-practices.md) | Industry standards for the project's tech stack |

---

## Architecture

### Architecture Decision Records (ADRs)

Architecture Decision Records document important architectural decisions made throughout the project.

| ADR | Title |
|-----|-------|
| [001](./architecture/adr/001-css-styling-approach.md) | CSS Styling Approach |
| [002](./architecture/adr/002-payment-gateway-integration.md) | Payment Gateway Integration |
| [003](./architecture/adr/003-shipping-integration.md) | Shipping Integration |
| [004](./architecture/adr/004-email-marketing-integration.md) | Email Marketing Integration |
| [005](./architecture/adr/005-accounting-integration.md) | Accounting Integration |
| [006](./architecture/adr/006-product-search-integration.md) | Product Search Integration |
| [007](./architecture/adr/007-marketplace-feed-integration.md) | Marketplace Feed Integration |
| [008](./architecture/adr/008-inventory-management-integration.md) | Inventory Management Integration |
| [009](./architecture/adr/009-product-analytics-integration.md) | Product Analytics Integration |
| [010](./architecture/adr/010-marketing-strategy.md) | Marketing Strategy |
| [011](./architecture/adr/011-hosting-infrastructure-decision.md) | Hosting Infrastructure Decision |

---

## Planning

Product planning, roadmaps, and strategic documents.

| Document | Description |
|----------|-------------|
| [Product Requirements (PRD)](./planning/product-requirements.md) | Full product vision, user stories, and business objectives |
| [Phased Improvement Plan](./planning/phased-improvement-plan.md) | **Comprehensive 10-phase roadmap with priorities and timelines** |
| [Improvement Phases](./planning/improvement-phases.md) | Original improvement roadmap (see Phased Improvement Plan for updated version) |
| [Integrations Roadmap](./planning/integrations-roadmap.md) | Planned third-party integrations |
| [Marketing Strategy](./planning/marketing-strategy.md) | Marketing approach and strategy |
| [Moodboard](./planning/moodboard.md) | Design inspiration and visual direction |

---

## Analysis

Project analysis, reports, and assessments.

| Document | Description |
|----------|-------------|
| [Project Analysis](./analysis/project-analysis.md) | Technology assessment and project context overview |
| [Core Analysis](./analysis/core-analysis.md) | Detailed findings on bugs, improvements, and recommendations |
| [Detailed Report](./analysis/detailed-report.md) | Comprehensive analysis with design system assessment |
| [Summary Table](./analysis/summary-table.md) | Quick reference table of all identified issues |
| [Dark Mode & Usability](./analysis/dark-mode-usability.md) | Dark mode implementation and usability improvements |
| [Cost Analysis](./analysis/cost-analysis.md) | Hosting costs, comparisons, and total cost of ownership |

---

## Reference

Quick reference materials and historical documents.

| Document | Description |
|----------|-------------|
| [Changelog](./reference/changelog.md) | History of notable changes |
| [Client Questions](./reference/client-questions.md) | Information needed from the client for site enhancement |
| [Migration Issue](./reference/migration-issue.md) | Database migration troubleshooting |

---

## Quick Links

- 🌐 **Live Sites:**
  - **Production:** [https://prod-app-san-tassa.azurewebsites.net](https://prod-app-san-tassa.azurewebsites.net)
  - **Staging:** [https://staging-app-san-tassa.azurewebsites.net](https://staging-app-san-tassa.azurewebsites.net)
  - **Development:** [https://dev-app-san-tassa.azurewebsites.net](https://dev-app-san-tassa.azurewebsites.net)
- 💻 **Repository:** [github.com/JustAGhosT/twinesandstraps](https://github.com/JustAGhosT/twinesandstraps)

---

## Documentation Standards

This documentation follows these best practices:

- **File Naming:** All files use kebab-case (lowercase with hyphens)
- **Organization:** Content is grouped by purpose and audience
- **Structure:** Clear hierarchy with logical categorization
- **Links:** All internal links use relative paths
- **Formatting:** Consistent markdown formatting throughout
