# Prisma Migration Guide

**Last Updated:** December 2025

---

## Quick Reference

### For Remote/Production Databases

```bash
# Always use migrate deploy (not migrate dev)
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

### For Local Development

```bash
# Use migrate dev (creates shadow database)
npx dotenv-cli -e .env -- npx prisma migrate dev --name migration_name
```

---

## Common Issues & Solutions

### Issue 1: Environment Variable Not Found

**Error:** `Error code: P1012 - Environment variable not found: DATABASE_URL`

**Solution:** Use `dotenv-cli` to load environment variables:

```bash
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

### Issue 2: Shadow Database Errors

**Error:** `Migration failed to apply cleanly to the shadow database`

**Cause:** `migrate dev` requires a shadow database, which remote PostgreSQL doesn't support.

**Solution:** Use `migrate deploy` for remote databases:

```bash
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

### Issue 3: Relation Already Exists

**Error:** `ERROR: relation "TableName" already exists`

**Cause:** Database schema is ahead of migration history (migrations partially applied).

**Solution:** Mark migration as applied if tables already exist:

1. Check if tables exist in database
2. If they do, update `_prisma_migrations` table directly
3. See detailed guide below

---

## Detailed Migration Workflow

### Creating a New Migration

1. **Update Prisma Schema** (`prisma/schema.prisma`)
2. **Create Migration:**
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate dev --name descriptive_name
   ```
3. **Review Generated SQL** in `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`
4. **Test Locally** before deploying

### Applying Migrations to Production

1. **Review Migration SQL** carefully
2. **Backup Database** (if possible)
3. **Apply Migration:**
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate deploy
   ```

### Fixing Migration State Issues

If migrations are out of sync with database:

1. **Check Current State:**
   ```bash
   npx dotenv-cli -e .env -- npx prisma migrate status
   ```

2. **If Tables Exist But Migration Not Marked:**
   - Create a script to update `_prisma_migrations` table
   - Mark migration as `finished_at = NOW()`
   - See example scripts in `scripts/` directory

---

## Best Practices

1. **Always use `dotenv-cli`** for remote databases
2. **Use `migrate deploy`** for production/remote databases
3. **Use `migrate dev`** only for local development
4. **Review migration SQL** before applying
5. **Test migrations** in staging before production
6. **Backup database** before major migrations

---

## Related Documentation

- [Database Setup](./DATABASE_SETUP.md)
- [All Migration Issues Resolved](./ALL_MIGRATION_ISSUES_RESOLVED.md) - Historical reference

---

**Last Updated:** December 2025

