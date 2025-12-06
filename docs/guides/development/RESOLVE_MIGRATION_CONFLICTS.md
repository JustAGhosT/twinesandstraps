# Resolving Prisma Migration Conflicts

## Common Issues

### Issue 1: Shadow Database Error (P3006)
```
Error: Migration failed to apply cleanly to the shadow database.
Error: The underlying table for model `User` does not exist.
```

**Cause:** Prisma tries to create a temporary shadow database to validate migrations, but the shadow DB doesn't have the existing schema.

**Solution:** Use `prisma migrate deploy` for production/remote databases instead of `prisma migrate dev`.

### Issue 2: Table Already Exists (P3018)
```
Error: relation "Quote" already exists
Migration failed to apply. New migrations cannot be applied before the error is recovered from.
```

**Cause:** The table exists in your database, but Prisma's migration history doesn't know it was applied.

**Solution:** Mark the migration as already applied using `prisma migrate resolve`.

## Step-by-Step Resolution

### Step 1: Check Current State

```powershell
# Check which tables exist
npx dotenv-cli -e .env -- npx tsx scripts/check-database-tables.ts

# Check migration status
npx dotenv-cli -e .env -- npx prisma migrate status
```

### Step 2: Resolve Conflicts

Run the resolution script:

```powershell
.\scripts\resolve-migration-conflicts.ps1
```

Or manually resolve each migration:

```powershell
# Mark migrations that are already applied
npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20251205212300_add_quote_model
npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20250107000000_add_user_consent
```

### Step 3: Apply Remaining Migrations

```powershell
# For production/remote databases
npx dotenv-cli -e .env -- npx prisma migrate deploy

# For local development (if shadow database works)
npx dotenv-cli -e .env -- npx prisma migrate dev
```

## Manual Resolution

If automated resolution doesn't work:

### Option A: Mark All Applied Migrations

1. List all migrations in `prisma/migrations/`
2. For each migration that corresponds to existing tables, mark as applied:

```powershell
npx dotenv-cli -e .env -- npx prisma migrate resolve --applied <migration_name>
```

### Option B: Reset Migration History (⚠️ Use with caution)

If migrations are completely out of sync:

1. **Backup your database first!**

2. Check which migrations are actually in the database:
   ```sql
   SELECT migration_name, applied_steps_count 
   FROM "_prisma_migrations" 
   ORDER BY finished_at DESC;
   ```

3. Mark missing migrations as applied or roll them back as needed.

### Option C: Create Baseline Migration

If your database has tables that don't match any migration:

1. Introspect current database state:
   ```powershell
   npx dotenv-cli -e .env -- npx prisma db pull
   ```

2. Create a new baseline migration:
   ```powershell
   npx dotenv-cli -e .env -- npx prisma migrate dev --name baseline --create-only
   ```

3. Mark baseline as applied:
   ```powershell
   npx dotenv-cli -e .env -- npx prisma migrate resolve --applied baseline
   ```

## Prevention

To avoid migration conflicts:

1. **Always use `migrate deploy` for production:**
   - Doesn't create shadow database
   - Only applies unapplied migrations
   - Safer for remote databases

2. **Don't manually modify database schema:**
   - Always use Prisma migrations
   - Keep migration history in sync

3. **Test migrations locally first:**
   - Use `migrate dev` in development
   - Test thoroughly before deploying

4. **Use migration scripts for complex changes:**
   - Create migration scripts that check if changes are needed
   - Use `IF NOT EXISTS` clauses where possible

## Quick Reference

```powershell
# Check migration status
npx dotenv-cli -e .env -- npx prisma migrate status

# Check database tables
npx dotenv-cli -e .env -- npx tsx scripts/check-database-tables.ts

# Mark migration as applied
npx dotenv-cli -e .env -- npx prisma migrate resolve --applied <migration_name>

# Apply migrations (production)
npx dotenv-cli -e .env -- npx prisma migrate deploy

# Apply migrations (development)
npx dotenv-cli -e .env -- npx prisma migrate dev

# Run resolution script
.\scripts\resolve-migration-conflicts.ps1
```

## Specific Fixes for Your Issues

### Fix 1: Shadow Database Error

The shadow database error occurs with `migrate dev`. For your Azure PostgreSQL database, use:

```powershell
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

This bypasses the shadow database check.

### Fix 2: Quote Table Already Exists

Mark the quote migration as already applied:

```powershell
npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20251205212300_add_quote_model
```

Then apply remaining migrations:

```powershell
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

