# Twines and Straps SA E-Commerce Platform

This repository contains the source code for the Twines and Straps SA e-commerce platform, a combined B2C/B2B solution built with Next.js, TypeScript, and Tailwind CSS.

## Project Overview

The goal of this project is to create a modern, reliable, and user-friendly online storefront for both retail and business customers. The platform will feature direct online sales, a streamlined request-for-quote (RFQ) flow for B2B buyers, and a powerful admin portal for non-technical staff to manage products and content.

For full details, please see the [Product Requirements Document](./docs/PRD.md).

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

- `DATABASE_URL`: Database connection string for Prisma (e.g., `file:./dev.db` for SQLite)

#### Deployment Configuration

The project includes a `netlify.toml` file that configures:
- Build command: `npm run build`
- Publish directory: `.next`
- Next.js runtime plugin: `@netlify/plugin-nextjs`
- Node.js version: 18

#### Manual Deployment Steps

1. Push your code to the connected Git repository
2. Netlify will automatically detect changes and trigger a build
3. Set the required environment variables in Netlify dashboard
4. The site will be deployed automatically

For more information on Netlify deployments, visit [Netlify Documentation](https://docs.netlify.com/).
