# Azure Deployment Guide

This guide covers deploying the Twines and Straps SA platform to Microsoft Azure.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Infrastructure Deployment](#infrastructure-deployment)
- [Application Deployment](#application-deployment)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Azure deployment uses the following services:

| Service                           | Purpose                          |
| --------------------------------- | -------------------------------- |
| **Azure App Service**             | Hosts the Next.js application    |
| **Azure Database for PostgreSQL** | Managed PostgreSQL database      |
| **Azure Blob Storage**            | Product images and static assets |
| **Azure Key Vault**               | Secrets management               |
| **Azure Application Insights**    | Monitoring and telemetry         |

### Environments

The infrastructure supports three environments:

| Environment | Purpose                   | App Service Plan |
| ----------- | ------------------------- | ---------------- |
| `dev`       | Development and testing   | Basic (B1)       |
| `staging`   | Pre-production validation | Basic (B1)       |
| `prod`      | Production                | Premium (P1v3)   |

---

## Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │          Azure Resource Group       │
                                    │      ({env}-rg-san-tassa)           │
                                    └─────────────────────────────────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
          ┌─────────┴─────────┐             ┌────────┴────────┐            ┌───────────┴───────────┐
          │   App Service     │             │   PostgreSQL    │            │   Storage Account     │
          │   (Next.js)       │◄────────────│   Flexible      │            │   (Blob Storage)      │
          │                   │   DB Conn   │   Server        │            │                       │
          └─────────┬─────────┘             └─────────────────┘            └───────────────────────┘
                    │                                                                 ▲
                    │                                                                 │
          ┌─────────┴─────────┐                                                      │
          │   Application     │                                                      │
          │   Insights        │                                          Image Uploads
          │   (Monitoring)    │                                                      │
          └───────────────────┘                                                      │
                                                                                     │
                    ┌───────────────────────────────────────────────────────────────┘
                    │
          ┌─────────┴─────────┐
          │    Key Vault      │
          │    (Secrets)      │
          └───────────────────┘
```

---

## Prerequisites

1. **Azure Subscription** with Contributor access
2. **Azure CLI** installed ([Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
3. **GitHub CLI** (optional, for automated secret configuration)
4. **Node.js 18+** and npm

### Verify Prerequisites

```bash
# Check Azure CLI
az --version

# Login to Azure
az login

# Verify subscription
az account show
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JustAGhosT/twinesandstraps.git
cd twinesandstraps
```

### 2. Run Azure Setup Script

The setup script creates a service principal for GitHub Actions and configures secrets:

```bash
# Make scripts executable
chmod +x infra/scripts/*.sh

# Run setup (replace with your subscription ID)
./infra/scripts/setup-azure.sh <your-subscription-id>
```

This script will:
- Create a service principal for GitHub Actions
- Assign Contributor role to the service principal
- Optionally configure GitHub repository secrets

### 3. Configure GitHub Secrets

If not using the setup script, manually add these secrets in GitHub:

**Settings → Secrets and variables → Actions**

| Secret                    | Description                          |
| ------------------------- | ------------------------------------ |
| `AZURE_CREDENTIALS`       | Service principal credentials (JSON) |
| `AZURE_SUBSCRIPTION_ID`   | Your Azure subscription ID           |
| `POSTGRES_ADMIN_LOGIN`    | PostgreSQL admin username            |
| `POSTGRES_ADMIN_PASSWORD` | PostgreSQL admin password (strong!)  |
| `ADMIN_PASSWORD`          | Application admin password           |
| `DATABASE_URL`            | (Optional) Override database URL     |

---

## Infrastructure Deployment

### Option 1: GitHub Actions (Recommended)

1. Go to **Actions** → **Azure Infrastructure**
2. Click **Run workflow**
3. Select environment (`dev`, `staging`, or `prod`)
4. Optionally specify Azure region (default: `southafricanorth`)
5. Click **Run workflow**

The workflow will:
1. Validate Bicep templates
2. Run what-if analysis to preview changes
3. Deploy infrastructure
4. Run database migrations

### Option 2: Manual Deployment

```bash
# Navigate to scripts directory
cd infra/scripts

# Deploy infrastructure
./deploy-infra.sh dev

# For staging or production
./deploy-infra.sh staging
./deploy-infra.sh prod southafricanorth
```

### Infrastructure Resources Created

| Resource             | Name Pattern           |
| -------------------- | ---------------------- |
| Resource Group       | `{env}-rg-san-tassa`   |
| App Service Plan     | `{env}-asp-san-tassa`  |
| Web App              | `{env}-app-san-tassa`  |
| PostgreSQL Server    | `{env}-psql-san-tassa` |
| Storage Account      | `{env}stsan-tassa`     |
| Key Vault            | `{env}-kv-san-tassa`   |
| Application Insights | `{env}-ai-san-tassa`   |

---

## Application Deployment

### Option 1: GitHub Actions (Recommended)

Push to `main` branch or:

1. Go to **Actions** → **Deploy to Azure**
2. Click **Run workflow**
3. Select environment
4. Click **Run workflow**

The workflow will:
1. Run lint and type checks
2. Run tests
3. Build the Next.js application
4. Deploy to Azure App Service
5. Run database migrations
6. Perform health checks

### Option 2: Manual Deployment

```bash
# Navigate to scripts directory
cd infra/scripts

# Run migrations first
./migrate-db.sh dev

# Deploy application
./deploy-app.sh dev

# With database seeding
./migrate-db.sh dev --seed
```

---

## CI/CD with GitHub Actions

### Workflows

| Workflow                 | File                     | Trigger                    | Purpose                       |
| ------------------------ | ------------------------ | -------------------------- | ----------------------------- |
| **Azure Infrastructure** | `azure-infra.yml`        | Manual, `infra/**` changes | Deploy/update Azure resources |
| **Deploy to Azure**      | `azure-deploy.yml`       | Push to main, Manual       | Deploy application            |
| **Azure Health Check**   | `azure-health-check.yml` | Every 15 min, Manual       | Monitor environments          |

### Deployment Flow

```
Push to main
    │
    ▼
┌─────────────────┐
│  Lint & Test    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build App      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to Dev  │
└────────┬────────┘
         │ (manual trigger for staging/prod)
         ▼
┌─────────────────┐
│ Deploy Staging  │
└────────┬────────┘
         │ (with approval)
         ▼
┌─────────────────┐
│  Deploy Prod    │◄── Uses slot swap for zero-downtime
└─────────────────┘
```

### Environment Protection

For production, consider enabling:
- **Required reviewers** for the `prod` environment
- **Wait timer** before deployment
- **Deployment branches** restriction

Configure in: **Settings → Environments → prod → Protection rules**

---

## Monitoring

### Application Insights

Access monitoring data in the Azure Portal:

1. Go to your resource group
2. Click on the Application Insights resource
3. View dashboards for:
   - Request rates and failures
   - Response times
   - Exceptions
   - Dependencies

### Health Endpoint

The application exposes a health endpoint:

```bash
curl https://app-twinesandstraps-dev.azurewebsites.net/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "ok",
      "latency": 15
    },
    "storage": {
      "status": "ok"
    }
  }
}
```

### Automated Health Checks

The `azure-health-check.yml` workflow runs every 15 minutes to verify:
- Homepage accessibility
- Health endpoint status
- API endpoint responses

---

## Troubleshooting

### Common Issues

#### "Could not connect to database"

1. Check if the PostgreSQL server firewall allows Azure services
2. Verify the DATABASE_URL in App Service configuration
3. Ensure the database exists and migrations have run

```bash
# Check database connectivity
az postgres flexible-server connect \
  --name psql-twinesandstraps-dev \
  --admin-user YOUR_ADMIN \
  --admin-password YOUR_PASSWORD
```

#### "503 Service Unavailable"

1. Check if the App Service is running
2. Review Application Insights for exceptions
3. Check the deployment logs

```bash
# View logs
az webapp log tail \
  --name dev-app-san-tassa \
  --resource-group dev-rg-san-tassa
```

#### "Image uploads failing"

1. Verify Azure Storage credentials in App Service settings
2. Check the storage container exists and has correct permissions
3. Ensure the container is set to "Blob" public access level

#### Build fails with "Font download error"

This is expected in CI environments without internet access. The application uses fallback fonts when Google Fonts are unavailable.

### Viewing Logs

```bash
# Application logs
az webapp log tail \
  --name dev-app-san-tassa \
  --resource-group dev-rg-san-tassa

# Deployment logs
az webapp log download \
  --name dev-app-san-tassa \
  --resource-group dev-rg-san-tassa \
  --log-file deployment.zip
```

### Restarting the App

```bash
az webapp restart \
  --name dev-app-san-tassa \
  --resource-group dev-rg-san-tassa
```

### Scaling

```bash
# Scale up (change SKU)
az appservice plan update \
  --name dev-asp-san-tassa \
  --resource-group dev-rg-san-tassa \
  --sku P1V3

# Scale out (add instances)
az webapp update \
  --name dev-app-san-tassa \
  --resource-group dev-rg-san-tassa \
  --set siteConfig.numberOfWorkers=3
```

---

## Cost Optimization

### Development Environment

- Use Basic (B1) App Service Plan
- Use Burstable PostgreSQL (Standard_B1ms)
- Disable auto-scaling

### Production Environment

- Use Premium (P1v3) for better performance
- Enable auto-scaling based on CPU usage
- Consider reserved instances for 1-3 year commitments
- Enable geo-redundant backups for PostgreSQL

### Estimated Monthly Costs (South Africa North)

| Resource             | Dev      | Prod      |
| -------------------- | -------- | --------- |
| App Service          | ~$13     | ~$70      |
| PostgreSQL           | ~$15     | ~$60      |
| Storage (10GB)       | ~$0.20   | ~$0.20    |
| Application Insights | ~$2      | ~$5       |
| **Total**            | **~$30** | **~$135** |

*Costs are approximate and may vary. Use the [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) for accurate estimates.*

---

## Next Steps

1. [Configure custom domain](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain)
2. [Enable SSL/TLS certificate](https://docs.microsoft.com/en-us/azure/app-service/configure-ssl-bindings)
3. [Set up Azure CDN](https://docs.microsoft.com/en-us/azure/cdn/cdn-create-new-endpoint) for static assets
4. [Configure backup and restore](https://docs.microsoft.com/en-us/azure/app-service/manage-backup)

---

## Related Documentation

- [Setup Guide](./SETUP.md) — Local development setup
- [Deployment Pipeline](./DEPLOYMENT_PIPELINE.md) — CI/CD overview
- [Feature Flags](./FEATURE_FLAGS.md) — Toggle features without code changes
