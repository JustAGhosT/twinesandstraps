# Twines and Straps SA E-Commerce Platform

This repository contains the source code for the Twines and Straps SA e-commerce platform, a combined B2C/B2B solution built with Next.js, TypeScript, and Tailwind CSS.

## Project Overview

The goal of this project is to create a modern, reliable, and user-friendly online storefront for both retail and business customers. The platform will feature direct online sales, a streamlined request-for-quote (RFQ) flow for B2B buyers, and a powerful admin portal for non-technical staff to manage products and content.

For full details, please see the [Product Requirements Document](./docs/PRD.md).

## Features

### AI-Generated Product Images

When products don't have images, the platform can automatically generate professional product photos using OpenAI's DALL-E AI model. This feature:

- Appears on product cards and product detail pages when no image is available
- Generates contextually appropriate images based on product name, description, material, and category
- Saves generated images to the database for future use
- Requires an OpenAI API key (configured via `OPENAI_API_KEY` environment variable)

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

#### Environment Variables

The following environment variables must be configured in your Netlify dashboard (Site settings → Build & deploy → Environment variables):

- `DATABASE_URL`: Database connection string for Prisma
- `OPENAI_API_KEY`: (Optional) OpenAI API key for AI-generated product images. Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)

**Important Note on Database:**
- The current implementation uses SQLite, which is **not recommended for production deployments on Netlify** due to the ephemeral nature of serverless environments.
- For production, consider migrating to a cloud-based database service such as:
  - Neon (Postgres)
  - PlanetScale (MySQL)
  - MongoDB Atlas
  - Supabase (Postgres)
  - Turso (SQLite-compatible with global distribution)
- Update the `DATABASE_URL` in Netlify environment variables to point to your chosen database service.

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
