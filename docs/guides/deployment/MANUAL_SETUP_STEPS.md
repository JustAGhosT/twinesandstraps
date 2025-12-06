# Manual Setup Steps - Migration & Cron Jobs

**Last Updated:** December 2025

---

## 🎯 Overview

This document provides clear, step-by-step instructions for the two manual setup tasks:
1. Apply Xero models database migration
2. Configure Azure Functions for email automation cron jobs

---

## Part 1: Apply Xero Models Migration

### Step 1: Check Migration Status

Open PowerShell in the project root and run:

```powershell
npx dotenv-cli -e .env -- npx prisma migrate status
```

**What to look for:**
- Should show pending migration: `20251206030000_add_xero_models`
- If it shows "Database is up to date!", migration is already applied

---

### Step 2: Apply Migration

**Option A: Use the provided script (Recommended)**

```powershell
.\scripts\apply-xero-migration.ps1
```

This script will:
- Check migration status
- Show you what will be created
- Ask for confirmation
- Apply the migration
- Verify the results

**Option B: Apply directly**

```powershell
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

---

### Step 3: Verify Migration

After applying, verify:

```powershell
# Check migration status (should show "Database is up to date!")
npx dotenv-cli -e .env -- npx prisma migrate status
```

**Expected Result:**
```
Database is up to date!
No pending migrations found.
```

---

### ✅ Migration Complete When:
- [ ] Migration status shows "Database is up to date!"
- [ ] No errors during migration
- [ ] Tables `XeroToken` and `XeroInvoiceMapping` exist

**Troubleshooting:** See [APPLY_XERO_MIGRATION.md](./APPLY_XERO_MIGRATION.md)

---

## Part 2: Configure Email Automation Cron Jobs

### Step 1: Generate CRON_SECRET

Generate a secure random secret:

```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Save this value** - you'll need to use it in multiple places.

---

### Step 2: Set Environment Variables

#### A. Azure Function App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **Function App**
3. Go to **Configuration** → **Application settings**
4. Click **+ New application setting**
5. Add these settings:
   ```
   Name: CRON_SECRET
   Value: <your-generated-secret-from-step-1>
   
   Name: API_URL
   Value: https://your-app-service.azurewebsites.net
   ```
6. Click **Save**

#### B. Azure App Service (Next.js App)

1. In Azure Portal, navigate to your **App Service**
2. Go to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add:
   ```
   Name: CRON_SECRET
   Value: <same-secret-as-function-app>
   ```
5. Click **Save**

**Important:** The `CRON_SECRET` must be **identical** in both places.

---

### Step 3: Deploy Azure Functions

#### Option A: Deploy All Functions (Recommended)

```powershell
# Navigate to azure-functions directory
cd azure-functions

# Install dependencies (if not already done)
npm install

# Build all functions
npm run build

# Deploy to Azure
func azure functionapp publish <your-function-app-name>
```

**Replace `<your-function-app-name>`** with your actual Function App name.

#### Option B: Deploy Individual Functions

**Welcome Email Series:**
```powershell
cd azure-functions/welcome-emails
npm install
npm run build
func azure functionapp publish <your-function-app-name>
```

**Post-Purchase Email Series:**
```powershell
cd azure-functions/post-purchase-emails
npm install
npm run build
func azure functionapp publish <your-function-app-name>
```

**Abandoned Cart:**
```powershell
cd azure-functions/abandoned-cart
npm install
npm run build
func azure functionapp publish <your-function-app-name>
```

---

### Step 4: Verify Functions in Azure Portal

1. Go to Azure Portal → Your **Function App**
2. Navigate to **Functions**
3. Verify these functions are listed:
   - ✅ `welcome-emails`
   - ✅ `post-purchase-emails`
   - ✅ `abandoned-cart`
   - ✅ `low-stock-alert` (if already deployed)

---

### Step 5: Test Functions

#### Manual Test in Azure Portal

