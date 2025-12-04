# Deployments & Ops

## Overview

The application is deployed to Azure App Service using GitHub Actions for CI/CD. Infrastructure is managed as code using Bicep templates.

## Infrastructure Overview

```
Azure Resources (per environment)
├── Resource Group
│   ├── App Service Plan
│   │   └── Web App (App Service)
│   ├── PostgreSQL Flexible Server
│   │   └── Database: twinesandstraps
│   ├── Storage Account
│   │   └── Container: images
│   ├── Key Vault
│   │   └── Secrets
│   └── Application Insights
```

## Environments

| Environment | Purpose | URL Pattern |
|-------------|---------|-------------|
| **dev** | Development/testing | `dev-app-san-tassa.azurewebsites.net` |
| **staging** | Pre-production | `staging-app-san-tassa.azurewebsites.net` |
| **prod** | Production | `prod-app-san-tassa.azurewebsites.net` |

## CI/CD Pipelines

### Workflow Files

```
.github/workflows/
├── ci.yml                  # CI pipeline (lint, test, build)
├── azure-deploy.yml        # Deployment pipeline
├── azure-infra.yml         # Infrastructure provisioning
└── azure-health-check.yml  # Health monitoring
```

### CI Pipeline (`ci.yml`)

**Triggers**: Push/PR to `main`, `develop`

```yaml
jobs:
  lint:           # ESLint checks
  type-check:     # TypeScript compilation
  test:           # Jest tests
  build:          # Next.js build
  validate-config: # Configuration validation
```

### Deployment Pipeline (`azure-deploy.yml`)

**Triggers**: Push to `main`, manual dispatch

```yaml
jobs:
  lint:        # Code quality
  type-check:  # Type safety
  test:        # Test suite
  build:       # Create artifact
  deploy-dev:  # Auto-deploy to dev
  deploy-staging:  # Manual to staging
  deploy-prod:     # Manual to prod
  health-check:    # Post-deploy verification
```

### Deployment Strategy

| Environment | Trigger | Strategy |
|-------------|---------|----------|
| dev | Auto on main push | Direct deploy |
| staging | Manual dispatch | Direct deploy |
| prod | Manual dispatch | Blue/green (slot swap) |

## Build Process

### Build Command

```bash
prisma generate && next build
```

### Standalone Output

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
};
```

### Deployment Package

```bash
deploy-package/
├── .next/
│   └── standalone/    # Server bundle
│   └── static/        # Static assets
├── public/            # Public files
├── prisma/            # Schema & migrations
├── scripts/           # Migration script
└── .deployment        # Azure config
```

## Database Migrations

### Production Migration Script

```javascript
// scripts/migrate-production.js
// Handles:
// 1. Checking migration status
// 2. Baselining existing databases
// 3. Running pending migrations
// 4. Error handling and rollback
```

### Migration Workflow

1. Developer creates migration locally
2. Migration committed to repository
3. CI validates migration
4. Deploy job runs `migrate-production.js`
5. Migration applied before app starts

## Azure Configuration

### App Service Settings

```bash
az webapp config appsettings set \
  --name "dev-app-san-tassa" \
  --resource-group "dev-rg-san-tassa" \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=false \
    ENABLE_ORYX_BUILD=false \
    NODE_ENV=production \
    DATABASE_URL="${{ secrets.DATABASE_URL }}"
```

### Startup Command

```bash
node server.js
```

## Infrastructure as Code

### Bicep Structure

```
infra/bicep/
├── main.bicep              # Main orchestration
└── modules/
    ├── app-insights.bicep  # Monitoring
    ├── app-service-plan.bicep
    ├── key-vault.bicep     # Secrets
    ├── postgres.bicep      # Database
    ├── secrets.bicep       # Secret storage
    ├── storage.bicep       # Blob storage
    └── web-app.bicep       # App Service
```

### Deployment Command

```bash
az deployment group create \
  --resource-group "dev-rg-san-tassa" \
  --template-file infra/bicep/main.bicep \
  --parameters environment=dev \
    postgresAdminLogin=$POSTGRES_ADMIN \
    postgresAdminPassword=$POSTGRES_PASSWORD \
    adminPassword=$ADMIN_PASSWORD
```

### Resource Naming

| Resource | Pattern | Example |
|----------|---------|---------|
| Resource Group | `{env}-rg-san-tassa` | `dev-rg-san-tassa` |
| App Service | `{env}-app-san-tassa` | `dev-app-san-tassa` |
| PostgreSQL | `{env}-psql-san-tassa` | `dev-psql-san-tassa` |
| Storage | `{env}stsantassa` | `devstsantassa` |
| Key Vault | `{env}-kv-san-tassa` | `dev-kv-san-tassa` |
| App Insights | `{env}-ai-san-tassa` | `dev-ai-san-tassa` |

## Scaling Configuration

### App Service Plan

| Environment | SKU | Instances |
|-------------|-----|-----------|
| dev | B1 (Basic) | 1 |
| staging | B1 (Basic) | 1 |
| prod | P1v3 (Premium) | 1-3 (auto-scale) |

### PostgreSQL

| Environment | SKU | Storage | HA |
|-------------|-----|---------|-----|
| dev | Standard_B1ms | 32 GB | No |
| staging | Standard_B1ms | 32 GB | No |
| prod | Standard_B2s | 64 GB | Yes |

## Health Checks

### Health Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
```

### Health Check Workflow

```yaml
- name: Check application health
  run: |
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")
    if [ "$STATUS" != "200" ]; then
      echo "Health check failed"
      exit 1
    fi
```

## Monitoring

### Application Insights

- Request tracing
- Error logging
- Performance metrics
- Availability tests

### Key Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Response time | > 2s |
| Error rate | > 1% |
| Availability | < 99.5% |
| CPU usage | > 80% |

## Secrets Management

### GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `AZURE_CREDENTIALS` | Azure service principal |
| `DATABASE_URL` | PostgreSQL connection string |

### Key Vault Secrets

| Secret | Purpose |
|--------|---------|
| `database-url` | Database connection |
| `admin-password` | Admin portal password |
| `storage-key` | Blob storage key |
| `ai-api-key` | Azure AI key (optional) |

## Rollback Procedures

### App Service (Quick Rollback)

```bash
# Swap back to previous version
az webapp deployment slot swap \
  --name "prod-app-san-tassa" \
  --resource-group "prod-rg-san-tassa" \
  --slot "production" \
  --target-slot "staging"
```

### Database (Point-in-Time)

```bash
# Restore to specific point
az postgres flexible-server restore \
  --source-server prod-psql-san-tassa \
  --name prod-psql-san-tassa-restored \
  --restore-time "2024-01-15T10:30:00Z"
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Secrets updated if needed

### Post-Deployment

- [ ] Health check passing
- [ ] Key user flows verified
- [ ] Monitoring alerts configured
- [ ] Rollback plan confirmed

## Related Documentation

- [Technology Summary](./01-technology-summary.md)
- [Data & Storage](./06-data-storage.md)
- [Best Practices - DevOps](../best-practices/08-devops.md)
