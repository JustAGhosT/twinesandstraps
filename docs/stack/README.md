# Technology Stack Documentation

This directory contains detailed documentation about the technology stack used in the Twines and Straps SA e-commerce platform.

## Overview

The platform is built on a modern web stack optimized for e-commerce, with a focus on performance, developer experience, and maintainability.

## Documents

| Document | Description |
|----------|-------------|
| [Technology Summary](./01-technology-summary.md) | High-level overview of all technologies |
| [Frontend Stack](./02-frontend-stack.md) | React, Next.js, and UI technologies |
| [State Management](./03-state-management.md) | React Context architecture |
| [Backend Stack](./04-backend-stack.md) | API framework and server-side technologies |
| [API Architecture](./05-api-architecture.md) | REST API design and patterns |
| [Data & Storage](./06-data-storage.md) | Database and file storage |
| [Tooling & Dev Experience](./07-tooling-dev-experience.md) | Development tools and workflows |
| [Testing & QA](./08-testing-qa.md) | Test frameworks and strategies |
| [Deployments & Ops](./09-deployments-ops.md) | CI/CD and infrastructure |
| [External Integrations](./10-external-integrations.md) | Third-party services |
| [Project Domain & Scale](./11-project-domain-scale.md) | Business context and scaling |

## Quick Reference

```
Runtime:     Node.js 18.x
Language:    TypeScript 5.9.3
Framework:   Next.js 14.2.32 (App Router)
UI:          React 18.x + Tailwind CSS 3.4
Database:    PostgreSQL (Azure Flexible Server)
ORM:         Prisma 6.19.0
Hosting:     Azure App Service
IaC:         Bicep
```

## Related Documentation

- [Best Practices](../best-practices/README.md) - Coding standards and guidelines
- [Setup Guide](../SETUP.md) - Environment setup
- [Azure Deployment](../AZURE_DEPLOYMENT.md) - Deployment procedures
