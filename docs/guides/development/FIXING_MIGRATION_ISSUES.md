# Fixing Prisma Migration Issues

## Problem

When running Prisma migrations, you may encounter errors like:
- "Environment variable not found: DATABASE_URL"
- "Migration failed to apply cleanly to the shadow database"
- "relation already exists" errors

## Solution 1: Load Environment Variables

Prisma CLI needs access to your `.env` file. Use `dotenv-cli`:

```bash
# Install dotenv-cli (one-time)
npm install -D dotenv-cli

# Run migrations with environment variables loaded
npx dotenv-cli -e .env -- npx prisma migrate dev --name migration_name
```

Or set DATABASE_URL directly:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:pass@host:port/db"
npx prisma migrate dev --name migration_name

# Linux/Mac
export DATABASE_URL="postgresql://user:pass@host:port/db"
npx prisma migrate dev --name migration_name
```

## Solution 2: Apply Migration Directly (Bypass Migration System)

If Prisma's migration system is out of sync with your database:

### Option A: Run SQL Directly

```bash
# Read and execute migration SQL
npx dotenv-cli -e .env -- npx tsx scripts/apply-user-consent-migration.ts
```

### Option B: Manual SQL Execution

1. Read the migration SQL file:
   ```bash
   cat prisma/migrations/20250107000000_add_user_consent/migration.sql
   ```

2. Connect to your database and run the SQL:
   ```bash
   # Using psql
   psql $DATABASE_URL -f prisma/migrations/20250107000000_add_user_consent/migration.sql
   ```

3. Mark migration as applied:
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20250107000000_add_user_consent
   ```

## Solution 3: Resolve Migration Conflicts

If migrations are out of sync:

1. Check migration status:
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate status
   ```

2. Mark already-applied migrations as resolved:
   ```bash
   # If a migration already exists in database
   npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20251205212300_add_quote_model
   ```

3. Apply remaining migrations:
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate deploy
   ```

## Solution 4: For Production Databases

For production/remote databases, use `migrate deploy` instead of `migrate dev`:

```bash
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

This:
- Doesn't create a shadow database
- Applies only unapplied migrations
- Is safer for production use

## Quick Fix for UserConsent Migration

To apply just the UserConsent table:

```bash
# Method 1: Use the Node.js script
npx dotenv-cli -e .env -- npx tsx scripts/apply-user-consent-migration.ts

# Method 2: Manual SQL (if table doesn't exist)
# Connect to database and run:
CREATE TABLE IF NOT EXISTS "UserConsent" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "analytics_consent" BOOLEAN NOT NULL DEFAULT false,
    "functional_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserConsent_user_id_key" ON "UserConsent"("user_id");
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

# Then mark as applied
npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20250107000000_add_user_consent
```

## Troubleshooting

### Error: "Environment variable not found"
- Ensure `.env` file exists in project root
- Use `dotenv-cli` to load environment variables
- Or set DATABASE_URL in your shell environment

### Error: "Shadow database" issues
- Use `migrate deploy` instead of `migrate dev` for remote databases
- Or disable shadow database (not recommended)

### Error: "relation already exists"
- Migration was already applied manually
- Mark it as resolved: `prisma migrate resolve --applied <migration_name>`

### Error: "Migration failed to apply"
- Check database connection
- Verify user has CREATE TABLE permissions
- Check for conflicting migrations
- Review error message for specific table/constraint issues

## Best Practices

1. **Always use `dotenv-cli` for migrations:**
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate dev
   ```

2. **For production, use `migrate deploy`:**
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate deploy
   ```

3. **Keep migration history in sync:**
   - Don't manually modify database schema
   - Always use Prisma migrations
   - If manual changes are needed, mark migrations as resolved

4. **Test migrations in development first:**
   - Use `migrate dev` locally
   - Test thoroughly before deploying
   - Backup production database before migrations

