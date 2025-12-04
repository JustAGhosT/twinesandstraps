# Technology Stack Summary

## Overview

Twines and Straps SA is built on a modern, production-ready web stack designed for e-commerce applications. The stack prioritizes type safety, developer experience, and cloud-native deployment.

## Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 18.x | Server-side JavaScript execution |
| **Language** | TypeScript | 5.9.3 | Type-safe JavaScript |
| **Framework** | Next.js | 14.2.32 | Full-stack React framework |
| **UI Library** | React | 18.x | Component-based UI |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS |
| **Database** | PostgreSQL | - | Relational data storage |
| **ORM** | Prisma | 6.19.0 | Type-safe database access |
| **Validation** | Zod | 4.1.13 | Schema validation |
| **Hosting** | Azure App Service | Linux | Cloud hosting |
| **IaC** | Bicep | - | Infrastructure as Code |

## Stack Rationale

### Why Next.js 14?

- **App Router**: Modern file-based routing with React Server Components
- **Full-stack**: API routes alongside pages
- **Performance**: Built-in optimizations for images, fonts, and code splitting
- **SEO**: Server-side rendering for search engine optimization
- **Deployment**: Optimized for serverless and containerized deployments

### Why TypeScript?

- **Type Safety**: Catch errors at compile time
- **Developer Experience**: IntelliSense and auto-completion
- **Refactoring**: Safe large-scale code changes
- **Documentation**: Types serve as documentation

### Why Prisma?

- **Type Safety**: Auto-generated TypeScript types from schema
- **Migrations**: Version-controlled database schema changes
- **Query Builder**: Intuitive, type-safe query API
- **Multi-database**: Supports PostgreSQL, MySQL, SQLite

### Why Tailwind CSS?

- **Utility-first**: Rapid UI development
- **Customizable**: CSS variables for theming
- **Performance**: Purges unused CSS in production
- **Dark Mode**: Built-in dark mode support

### Why Azure?

- **South African Region**: Low latency for target market
- **Integrated Services**: App Service, PostgreSQL, Blob Storage, Key Vault
- **Enterprise Ready**: Security, compliance, and scalability
- **Cost Effective**: Pay-as-you-go with free tiers available

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    App Service                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Next.js Application                 │    │   │
│  │  │  ┌──────────────┐  ┌──────────────────────┐    │    │   │
│  │  │  │ React UI     │  │ API Route Handlers   │    │    │   │
│  │  │  │ (Tailwind)   │  │ (REST API)           │    │    │   │
│  │  │  └──────────────┘  └──────────────────────┘    │    │   │
│  │  │            │                │                   │    │   │
│  │  │            └────────┬───────┘                   │    │   │
│  │  │                     │                           │    │   │
│  │  │              ┌──────▼──────┐                    │    │   │
│  │  │              │   Prisma    │                    │    │   │
│  │  │              │    ORM      │                    │    │   │
│  │  │              └──────┬──────┘                    │    │   │
│  │  └─────────────────────┼───────────────────────────┘    │   │
│  └────────────────────────┼────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │              PostgreSQL Flexible Server                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   Blob Storage   │  │    Key Vault     │                    │
│  │   (Images)       │  │   (Secrets)      │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Application Insights (Monitoring)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Version Compatibility

| Package | Minimum | Recommended | Notes |
|---------|---------|-------------|-------|
| Node.js | 18.0.0 | 18.x LTS | Required for Next.js 14 |
| npm | 9.0.0 | 10.x | Package manager |
| PostgreSQL | 14 | 15+ | Azure Flexible Server |

## Environment Requirements

### Development
- Node.js 18.x
- npm 9+
- PostgreSQL (local or cloud)

### Production
- Azure App Service (Linux)
- Azure PostgreSQL Flexible Server
- Azure Blob Storage
- Azure Key Vault (optional)

## Related Documentation

- [Frontend Stack](./02-frontend-stack.md)
- [Backend Stack](./04-backend-stack.md)
- [Deployments & Ops](./09-deployments-ops.md)
