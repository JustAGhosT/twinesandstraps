# Apply Xero Models Migration - Manual Steps

**Last Updated:** December 2025

---

## Migration Details

**Migration Name:** `20251206030000_add_xero_models`  
**Purpose:** Adds XeroToken and XeroInvoiceMapping models to database  
**Tables Created:**
- `XeroToken` - Stores Xero OAuth tokens securely
- `XeroInvoiceMapping` - Maps orders to Xero invoices

---

## ✅ Manual Steps

### Step 1: Check Migration Status

```powershell
npx dotenv-cli -e .env -- npx prisma migrate status
```

**Expected Output:**
- Should show pending migration: `20251206030000_add_xero_models`

---

### Step 2: Apply Migration

For **remote/production database**, use `migrate deploy`:

```powershell
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

**What this does:**
- Applies all pending migrations
- Creates `XeroToken` and `XeroInvoiceMapping` tables
- Creates required indexes
- Adds foreign key constraint to Order table

---

### Step 3: Verify Migration

Check that tables were created:

```powershell
# Using Prisma Studio (visual)
npx dotenv-cli -e .env -- npx prisma studio

# Or check directly in database
npx dotenv-cli -e .env -- npx prisma db execute --stdin
```

Then run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('XeroToken', 'XeroInvoiceMapping');
```

**Expected:** Both tables should be listed

---

### Step 4: Verify Migration Status

```powershell
npx dotenv-cli -e .env -- npx prisma migrate status
```

**Expected Output:**
- Should show: "Database is up to date!"
- No pending migrations

---

## ⚠️ Troubleshooting

### If Migration Fails with "Table Already Exists"

The migration SQL uses `CREATE TABLE IF NOT EXISTS` so it should be safe. If you still get errors:

1. **Check if tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('XeroToken', 'XeroInvoiceMapping');
   ```

2. **If they exist and migration fails:**
   - Tables may have been created manually
   - Verify structure matches schema
   - If structure matches, mark migration as applied manually

### If Migration Fails with Foreign Key Error

Ensure the `Order` table exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Order' AND column_name = 'id';
```

---

## ✅ Success Indicators

- ✅ Migration status shows "Database is up to date!"
- ✅ Both `XeroToken` and `XeroInvoiceMapping` tables exist
- ✅ Indexes are created on key fields
- ✅ Foreign key constraint is in place

---

## Next Steps After Migration

1. **Test Xero OAuth Connection:**
   - Connect Xero account in admin settings
   - Verify token is stored in `XeroToken` table

2. **Test Invoice Syncing:**
   - Sync a test order to Xero
   - Verify mapping is stored in `XeroInvoiceMapping` table

3. **Test Payment Syncing:**
   - Complete a test payment
   - Verify payment is recorded in Xero

---

**Migration File:** `prisma/migrations/20251206030000_add_xero_models/migration.sql`
