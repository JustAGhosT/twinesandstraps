# All Cron Jobs Setup Guide - Azure Functions

**Last Updated:** December 2025

---

## Overview

This guide covers setup for all automated cron jobs in the application.

---

## Available Cron Jobs

| Cron Job | Schedule | Endpoint | Function |
|----------|----------|----------|----------|
| Low Stock Alert | Daily 9:00 AM UTC | `/api/cron/low-stock-alert` | `low-stock-alert` |
| Welcome Email Series | Daily 10:00 AM UTC | `/api/cron/welcome-emails` | `welcome-emails` |
| Post-Purchase Emails | Daily 11:00 AM UTC | `/api/cron/post-purchase-emails` | `post-purchase-emails` |
| Abandoned Cart | Daily 12:00 PM UTC | `/api/cron/abandoned-cart` | `abandoned-cart` |
| Inventory Sync | Daily 8:00 AM UTC | `/api/cron/inventory-sync` | `inventory-sync` |
| Cache Warming | Daily 7:00 AM UTC | `/api/cron/warm-cache` | `warm-cache` |

---

## Prerequisites

1. Azure Functions Core Tools installed
2. Azure subscription with Functions App created
3. Next.js application deployed to Azure App Service
4. Environment variables configured

---

## Environment Variables

Add to Azure Function App **Configuration** → **Application settings**:

```bash
CRON_SECRET=your-secure-random-secret-here
API_URL=https://your-app-service.azurewebsites.net
```

**Also set in Next.js App Service:**
```bash
CRON_SECRET=your-secure-random-secret-here  # Same value as Function App
```

---

## Quick Deployment

### Deploy All Functions

```powershell
cd azure-functions

# Install dependencies for all functions
npm install

# Build all functions
npm run build

# Deploy to Azure
func azure functionapp publish <your-function-app-name>
```

---

## Individual Function Setup

### 1. Low Stock Alert
- **Directory:** `azure-functions/low-stock-alert/`
- **Schedule:** Daily at 9:00 AM UTC
- **See:** [AZURE_CRON_SETUP.md](../../deployment/AZURE_CRON_SETUP.md)

### 2. Welcome Email Series
- **Directory:** `azure-functions/welcome-emails/`
- **Schedule:** Daily at 10:00 AM UTC
- **See:** [EMAIL_AUTOMATION_CRON_SETUP.md](./EMAIL_AUTOMATION_CRON_SETUP.md)

### 3. Post-Purchase Email Series
- **Directory:** `azure-functions/post-purchase-emails/`
- **Schedule:** Daily at 11:00 AM UTC
- **See:** [EMAIL_AUTOMATION_CRON_SETUP.md](./EMAIL_AUTOMATION_CRON_SETUP.md)

### 4. Abandoned Cart Automation
- **Directory:** `azure-functions/abandoned-cart/`
- **Schedule:** Daily at 12:00 PM UTC
- **See:** [EMAIL_AUTOMATION_CRON_SETUP.md](./EMAIL_AUTOMATION_CRON_SETUP.md)

### 5. Inventory Sync (Optional)
- Create Azure Function or use GitHub Actions
- **Endpoint:** `/api/cron/inventory-sync`
- **Header:** `x-cron-secret: YOUR_CRON_SECRET`

### 6. Cache Warming (Optional)
- Create Azure Function or use GitHub Actions
- **Endpoint:** `/api/cron/warm-cache`
- **Header:** `x-cron-secret: YOUR_CRON_SECRET`

---

## Schedule Summary

All times are in **UTC**:

- **07:00** - Cache Warming
- **08:00** - Inventory Sync
- **09:00** - Low Stock Alert
- **10:00** - Welcome Email Series
- **11:00** - Post-Purchase Email Series
- **12:00** - Abandoned Cart Automation

---

## Testing

### Manual Test Each Function

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_CRON_SECRET"
    "Content-Type" = "application/json"
}
$baseUrl = "https://your-app.azurewebsites.net"

# Test each endpoint
Invoke-RestMethod -Uri "$baseUrl/api/cron/low-stock-alert" -Method GET -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/api/cron/welcome-emails" -Method GET -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/api/cron/post-purchase-emails" -Method GET -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/api/cron/abandoned-cart" -Method GET -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/api/cron/inventory-sync" -Method GET -Headers $headers
Invoke-RestMethod -Uri "$baseUrl/api/cron/warm-cache" -Method GET -Headers $headers
```

---

## Monitoring

### Azure Portal

1. Go to Function App → **Monitor**
2. View execution history
3. Check for errors
4. Review execution times

### Application Insights

All cron jobs send custom events:
- Function start/completion events
- Error tracking
- Performance metrics

---

## Troubleshooting

### Common Issues

1. **Function Not Running:**
   - Check schedule in `function.json`
   - Verify Function App is active
   - Check Azure Portal logs

2. **API Call Failing:**
   - Verify `CRON_SECRET` matches in both places
   - Check `API_URL` is correct
   - Ensure Next.js app is running

3. **Emails Not Sending:**
   - Verify `BREVO_API_KEY` in App Service
   - Check email templates
   - Review Application Insights logs

---

## Manual Steps Summary

### ✅ Required Actions

1. **Environment Setup:**
   - Set `CRON_SECRET` in Function App
   - Set `CRON_SECRET` in App Service (same value)
   - Set `API_URL` in Function App

2. **Deploy Functions:**
   - Build and deploy all Azure Functions
   - Verify all functions are active

3. **Test:**
   - Manually trigger each function
   - Verify API responses
   - Check execution logs

4. **Monitor:**
   - Set up Azure alerts
   - Review logs regularly
   - Monitor success rates

---

**Last Updated:** December 2025