1. Go to each function (e.g., `welcome-emails`)
2. Click **Test/Run**
3. Click **Run** to manually trigger
4. Check **Monitor** tab for execution logs
5. Verify successful API call

#### Test via API (Alternative)

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_CRON_SECRET"
    "Content-Type" = "application/json"
}
$baseUrl = "https://your-app.azurewebsites.net"

# Test Welcome Emails
Invoke-RestMethod -Uri "$baseUrl/api/cron/welcome-emails" -Method GET -Headers $headers

# Test Post-Purchase Emails
Invoke-RestMethod -Uri "$baseUrl/api/cron/post-purchase-emails" -Method GET -Headers $headers

# Test Abandoned Cart
Invoke-RestMethod -Uri "$baseUrl/api/cron/abandoned-cart" -Method GET -Headers $headers
```

---

## Schedule Summary

All cron jobs run daily (times are in **UTC**):

| Time (UTC) | Function | Purpose |
|------------|----------|---------|
| 07:00 | Cache Warming | Pre-loads cache |
| 08:00 | Inventory Sync | Syncs supplier inventory |
| 09:00 | Low Stock Alert | Sends low stock emails |
| 10:00 | Welcome Email Series | Day 1, 3, 7 welcome emails |
| 11:00 | Post-Purchase Emails | Order follow-up emails |
| 12:00 | Abandoned Cart | Cart recovery emails |

---

## ✅ Complete Checklist

### Migration
- [ ] Migration status checked
- [ ] Migration applied successfully
- [ ] Migration verified (status shows "up to date")
- [ ] Tables verified (optional: check in database)

### Cron Jobs
- [ ] `CRON_SECRET` generated
- [ ] `CRON_SECRET` set in Azure Function App
- [ ] `CRON_SECRET` set in Azure App Service (same value)
- [ ] `API_URL` set in Azure Function App
- [ ] All Azure Functions built
- [ ] All Azure Functions deployed
- [ ] Functions verified in Azure Portal
- [ ] At least one function tested manually
- [ ] Execution logs reviewed

---

## Troubleshooting

### Migration Issues

**"Table already exists"**
- The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe
- If migration fails, check if tables were created manually
- Verify table structure matches schema

**"Foreign key constraint failed"**
- Ensure `Order` table exists
- Verify `Order.id` column exists
- Check migration history

### Cron Job Issues

**Functions not appearing in Azure Portal:**
- Check deployment logs for errors
- Verify Function App is active (not stopped)
- Try redeploying individual functions

**API calls returning 401 Unauthorized:**
- Verify `CRON_SECRET` matches exactly in both places
- Check for extra spaces or quotes
- Regenerate secret if needed

**Functions not executing:**
- Check schedule in `function.json`
- Verify Function App is running
- Check Azure Portal logs for errors
- Ensure timezone is UTC

---

## Next Steps After Setup

1. **Monitor First Executions:**
   - Wait for scheduled time or trigger manually
   - Check execution logs in Azure Portal
   - Verify emails are being sent

2. **Set Up Alerts:**
   - Create Azure alerts for function failures
   - Monitor execution success rates
   - Set up email notifications for failures

3. **Review Logs:**
   - Check Application Insights for events
   - Monitor email delivery rates
   - Review any errors

---

## Detailed Documentation

- **Migration Guide:** [APPLY_XERO_MIGRATION.md](./APPLY_XERO_MIGRATION.md)
- **Email Automation Setup:** [EMAIL_AUTOMATION_CRON_SETUP.md](./EMAIL_AUTOMATION_CRON_SETUP.md)
- **All Cron Jobs:** [ALL_CRON_JOBS_SETUP.md](./ALL_CRON_JOBS_SETUP.md)
- **Combined Guide:** [MIGRATION_AND_CRON_SETUP.md](./MIGRATION_AND_CRON_SETUP.md)

---

**Last Updated:** December 2025

