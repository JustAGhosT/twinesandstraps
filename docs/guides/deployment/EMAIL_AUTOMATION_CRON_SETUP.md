# Email Automation Cron Jobs Setup - Azure Functions

**Last Updated:** December 2025

---

## Overview

This guide explains how to set up Azure Functions for email automation cron jobs:
- **Welcome Email Series** - Daily at 10:00 AM UTC
- **Post-Purchase Email Series** - Daily at 11:00 AM UTC  
- **Abandoned Cart Automation** - Daily at 12:00 PM UTC

---

## Prerequisites

1. Azure Functions Core Tools installed
2. Azure subscription with Functions App created
3. Next.js application deployed to Azure App Service
4. `CRON_SECRET` environment variable configured

---

## 1. Environment Variables

Add the following to your Azure Function App **Configuration** → **Application settings**:

```bash
CRON_SECRET=your-secure-random-secret-here
API_URL=https://your-app-service.azurewebsites.net
# OR use NEXT_PUBLIC_SITE_URL if already set
```

**Generate CRON_SECRET:**
```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use openssl (if available)
openssl rand -hex 32
```

**Important:** Use the **same** `CRON_SECRET` in:
- Azure Function App settings
- Next.js App Service settings (as `CRON_SECRET`)

---

## 2. Deploy Azure Functions

### Option A: Deploy All Functions at Once

```powershell
# Navigate to azure-functions directory
cd azure-functions

# Build all functions
npm install
npm run build

# Deploy all functions
func azure functionapp publish <your-function-app-name>
```

### Option B: Deploy Individual Functions

#### Welcome Email Series

```powershell
cd azure-functions/welcome-emails
npm install
npm run build
func azure functionapp publish <your-function-app-name> --typescript
```

#### Post-Purchase Email Series

```powershell
cd azure-functions/post-purchase-emails
npm install
npm run build
func azure functionapp publish <your-function-app-name> --typescript
```

#### Abandoned Cart Automation

```powershell
cd azure-functions/abandoned-cart
npm install
npm run build
func azure functionapp publish <your-function-app-name> --typescript
```

---

## 3. Schedule Configuration

Each function has its own schedule configured in `function.json`:

### Welcome Email Series
- **Schedule:** `0 0 10 * * *` (Daily at 10:00 AM UTC)
- **File:** `azure-functions/welcome-emails/function.json`

### Post-Purchase Email Series
- **Schedule:** `0 0 11 * * *` (Daily at 11:00 AM UTC)
- **File:** `azure-functions/post-purchase-emails/function.json`

### Abandoned Cart Automation
- **Schedule:** `0 0 12 * * *` (Daily at 12:00 PM UTC)
- **File:** `azure-functions/abandoned-cart/function.json`

### Customizing Schedules

**Cron Format:** `{second} {minute} {hour} {day} {month} {day-of-week}`

Examples:
- **Every day at 8 AM SAST (6 AM UTC):** `"0 0 6 * * *"`
- **Every 6 hours:** `"0 0 */6 * * *"`
- **Every Monday at 9 AM UTC:** `"0 0 9 * * 1"`

---

## 4. Verify Deployment

### Check Functions in Azure Portal

1. Go to Azure Portal → Your Function App
2. Navigate to **Functions**
3. Verify all three functions are listed:
   - `welcome-emails`
   - `post-purchase-emails`
   - `abandoned-cart`

### Manual Test

1. Go to each function in Azure Portal
2. Click **Test/Run** to manually trigger
3. Check **Monitor** tab for execution logs
4. Verify API calls are successful

### Test API Endpoints Directly

```powershell
# Test Welcome Email Series
$headers = @{
    "Authorization" = "Bearer YOUR_CRON_SECRET"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "https://your-app.azurewebsites.net/api/cron/welcome-emails" -Method GET -Headers $headers

# Test Post-Purchase Email Series
Invoke-RestMethod -Uri "https://your-app.azurewebsites.net/api/cron/post-purchase-emails" -Method GET -Headers $headers

# Test Abandoned Cart
Invoke-RestMethod -Uri "https://your-app.azurewebsites.net/api/cron/abandoned-cart" -Method GET -Headers $headers
```

---

## 5. Monitor Execution

### Azure Portal Monitoring

1. Go to Function App → **Monitor**
2. View execution history for each function
3. Check for errors or failed executions
4. Review execution times and durations

### Application Insights

All cron jobs send events to Application Insights:
- `WelcomeEmailSeriesStarted`
- `WelcomeEmailSeriesCompleted`
- `PostPurchaseEmailSeriesStarted`
- `PostPurchaseEmailSeriesCompleted`
- `AbandonedCartAutomationStarted`
- `AbandonedCartAutomationCompleted`

---

## Troubleshooting

### Function Not Executing

1. **Check Schedule:** Verify cron expression in `function.json`
2. **Check Timezone:** Azure Functions use UTC by default
3. **Check Logs:** Review Function App logs for errors
4. **Verify Environment Variables:** Ensure `CRON_SECRET` and `API_URL` are set

### API Calls Failing

1. **Verify CRON_SECRET:** Must match in both Function App and App Service
2. **Check API URL:** Ensure `API_URL` or `NEXT_PUBLIC_SITE_URL` is correct
3. **Check App Service:** Ensure Next.js app is running and accessible
4. **Review API Logs:** Check Application Insights or App Service logs

### Email Not Sending

1. **Check Brevo Configuration:** Verify `BREVO_API_KEY` is set in App Service
2. **Check Email Templates:** Verify templates exist and are configured
3. **Review Email Logs:** Check Application Insights for email events
4. **Verify Recipients:** Ensure there are recipients who need emails

---

## Alternative: Using GitHub Actions

If you prefer not to use Azure Functions, you can set up GitHub Actions cron jobs:

```yaml
# .github/workflows/email-automation.yml
name: Email Automation Cron

on:
  schedule:
    - cron: '0 10 * * *'  # Daily at 10 AM UTC
  workflow_dispatch:

jobs:
  welcome-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Welcome Emails
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/welcome-emails" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Manual Steps Summary

### ✅ Required Actions

1. **Set Environment Variables:**
   - `CRON_SECRET` in Function App
   - `CRON_SECRET` in App Service
   - `API_URL` in Function App (or use `NEXT_PUBLIC_SITE_URL`)

2. **Deploy Functions:**
   - Build TypeScript functions
   - Deploy to Azure Function App
   - Verify functions are active

3. **Test:**
   - Manually trigger each function
   - Verify API calls succeed
   - Check email delivery

4. **Monitor:**
   - Set up alerts for failures
   - Review execution logs regularly
   - Monitor email delivery rates

---

**Last Updated:** December 2025

