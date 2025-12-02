# Setup Guide

This guide covers everything you need to get the Twines and Straps SA platform running locally and deployed to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Deployment to Netlify](#deployment-to-netlify)
- [AI Image Generation (Optional)](#ai-image-generation-optional)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** v18 or later
- **npm** (comes with Node.js)
- A **PostgreSQL database** (Neon or Supabase recommended for cloud hosting)

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/JustAGhosT/twinesandstraps.git
cd twinesandstraps

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and configure the required variables (see [Environment Variables](#environment-variables) below).

### 3. Set Up Database

```bash
# Run database migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

---

## Database Configuration

This project uses **PostgreSQL** by default. You have two options:

### Option A: Cloud Database (Recommended)

Use a cloud PostgreSQL provider for a database that works both locally and in production.

**Neon** (Recommended)
1. Sign up at [neon.tech](https://neon.tech/) (free tier available)
2. Create a new project
3. Copy your connection string from the dashboard

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

**Supabase**
1. Sign up at [supabase.com](https://supabase.com/) (free tier available)
2. Create a new project
3. Go to Settings → Database → Connection string

```env
DATABASE_URL="postgresql://user:password@host.supabase.co:5432/postgres"
```

### Option B: Local PostgreSQL

For local-only development, install PostgreSQL on your machine:

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

Create a database and set your connection string:

```env
DATABASE_URL="postgresql://localhost:5432/twinesandstraps"
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp Business number for quotes | `27821234567` |

### Required for Production (Image Uploads)

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_STORAGE_ACCOUNT_NAME` | Azure Storage account name | `twinesandstrapsstorage` |
| `AZURE_STORAGE_ACCOUNT_KEY` | Azure Storage account access key | (from Azure Portal) |
| `AZURE_STORAGE_CONTAINER_NAME` | Azure Blob Storage container name | `images` |

> ⚠️ **Important**: Image uploads will fail with a 503 error in production if Azure Blob Storage is not configured. See [Azure Blob Storage Setup](#azure-blob-storage-required-for-production) below.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Admin panel password (min 8 characters) | Shows warning if not set |
| `AZURE_AI_ENDPOINT` | Azure AI Foundry endpoint for image generation | — |
| `AZURE_AI_API_KEY` | Azure AI Foundry API key | — |
| `AZURE_AI_DEPLOYMENT_NAME` | DALL-E model deployment name | — |

### Feature Flags

See [Feature Flags](./FEATURE_FLAGS.md) for a complete list of toggleable features.

---

## Deployment to Netlify

### 1. Connect Repository

1. Log in to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository

### 2. Configure Build Settings

The `netlify.toml` file automatically configures:
- **Build command:** `npm run lint && npm run build`
- **Publish directory:** `.next`
- **Node.js version:** 18
- **Security headers** (X-Frame-Options, CSP, etc.)

### 3. Set Environment Variables

In Netlify dashboard: **Site settings → Build & deploy → Environment variables**

Add:
- `DATABASE_URL` — Your cloud database connection string
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — Your WhatsApp Business number
- `ADMIN_PASSWORD` — Secure password for admin access

### 4. Deploy

Push to your connected branch, and Netlify will automatically:
1. Run linting and build
2. Apply database migrations
3. Deploy to the CDN

### GitHub Actions CI/CD

The repository includes automated workflows:

- **CI Workflow** (`ci.yml`) — Runs on every push/PR:
  - Lint check
  - Type check
  - Build verification
  - Config validation

- **Deployment Health Check** (`deployment-health.yml`) — After deployment:
  - Verifies site accessibility
  - Checks for errors
  - Validates HTTP responses

---

## Azure Blob Storage (Required for Production)

Azure Blob Storage is **required** for image uploads in production. Without it, the admin panel will return a 503 error when trying to upload product images.

### Setup Steps

1. **Go to [Azure Portal](https://portal.azure.com/)**

2. **Create a Storage Account:**
   - Search for "Storage accounts" in the portal
   - Click "Create"
   - Select your subscription and resource group
   - Enter a unique storage account name (lowercase letters and numbers only)
   - Choose a region close to your users (e.g., South Africa North for SA customers)
   - Click "Review + create"

3. **Get Your Credentials:**
   - Go to your storage account
   - Under "Security + networking", click "Access keys"
   - Copy **Storage account name** → `AZURE_STORAGE_ACCOUNT_NAME`
   - Copy **key1** (or key2) → `AZURE_STORAGE_ACCOUNT_KEY`

4. **Create a Container:**
   - In your storage account, go to "Data storage" → "Containers"
   - Click "+ Container"
   - Name it `images` (or your preferred name)
   - Set "Public access level" to **Blob** (for public image access)
   - Copy container name → `AZURE_STORAGE_CONTAINER_NAME`

5. **Add to Netlify:**
   - Go to Netlify: **Site settings → Environment variables**
   - Add all three variables:
     - `AZURE_STORAGE_ACCOUNT_NAME`
     - `AZURE_STORAGE_ACCOUNT_KEY`
     - `AZURE_STORAGE_CONTAINER_NAME`

6. **Redeploy your site** to pick up the new environment variables.

### Verify Configuration

After deployment, you can check if Azure Blob Storage is properly configured:

1. Log in to the admin panel
2. Go to Admin Settings → Storage Status
3. You should see "Azure Blob Storage is configured and ready"

---

## AI Image Generation (Optional)

Products can have AI-generated images created during database seeding.

### Setup Azure AI Foundry

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create an Azure AI Foundry resource
3. Go to "Keys and Endpoint" and copy:
   - **KEY 1** → `AZURE_AI_API_KEY`
   - **Endpoint** → `AZURE_AI_ENDPOINT`
4. Deploy the DALL-E 3 model and copy the deployment name → `AZURE_AI_DEPLOYMENT_NAME`

### Generate Images

```bash
# Seed database with AI-generated images
npm run seed
```

If Azure AI credentials are not configured, the seed script uses placeholder images from Unsplash.

For detailed setup: [Azure AI Foundry Quickstart](https://learn.microsoft.com/en-us/azure/ai-services/openai/quickstart)

---

## Troubleshooting

### "503 Service Unavailable" on Image Upload

This error occurs when Azure Blob Storage is not configured in production.

**Error message in browser console:**
```
POST https://yoursite.netlify.app/api/admin/upload 503 (Service Unavailable)
```

**Solution:**
1. Configure Azure Blob Storage environment variables in Netlify. See [Azure Blob Storage Setup](#azure-blob-storage-required-for-production).
2. Ensure all three variables are set:
   - `AZURE_STORAGE_ACCOUNT_NAME`
   - `AZURE_STORAGE_ACCOUNT_KEY`
   - `AZURE_STORAGE_CONTAINER_NAME`
3. Redeploy your site after adding the variables.

**Why this happens:** In development, images are stored as base64 data URLs. In production, this is disabled because base64 images can be very large and cause performance issues. Azure Blob Storage is required for production deployments.

### "Cannot connect to database"

```bash
# Verify your DATABASE_URL is correct
npx prisma db push

# For local PostgreSQL, ensure the service is running
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux
```

### "Unable to open the database file" (Error 14)

This error occurs when trying to use SQLite in a serverless environment. **Solution:** Use a cloud PostgreSQL database (Neon or Supabase).

### "Admin login not working"

Ensure `ADMIN_PASSWORD` is set in your `.env` file:

```env
ADMIN_PASSWORD=your_secure_password_here
```

### "Products not showing"

```bash
# Seed the database with sample data
npm run seed
```

### "Styles look broken"

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Build Fails on Netlify

1. Check that `DATABASE_URL` is set in Netlify environment variables
2. Verify the database is accessible from Netlify's build servers
3. Check build logs for specific error messages

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database with sample data |
| `npx prisma studio` | Open database GUI |
| `npx prisma migrate dev` | Run migrations (development) |
| `npx prisma migrate deploy` | Run migrations (production) |

---

## Next Steps

- [Feature Flags](./FEATURE_FLAGS.md) — Toggle features without code changes
- [API Documentation](./API.md) — REST API reference
- [Deployment Pipeline](./DEPLOYMENT_PIPELINE.md) — CI/CD details
