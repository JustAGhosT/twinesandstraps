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
| `DATABASE_URL`            | PostgreSQL connection string (required for migrations) |

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

#### "P1000: Authentication failed against database server"

This error occurs when the `DATABASE_URL` secret contains invalid credentials. The error message will include the username that failed to authenticate (e.g., `credentials for 'Martyn' are not valid`).

**Causes:**
1. Incorrect username or password in the `DATABASE_URL` secret
2. The database user doesn't exist
3. The password was changed in Azure PostgreSQL but not updated in GitHub secrets

**Solution:**

1. **Get the correct credentials** from Azure PostgreSQL:
   ```bash
   # View the PostgreSQL server admin login
   az postgres flexible-server show \
     --name dev-psql-san-tassa \
     --resource-group dev-rg-san-tassa \
     --query administratorLogin
   ```

2. **Update the GitHub secret**:
   - Go to **Settings → Secrets and variables → Actions → Environments**
   - Select the environment (dev, staging, or prod)
   - Update `DATABASE_URL` with the correct credentials
   - Format: `postgresql://USERNAME:PASSWORD@dev-psql-san-tassa.postgres.database.azure.com:5432/postgres?sslmode=require`

3. **Re-run the deployment** workflow

**Note:** If you've forgotten the admin password, you can reset it:
```bash
az postgres flexible-server update \
  --name dev-psql-san-tassa \
  --resource-group dev-rg-san-tassa \
  --admin-password "NewSecurePassword123!"
```

#### "403 Forbidden" - Deployment Failed

This error occurs when the GitHub Actions workflow cannot deploy to Azure App Service due to permission issues.

**Error Message:**
```
Error: Failed to deploy web package to App Service.
Error: Deployment Failed, Error: Failed to deploy web package using OneDeploy to App Service.
Forbidden (CODE: 403)
```

**Common Causes:**

1. **Service Principal Permissions**
   - The service principal used by GitHub Actions lacks necessary permissions
   - Missing `Contributor` or `Website Contributor` role on the resource group or App Service

2. **Invalid or Expired AZURE_CREDENTIALS**
   - The `AZURE_CREDENTIALS` secret is malformed, expired, or invalid
   - Service principal credentials have been rotated but not updated in GitHub

3. **App Service Deployment Restrictions**
   - Deployment is disabled in App Service settings
   - SCM (Kudu) site is stopped
   - IP restrictions blocking GitHub Actions IPs

4. **Resource Group Access**
   - Service principal doesn't have access to the subscription or resource group
   - Subscription-level permissions are missing

**Solutions:**

1. **Verify Service Principal Permissions:**
   ```bash
   # Get your subscription ID
   SUBSCRIPTION_ID=$(az account show --query id -o tsv)
   
   # Check role assignments on resource group
   az role assignment list \
     --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/dev-rg-san-tassa" \
     --query "[?principalType=='ServicePrincipal']" \
     -o table
   ```

2. **Assign Required Permissions:**
   ```bash
   # Get service principal object ID from AZURE_CREDENTIALS secret
   # (The clientId in the JSON)
   
   # Assign Contributor role to resource group
   az role assignment create \
     --role "Contributor" \
     --assignee <service-principal-client-id> \
     --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/dev-rg-san-tassa"
   ```

   Or via Azure Portal:
   - Go to **Resource Groups** → `dev-rg-san-tassa` (or your environment)
   - Click **Access control (IAM)**
   - Click **Add** → **Add role assignment**
   - Select **Contributor** or **Website Contributor**
   - Search for your service principal name and assign

3. **Regenerate Service Principal (if credentials are invalid):**
   ```bash
   # Create new service principal
   az ad sp create-for-rbac \
     --name "github-actions-twinesandstraps" \
     --role contributor \
     --scopes "/subscriptions/$SUBSCRIPTION_ID" \
     --sdk-auth
   ```
   
   Copy the JSON output and update the `AZURE_CREDENTIALS` secret in GitHub:
   - Go to **Settings → Secrets and variables → Actions**
   - Update `AZURE_CREDENTIALS` with the new JSON

4. **Check App Service Deployment Settings:**
   ```bash
   # Verify deployment is enabled
   az webapp config show \
     --name dev-app-san-tassa \
     --resource-group dev-rg-san-tassa \
     --query "scmType"
   
   # Check if SCM site is stopped
   az webapp show \
     --name dev-app-san-tassa \
     --resource-group dev-rg-san-tassa \
     --query "state"
   ```

5. **Verify App Service Access:**
   ```bash
   # Test if you can read App Service configuration
   az webapp config show \
     --name dev-app-san-tassa \
     --resource-group dev-rg-san-tassa
   
   # If this fails, the service principal lacks permissions
   ```

6. **Check IP Restrictions:**
   - Go to **App Service** → **Networking** → **Access restriction**
   - Ensure GitHub Actions IPs are allowed (or allow all Azure services)

**Prevention:**

The deployment workflow now includes automatic verification steps that will:
- Verify Azure authentication before deployment
- Check App Service access and permissions
- Display role assignments for troubleshooting
- Provide detailed error messages with solutions

If the verification steps pass but deployment still fails, check:
- App Service logs: `az webapp log tail --name dev-app-san-tassa --resource-group dev-rg-san-tassa`
- Deployment logs in GitHub Actions workflow run
- Azure Activity Log for permission denials

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

- [Setup Guide](../getting-started/setup.md) — Local development setup
- [Deployment Pipeline](./deployment-pipeline.md) — CI/CD overview
- [Feature Flags](../administration/feature-flags.md) — Toggle features without code changes
