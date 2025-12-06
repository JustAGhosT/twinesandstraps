# Database Setup Guide

## Setting Up DATABASE_URL

Prisma requires a `DATABASE_URL` environment variable in your `.env` file to run migrations and connect to your database.

### Format

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

### From Individual Environment Variables

If you have individual PostgreSQL environment variables (`PGHOST`, `PGUSER`, `PGPORT`, `PGDATABASE`, `PGPASSWORD`), you can construct the URL:

```bash
# Example
DATABASE_URL="postgresql://myuser:mypassword@myhost.example.com:5432/mydatabase?sslmode=require"
```

### Quick Setup Script

We've provided a PowerShell script to help you set this up:

```powershell
.\scripts\setup-database-url.ps1
```

This script will:
1. Check if `.env` file exists (create it if not)
2. Check if `DATABASE_URL` already exists
3. Prompt you for database connection details
4. Construct and add `DATABASE_URL` to your `.env` file

### Manual Setup

1. Create or edit `.env` file in the project root:

```bash
# .env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

2. Replace the placeholders with your actual database credentials

### Verify Setup

After setting up `DATABASE_URL`, you can verify it works:

```bash
# Test connection
npx prisma db pull

# Or run migrations
npx prisma migrate dev --name add_user_consent
```

### Troubleshooting

#### Error: "Environment variable not found: DATABASE_URL"

- Make sure `.env` file exists in the project root
- Check that `DATABASE_URL` is spelled correctly (case-sensitive)
- Ensure the URL is properly quoted: `DATABASE_URL="postgresql://..."`
- Restart your terminal/IDE after modifying `.env`

#### Error: "Connection refused" or "Can't reach database server"

- Verify your database server is running
- Check host, port, and network access
- Verify firewall rules allow connections
- Test connection with `psql` or another PostgreSQL client

#### Prisma Config File Detected

If you're using `prisma.config.ts`, Prisma may handle environment variables differently. Make sure:

1. `.env` file is in the project root
2. Environment variables are loaded before Prisma runs
3. Consider using `.env.local` for local development (it's also in `.gitignore`)

### Security Notes

- ⚠️ **Never commit `.env` files to version control**
- The `.env` file is already in `.gitignore`
- Use different credentials for development, staging, and production
- For production, use Azure Key Vault or similar secure storage

