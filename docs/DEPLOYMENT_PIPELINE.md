# Deployment Pipeline Documentation

## Overview

This document describes the CI/CD pipeline and deployment configuration for the Twines and Straps e-commerce platform.

## Pipeline Components

### 1. GitHub Actions CI/CD

#### Continuous Integration (`.github/workflows/ci.yml`)

Runs on every push to `main` or `develop` branches and on pull requests.

**Jobs:**
- **Lint Check**: Validates code style and catches potential issues with ESLint
- **Type Check**: Ensures TypeScript type safety across the codebase
- **Build Test**: Verifies the application builds successfully
- **Config Validation**: Validates configuration file syntax

**Benefits:**
- Catches errors before deployment
- Ensures code quality standards
- Validates that changes don't break the build
- Provides fast feedback to developers

#### Deployment Health Check (`.github/workflows/deployment-health.yml`)

Runs automatically after Netlify deployment completes.

**Checks:**
- Deployment URL accessibility
- HTTP response code validation
- Basic error detection
- Application startup verification

**Benefits:**
- Early detection of deployment issues
- Automatic rollback triggers (can be configured)
- Deployment confidence

### 2. Netlify Configuration

The `netlify.toml` file configures:

#### Build Configuration
- **Command**: `npm run lint && npm run build`
  - Runs linting before build to catch issues early
  - Generates Prisma client
  - Builds Next.js application
- **Publish Directory**: `.next` (Next.js build output)
- **Plugin**: `@netlify/plugin-nextjs` for optimal Next.js support
- **Node Version**: 18 (LTS)

#### Context-Specific Builds

Different build commands for different deployment contexts:

- **Production**: Full lint + build
- **Deploy Preview**: Full lint + build (for PR previews)
- **Branch Deploy**: Build only (faster for feature branches)

#### Security Headers

Automatically applied to all responses:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features (camera, microphone, geolocation)

#### Performance Optimization

- **Static Asset Caching**: `/_next/static/*` assets cached for 1 year (immutable)
- **Automatic compression**: Netlify handles gzip/brotli compression
- **CDN distribution**: Global CDN for fast access worldwide

#### Redirect Rules

- **www to non-www**: Canonical URL enforcement for SEO

## Testing in the Pipeline

### Pre-Deployment Tests

1. **Linting** (`npm run lint`)
   - ESLint checks for code quality
   - Runs in both GitHub Actions and Netlify

2. **Type Checking** (GitHub Actions)
   - TypeScript compiler validation
   - Catches type errors before deployment

3. **Build Verification**
   - Ensures application compiles successfully
   - Tests Prisma client generation
   - Validates environment setup

### Post-Deployment Tests

1. **Health Check**
   - Verifies deployment URL responds
   - Checks for error pages
   - Validates HTTP status codes

## Environment Variables

### Required Environment Variables

Configure these in your Netlify dashboard (Site settings → Build & deploy → Environment variables):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (from Neon or Supabase) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | WhatsApp Business number for quote requests |

### Optional Environment Variables (AI Image Generation)

| Variable | Description |
|----------|-------------|
| `AZURE_AI_ENDPOINT` | Azure AI Foundry endpoint URL |
| `AZURE_AI_API_KEY` | Azure AI Foundry API key |
| `AZURE_AI_DEPLOYMENT_NAME` | Model deployment name (e.g., dall-e-3) |

### GitHub Actions Secrets

Configure these as GitHub repository secrets (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `NETLIFY_SITE_ID` | Your Netlify site ID (from Site Settings → General → Site ID) |
| `NETLIFY_AUTH_TOKEN` | Personal access token (from User Settings → Applications → Personal access tokens) |

### How to Obtain Credentials

**Database Connection String (PostgreSQL):**

The project uses PostgreSQL by default. Choose one of these providers:

1. **Neon** (Recommended) - https://neon.tech/
   - Sign up for a free account
   - Create a new project
   - Copy the connection string (format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

2. **Supabase** - https://supabase.com/
   - Sign up for a free account
   - Create a new project
   - Go to Settings → Database → Connection string
   - Copy the URI (format: `postgresql://user:password@host.supabase.co:5432/postgres`)

**WhatsApp Business Number:**
- Format: Country code + number (e.g., 27821234567 for South Africa)
- No spaces or + symbol

**Azure AI Foundry (Optional):**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure AI Foundry or visit [ai.azure.com](https://ai.azure.com/)
3. Create a new resource with your subscription
4. Find credentials in "Keys and Endpoint" section
5. Deploy DALL-E 3 model for image generation

**Netlify Credentials:**
1. Log in to [Netlify](https://app.netlify.com/)
2. Site ID: Site dashboard → Site Settings → General → Site ID
3. Deploy Token: User Settings → Applications → Personal access tokens → New access token

## Rendering Strategy

The application uses **dynamic rendering** for database-driven pages to ensure compatibility with Netlify's serverless architecture:

- **Home page** (`/`): Dynamic rendering - fetches featured products and categories at request time
- **Products page** (`/products`): Dynamic rendering - fetches all products at request time  
- **Product detail page** (`/products/[id]`): Dynamic rendering - fetches specific product at request time

This approach:
- Eliminates build-time database requirements
- Ensures fresh data on every request
- Works seamlessly with Netlify's serverless functions
- Avoids static generation errors when database is unavailable during build

Pages are marked with `export const dynamic = 'force-dynamic'` to explicitly enable server-side rendering on demand.

## Deployment Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions CI runs (lint, type-check, build)
   ↓
3. If CI passes, Netlify detects changes
   ↓
4. Netlify runs build command (with lint)
   ↓
5. Netlify deploys to CDN
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
- Netlify provides deployment notifications
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
SQLite file-based databases (`file:./dev.db`) do not work in serverless environments like Netlify because:
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

4. **Configure environment variable in Netlify:**
   - Go to Netlify dashboard → Site Settings → Environment variables
   - Add `DATABASE_URL` with your cloud database connection string
   - Redeploy the application

5. **Run migrations** on your production database:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate deploy
   ```

### "Unauthorized: could not retrieve project" Error

This error occurs when the Netlify deployment fails due to authentication issues. Common causes and solutions:

1. **Missing GitHub Secrets**
   - Ensure both `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are set in your GitHub repository secrets
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add/verify the secrets are present

2. **Invalid or Expired Token**
   - Netlify personal access tokens can expire or be revoked
   - Generate a new token: Netlify → User Settings → Applications → Personal access tokens
   - Update the `NETLIFY_AUTH_TOKEN` secret in GitHub

3. **Incorrect Site ID**
   - Verify the Site ID matches your Netlify site
   - Find it: Netlify dashboard → Site Settings → General → Site ID
   - Update the `NETLIFY_SITE_ID` secret if incorrect

4. **Token Lacks Site Access**
   - The token must belong to a user with access to the Netlify site
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
