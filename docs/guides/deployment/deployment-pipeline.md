# Deployment Pipeline

Technical documentation for the CI/CD pipeline and deployment infrastructure.

> **Looking for setup instructions?** See the [Setup Guide](../../getting-started/setup.md) for environment configuration and deployment steps.

---

## Overview

The deployment pipeline ensures code quality and reliable deployments through:
1. **GitHub Actions** — Automated testing and CI/CD
2. **Azure App Service** — Automated builds and deployments
3. **Health Checks** — Post-deployment validation

---

## GitHub Actions Workflows

### Continuous Integration (`ci.yml`)

Runs on pushes to `main`/`develop` and on pull requests.

| Job | Purpose |
|-----|---------|
| Lint Check | ESLint validation for code quality |
| Type Check | TypeScript type safety verification |
| Build Test | Ensures the application compiles |
| Config Validation | Validates `package.json` and infrastructure configs |

### Deployment Health Check (`deployment-health.yml`)

Runs automatically after Azure deployment completes.

| Check | Purpose |
|-------|---------|
| URL Accessibility | Verifies deployment is reachable |
| HTTP Response | Validates status codes |
| Error Detection | Checks for common deployment errors |

### Required GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

| Secret | Where to Find |
|--------|---------------|
| `AZURE_CREDENTIALS` | Service principal credentials (JSON) - see [Azure Setup](./azure-deployment.md#initial-setup) |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_RG_DEV` | Resource group name (e.g., `dev-rg-san-tassa`) |
| `AZURE_WEBAPP_NAME_DEV` | Web app name (e.g., `dev-app-san-tassa`) |

---

## Azure Configuration

The infrastructure is configured using Bicep templates in `infra/bicep/`. See [Azure Deployment Guide](./azure-deployment.md) for details.

### Build Pipeline

```
1. npm run lint        # ESLint validation
2. prisma generate     # Generate Prisma client
3. tsx scripts/migrate-production.ts  # Apply migrations
4. next build          # Build Next.js app
```

### Context-Specific Builds

| Context | Command | Use Case |
|---------|---------|----------|
| Production | `npm run lint && npm run build` | Live site |
| Deploy Preview | `npm run lint && npm run build` | PR previews |
| Branch Deploy | `npm run build` | Feature branches (faster) |

### Security Headers

Applied automatically to all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info |
| `Permissions-Policy` | Restricted | Limits browser features |

### Performance Optimization

- **Static Asset Caching** — `/_next/static/*` cached for 1 year (immutable)
- **Automatic Compression** — gzip/brotli handled by Azure App Service
- **Global CDN** — Azure Front Door for fast access worldwide
- **SSL/TLS** — Automatic certificate management

---

## Rendering Strategy

The application uses **dynamic rendering** for database-driven pages to ensure real-time data:

- **Home page** (`/`): Dynamic rendering - fetches featured products and categories at request time
- **Products page** (`/products`): Dynamic rendering - fetches all products at request time  
- **Product detail page** (`/products/[id]`): Dynamic rendering - fetches specific product at request time

This approach:
- Eliminates build-time database requirements
- Ensures fresh data on every request
- Works seamlessly with Azure App Service
- Avoids static generation errors when database is unavailable during build

Pages are marked with `export const dynamic = 'force-dynamic'` to explicitly enable server-side rendering on demand.

## Deployment Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions CI runs (lint, type-check, build)
   ↓
3. If CI passes, GitHub Actions triggers Azure deployment
   ↓
4. Azure runs build and deployment
   ↓
5. Application deployed to Azure App Service
   ↓
6. Deployment health check runs
   ↓
7. Site is live (or rolled back if health check fails)
```

## Benefits of This Pipeline

1. **Quality Assurance**: Multiple validation stages catch issues early
2. **Security**: Built-in security headers protect users
3. **Performance**: Optimized caching and CDN distribution
4. **Reliability**: Health checks ensure successful deployments
5. **Developer Experience**: Fast feedback with CI/CD automation
6. **SEO**: Proper redirects and response codes
7. **Scalability**: Context-specific builds optimize resources

## Monitoring and Alerts

- GitHub Actions provides build status badges
- Azure provides deployment notifications via GitHub Actions
- Failed deployments trigger notifications
- Health check failures are logged in GitHub Actions

## Troubleshooting

### "Unable to open the database file" Error (Error code 14)

This error occurs when the application tries to use SQLite file-based storage in a serverless environment.

**Error message:**
```
PrismaClientInitializationError: 
Invalid `prisma.product.findMany()` invocation:
Error querying the database: Error code 14: Unable to open the database file
```

**Cause:**
SQLite file-based databases (`file:./dev.db`) do not work in cloud environments like Azure App Service because:
- Serverless functions are ephemeral (they shut down between requests)
- Local files are not persisted between function invocations
- Each function invocation starts with a fresh filesystem

**Solution:**
You must configure a cloud database for production. The CI/CD pipeline now validates this automatically.

1. **Choose a cloud database provider:**
   - [Neon](https://neon.tech/) (Postgres) - **Recommended**, free tier available
   - [Supabase](https://supabase.com/) (Postgres) - Free tier available
   - [Turso](https://turso.tech/) (SQLite-compatible) - Edge-ready, free tier available
   - [PlanetScale](https://planetscale.com/) (MySQL) - Paid plans only

2. **Create a database** and get your connection string

3. **Update Prisma schema** if changing database providers:
   ```prisma
   // For Postgres (Neon, Supabase)
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   // For MySQL (PlanetScale)
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Configure environment variable in Azure:**
   - Go to Azure Portal → App Service → Configuration → Application settings
   - Add `DATABASE_URL` with your cloud database connection string
   - Redeploy the application

5. **Run migrations** on your production database:
   > **Note:** With the latest pipeline configuration, migrations are automatically applied during Azure deployments. However, you can also run them manually using `.\infra\scripts\migrate-db.ps1 dev`:
   ```bash
   # For production deployments (applies migration files)
   DATABASE_URL="your-prod-url" npx prisma migrate deploy
   # For local development (creates and applies migrations interactively)
   npx prisma migrate dev
   ```

### "Unauthorized: could not retrieve project" Error

This error occurs when the Azure deployment fails due to authentication issues. Common causes and solutions:

1. **Missing GitHub Secrets**
   - Ensure `AZURE_CREDENTIALS` and `AZURE_SUBSCRIPTION_ID` are set in your GitHub repository secrets
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add/verify the secrets are present

2. **Invalid or Expired Token**
   - Azure service principal credentials can expire or be revoked
   - Regenerate credentials: Run `.\infra\scripts\setup-azure.ps1 <subscription-id>`
   - Update the `AZURE_CREDENTIALS` secret in GitHub

3. **Incorrect Site ID**
   - Verify the subscription ID and resource group names match your Azure setup
   - Check: Azure Portal → Subscriptions
   - Update the `AZURE_SUBSCRIPTION_ID` and resource group secrets if incorrect

4. **Token Lacks Site Access**
   - The service principal must have Contributor role on the subscription
   - Ensure the token owner is a team member with deploy permissions

### Verifying Secrets Are Set

The CI/CD pipeline includes a validation step that checks if secrets are configured before attempting deployment. If secrets are missing, the workflow will fail early with a clear error message explaining which secret is missing and how to obtain it.

## Future Improvements

Potential enhancements for the pipeline:

1. **Unit Tests**: Add Jest/Vitest for component testing
2. **E2E Tests**: Playwright/Cypress for end-to-end testing
3. **Visual Regression**: Percy or Chromatic for UI testing
4. **Performance Monitoring**: Lighthouse CI for performance budgets
5. **Security Scanning**: Dependabot or Snyk for dependency vulnerabilities
6. **Load Testing**: Artillery or k6 for performance testing
7. **Smoke Tests**: API endpoint validation after deployment
