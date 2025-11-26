# Twines and Straps SA E-Commerce Platform

This repository contains the source code for the Twines and Straps SA e-commerce platform, a combined B2C/B2B solution built with Next.js, TypeScript, and Tailwind CSS.

## Deployment URLs

| Environment | URL |
|-------------|-----|
| Production | [https://twinesandstraps.netlify.app](https://twinesandstraps.netlify.app) |

## Project Overview

The goal of this project is to create a modern, reliable, and user-friendly online storefront for both retail and business customers. The platform will feature direct online sales, a streamlined request-for-quote (RFQ) flow for B2B buyers, and a powerful admin portal for non-technical staff to manage products and content.

For full details, please see the [Product Requirements Document](./docs/PRD.md).

## Features

### AI-Generated Product Images (Optional)

Products can have AI-generated images automatically created during the database seeding process using Azure AI Foundry's DALL-E model. This feature:

- Automatically generates professional product photos during `npm run seed`
- Creates contextually appropriate images based on product name, description, material, and category
- Saves generated image URLs to the database
- Requires Azure AI Foundry credentials (configured via environment variables)

To generate images for products:
1. Set up Azure AI Foundry credentials (see [Environment Variables](#environment-variables) section below)
2. Run `npm run seed` to create products with AI-generated images

**Note:** If Azure AI credentials are not configured, the seed script will use placeholder images from Unsplash.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd twines-and-straps
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

To start the development server, run the following command:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Netlify Deployment

This project is configured for deployment on Netlify with the following setup:

#### Prerequisites

1. A Netlify account
2. The repository connected to Netlify
3. **A PostgreSQL database** from Neon (recommended) or Supabase

> ℹ️ **Database Configuration**
> 
> This project uses **PostgreSQL** by default, which is compatible with [Neon](https://neon.tech/) and [Supabase](https://supabase.com/) (both offer free tiers).
> 
> You must configure a cloud database before deploying to production.

#### Environment Variables

The following environment variables must be configured in your Netlify dashboard (Site settings → Build & deploy → Environment variables):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string from Neon or Supabase |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | WhatsApp Business number for quote requests (format: 27XXXXXXXXX) |
| `AZURE_AI_ENDPOINT` | No | Azure AI Foundry endpoint URL |
| `AZURE_AI_API_KEY` | No | Azure AI Foundry API key |
| `AZURE_AI_DEPLOYMENT_NAME` | No | Azure AI model deployment name (e.g., dall-e-3) |

##### How to Get Your Keys and Secrets

**Database (Required)**

The project uses PostgreSQL. Follow these steps to set up your database:

1. Sign up for a PostgreSQL provider:
   - [Neon](https://neon.tech/) - **Recommended** - Free tier, serverless Postgres
   - [Supabase](https://supabase.com/) - Free tier, Postgres with extras
   - [Turso](https://turso.tech/) - Edge SQLite (requires schema change)
2. Create a new database/project
3. Copy the connection string from the dashboard
4. Add the `DATABASE_URL` to Netlify environment variables
5. Database migrations are automatically applied during the Netlify build process via `prisma migrate deploy`
   > **Note:** The build command runs `prisma generate && prisma migrate deploy && next build`, which ensures pending migrations are applied to the production database before each deployment.

Example connection strings:
```
# Neon (Postgres) - Recommended
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Supabase (Postgres)
DATABASE_URL="postgresql://user:password@host.supabase.co:5432/postgres"

# Turso (requires changing prisma/schema.prisma provider to "sqlite")
DATABASE_URL="libsql://your-db.turso.io?authToken=your-token"
```

**WhatsApp Business (Required)**
1. Download WhatsApp Business from your app store
2. Register with your business phone number
3. Use format: country code + number (e.g., 27821234567 for South Africa)

**Azure AI Foundry (Optional - for AI-generated images)**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for "Azure AI Foundry" or visit [ai.azure.com](https://ai.azure.com/)
3. Create a new resource:
   - Select your subscription
   - Create or select a resource group
   - Choose a region (e.g., East US, West Europe)
4. Go to "Keys and Endpoint" in your resource:
   - Copy "KEY 1" for `AZURE_AI_API_KEY`
   - Copy "Endpoint" for `AZURE_AI_ENDPOINT`
5. Deploy DALL-E 3 model and copy deployment name for `AZURE_AI_DEPLOYMENT_NAME`

For detailed Azure AI setup, see: [Azure AI Foundry Quickstart](https://learn.microsoft.com/en-us/azure/ai-services/openai/quickstart)

#### Deployment Configuration

The project includes a `netlify.toml` file that configures:
- **Build command**: `npm run lint && npm run build` (includes linting in CI/CD)
- **Publish directory**: `.next`
- **Next.js runtime plugin**: `@netlify/plugin-nextjs`
- **Node.js version**: 18
- **Security headers**: X-Frame-Options, X-Content-Type-Options, CSP, etc.
- **Context-specific builds**: Different commands for production, preview, and branch deployments
- **Static asset caching**: Optimized cache headers for `/_next/static/*` assets
- **Redirect rules**: www to non-www redirects

#### CI/CD Pipeline

The repository includes GitHub Actions workflows for continuous integration:

**Continuous Integration Workflow** (`.github/workflows/ci.yml`):
- **Lint Check**: Runs ESLint on all code
- **Type Check**: Validates TypeScript types
- **Build Test**: Ensures the application builds successfully
- **Config Validation**: Validates `netlify.toml` and `package.json` syntax

**Deployment Health Check** (`.github/workflows/deployment-health.yml`):
- Automatically runs after Netlify deployment completes
- Verifies deployment URL is accessible
- Checks for common deployment errors
- Validates HTTP response codes

These workflows run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- After Netlify deployment completion

#### Rendering Strategy

The application uses **dynamic rendering** for database-driven pages:
- Pages fetch data at request time (not at build time)
- Compatible with Netlify's serverless architecture
- Ensures fresh data on every request
- No database required during the build process

This allows the build to succeed without a populated database, while still providing dynamic, database-driven content at runtime.

#### Manual Deployment Steps

1. Push your code to the connected Git repository
2. Netlify will automatically detect changes and trigger a build
3. Set the required environment variables in Netlify dashboard
4. The site will be deployed automatically

For more information on Netlify deployments, visit [Netlify Documentation](https://docs.netlify.com/).
