# Migration & Cron Job Setup - Manual Steps

**Last Updated:** December 2025

---

## 🎯 Overview

This guide covers the manual setup steps required after code implementation:
1. Apply Xero models database migration
2. Configure Azure Functions for email automation cron jobs

---

## Part 1: Apply Xero Models Migration

### Step 1: Check Current Migration Status

```powershell
npx dotenv-cli -e .env -- npx prisma migrate status
```

**Expected:** Should show pending migration `20251206030000_add_xero_models`

---

### Step 2: Apply Migration

```powershell
# Option 1: Use the provided script
.\scripts\apply-xero-migration.ps1

# Option 2: Apply directly
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

**What this does:**
- Creates `XeroToken` table for OAuth token storage
- Creates `XeroInvoiceMapping` table for order-invoice mapping
- Adds indexes and foreign key constraints

---

### Step 3: Verify Migration

```powershell
# Check migration status
npx dotenv-cli -e .env -- npx prisma migrate status

# Expected: "Database is up to date!"
```

---

**Detailed Guide:** [APPLY_XERO_MIGRATION.md](./APPLY_XERO_MIGRATION.md)

---

## Part 2: Configure Email Automation Cron Jobs

### Step 1: Generate CRON_SECRET

```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Save this value - you'll need it in both places.

---

### Step 2: Set Environment Variables

#### In Azure Function App:

1. Go to Azure Portal → Your Function App
2. Navigate to **Configuration** → **Application settings**
3. Add:
   ```
   CRON_SECRET=<your-generated-secret>
   API_URL=https://your-app-service.azurewebsites.net
   ```

#### In Azure App Service (Next.js):

1. Go to Azure Portal → Your App Service
2. Navigate to **Configuration** → **Application settings**
3. Add:
   ```
   CRON_SECRET=<same-secret-as-above>
   ```

---

### Step 3: Deploy Azure Functions

```powershell
# Navigate to azure-functions directory
cd azure-functions

# Install dependencies (if not done)
npm install

# Build all functions
npm run build

# Deploy to Azure
func azure functionapp publish <your-function-app-name>
```

---

### Step 4: Verify Functions

1. Go to Azure Portal → Your Function App
2. Navigate to **Functions**
3. Verify these functions are listed:
   - ✅ `welcome-emails`
   - ✅ `post-purchase-emails`
   - ✅ `abandoned-cart`

---

### Step 5: Test Functions

Manually trigger each function in Azure Portal:
1. Go to each function
2. Click **Test/Run**
3. Check **Monitor** tab for logs
4. Verify successful API calls

---

## Schedule Summary

All cron jobs run daily (UTC):

| Time | Function | Purpose |
|------|----------|---------|
| 9:00 AM | Low Stock Alert | Daily inventory alerts |
| 10:00 AM | Welcome Email Series | Day 1, 3, 7 welcome emails |
| 11:00 AM | Post-Purchase Emails | Order follow-up emails |
| 12:00 PM | Abandoned Cart | Cart recovery emails |

---

## ✅ Completion Checklist

### Migration
- [ ] Migration status checked
- [ ] Migration applied successfully
- [ ] Tables verified in database
- [ ] Migration status shows "up to date"

### Cron Jobs
- [ ] CRON_SECRET generated and set in Function App
- [ ] CRON_SECRET set in App Service (same value)
- [ ] API_URL configured in Function App
- [ ] All Azure Functions deployed
- [ ] Functions verified in Azure Portal
- [ ] Functions tested manually
- [ ] Execution logs reviewed

---

## Troubleshooting

### Migration Issues

**Error: "Table already exists"**
- Check if tables were created manually
- Migration uses `CREATE TABLE IF NOT EXISTS`, should be safe
- Verify table structure matches schema

**Error: "Foreign key constraint failed"**
- Ensure `Order` table exists
- Verify `Order.id` column exists

### Cron Job Issues

**Functions not executing:**
- Check schedule in `function.json`
- Verify Function App is active
- Check Azure Portal logs

**API calls failing:**
- Verify `CRON_SECRET` matches in both places
- Check `API_URL` is correct
- Ensure Next.js app is running

---

## Detailed Documentation

- **Migration:** [APPLY_XERO_MIGRATION.md](./APPLY_XERO_MIGRATION.md)
- **Email Automation:** [EMAIL_AUTOMATION_CRON_SETUP.md](./EMAIL_AUTOMATION_CRON_SETUP.md)
- **All Cron Jobs:** [ALL_CRON_JOBS_SETUP.md](./ALL_CRON_JOBS_SETUP.md)
- **Low Stock Alert:** [../../deployment/AZURE_CRON_SETUP.md](../../deployment/AZURE_CRON_SETUP.md)

---

**Last Updated:** December 2025

