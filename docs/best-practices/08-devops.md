# DevOps & Deployment Standards

## Overview

This document outlines DevOps practices for CI/CD, infrastructure management, and operational excellence.

## CI/CD Pipeline Standards

### Standard: Automated Quality Gates

```yaml
# Every PR must pass:
jobs:
  lint:        # Code style
  type-check:  # TypeScript compilation
  test:        # Unit/integration tests
  build:       # Production build
```

### Pipeline Stages

| Stage | Purpose | Blocking |
|-------|---------|----------|
| **Lint** | Code style enforcement | Yes |
| **Type Check** | TypeScript errors | Yes |
| **Test** | Unit/integration tests | Yes |
| **Build** | Production build | Yes |
| **Deploy** | Environment deployment | - |
| **Health Check** | Post-deploy verification | No |

### Branch Strategy

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/xyz
  │     └── bugfix/abc
  │
  └── hotfix/urgent-fix
```

| Branch | Purpose | Deploy To |
|--------|---------|-----------|
| `main` | Production code | Production |
| `develop` | Integration | Staging |
| `feature/*` | New features | - |
| `hotfix/*` | Urgent fixes | Production |

## Infrastructure as Code

### Standard: Version Controlled Infrastructure

```bicep
// infra/bicep/main.bicep
@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string

// All infrastructure defined as code
module webApp 'modules/web-app.bicep' = {
  name: 'webApp-${environment}'
  params: {
    name: '${environment}-app-san-tassa'
    // ...
  }
}
```

### Resource Naming Convention

```
{env}-{resource-type}-{region}-{project}

Examples:
dev-app-san-tassa      # App Service
dev-psql-san-tassa     # PostgreSQL
dev-kv-san-tassa       # Key Vault
devstassastorage       # Storage (no hyphens)
```

## Environment Parity

### Standard: Minimize Environment Differences

| Aspect | Dev | Staging | Prod |
|--------|-----|---------|------|
| **Database** | PostgreSQL | PostgreSQL | PostgreSQL |
| **Storage** | Azure Blob | Azure Blob | Azure Blob |
| **App Config** | Same | Same | Same |
| **Scaling** | Smaller | Same as prod | Production |

### Configuration Differences

| Config | Dev | Staging | Prod |
|--------|-----|---------|------|
| SKU (App) | B1 | B1 | P1v3 |
| SKU (DB) | B1ms | B1ms | B2s |
| HA (DB) | No | No | Yes |
| Slots | No | No | Yes |

## Deployment Strategies

### Blue/Green Deployment (Production)

```yaml
# Deploy to staging slot
- name: Deploy to staging slot
  uses: azure/webapps-deploy@v3
  with:
    app-name: "prod-app-san-tassa"
    slot-name: "staging"

# Health check
- name: Verify staging slot
  run: |
    curl -f https://prod-app-san-tassa-staging.azurewebsites.net/api/health

# Swap to production
- name: Swap slots
  run: |
    az webapp deployment slot swap \
      --name "prod-app-san-tassa" \
      --slot "staging" \
      --target-slot "production"
```

### Rollback Procedure

```bash
# Immediate rollback - swap back
az webapp deployment slot swap \
  --name "prod-app-san-tassa" \
  --slot "production" \
  --target-slot "staging"

# Database rollback - point-in-time
az postgres flexible-server restore \
  --source-server prod-psql-san-tassa \
  --name prod-psql-san-tassa-restored \
  --restore-time "2024-01-15T10:30:00Z"
```

## Health Checks

### Standard: Comprehensive Health Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    checks: {} as Record<string, boolean>,
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = true;
  } catch {
    checks.checks.database = false;
    checks.status = 'degraded';
  }

  // Storage check (optional)
  // checks.checks.storage = await checkStorage();

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

### Health Check Configuration

```yaml
# Post-deployment health check
- name: Verify deployment
  run: |
    for i in {1..5}; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")
      if [ "$STATUS" = "200" ]; then
        echo "Health check passed"
        exit 0
      fi
      echo "Attempt $i failed, retrying..."
      sleep 10
    done
    exit 1
```

## Secrets Management

### Standard: Never Commit Secrets

```bash
# ❌ Never commit
.env
*.pem
*credentials*

# ✅ Commit template
.env.example
```

### Secret Sources

| Environment | Source |
|-------------|--------|
| **Local** | `.env` file |
| **CI/CD** | GitHub Secrets |
| **Production** | Azure Key Vault |

### GitHub Secrets Structure

```
Repository Secrets:
├── AZURE_CREDENTIALS

Environment Secrets (per env):
├── dev/
│   └── DATABASE_URL
├── staging/
│   └── DATABASE_URL
└── prod/
    └── DATABASE_URL
```

## Monitoring & Logging

### Standard: Structured Logging

```typescript
// ✅ Good - Structured log
console.error('Product creation failed', {
  error: error.message,
  productData: { name, sku },
  timestamp: new Date().toISOString(),
});

// ❌ Bad - Unstructured log
console.error('Error: ' + error);
```

### Application Insights Integration

```typescript
// Automatic with Azure App Service
// Configure via app settings:
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."
```

### Key Metrics to Monitor

| Metric | Alert Threshold |
|--------|-----------------|
| Response time (p95) | > 2s |
| Error rate | > 1% |
| Availability | < 99.5% |
| CPU usage | > 80% |
| Memory usage | > 85% |

## Database Operations

### Migration Safety

```bash
# Always backup before migration
az postgres flexible-server backup create \
  --resource-group prod-rg-san-tassa \
  --name prod-psql-san-tassa

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db pull
```

### Migration Best Practices

| Practice | Implementation |
|----------|----------------|
| **Backward Compatible** | Add columns as nullable first |
| **Small Changes** | One logical change per migration |
| **Test First** | Run on staging before prod |
| **Rollback Plan** | Know how to reverse |

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **P1** | Complete outage | Immediate |
| **P2** | Major feature broken | 1 hour |
| **P3** | Minor issue | 4 hours |
| **P4** | Cosmetic | Next sprint |

### Response Checklist

1. [ ] Acknowledge incident
2. [ ] Assess severity
3. [ ] Communicate status
4. [ ] Investigate root cause
5. [ ] Implement fix or rollback
6. [ ] Verify resolution
7. [ ] Post-mortem documentation

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Migrations tested
- [ ] Environment variables updated
- [ ] Secrets rotated if needed
- [ ] Backup verified

### Post-Deployment

- [ ] Health check passing
- [ ] Critical flows tested
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated

## Related Documentation

- [Deployments & Ops](../stack/09-deployments-ops.md)
- [Security](./02-security.md)
