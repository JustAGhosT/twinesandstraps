# Comprehensive script to fix all failed migrations
# Marks migrations as applied if their changes already exist in database

Write-Host "=== Fixing All Failed Migrations ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -match '^"(.*)"$') {
                $value = $matches[1]
            }
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

Write-Host "Step 1: Checking all failed migrations..." -ForegroundColor Yellow
npx --yes dotenv-cli -e .env -- npx tsx scripts/check-failed-migrations.ts

Write-Host ""
Write-Host "Step 2: Fixing slug migrations..." -ForegroundColor Yellow
Write-Host "These migrations are creating indexes/columns that already exist." -ForegroundColor Gray
Write-Host "We'll mark them as applied since the changes are already in the database." -ForegroundColor Gray
Write-Host ""

# Check if slug column exists on Product table
Write-Host "Checking if slug column exists on Product table..." -ForegroundColor Cyan
$slugCheck = npx --yes dotenv-cli -e .env -- npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.`$queryRaw\`SELECT column_name FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'slug'\`.then(r => { console.log(JSON.stringify(r)); p.`$disconnect(); });" 2>&1

if ($slugCheck -match "slug") {
    Write-Host "✅ Slug column exists - migrations are already applied" -ForegroundColor Green
    Write-Host ""
    Write-Host "Marking slug migrations as applied..." -ForegroundColor Yellow
    
    # Use our TypeScript script to fix migration states
    npx --yes dotenv-cli -e .env -- npx tsx scripts/fix-slug-migrations.ts
} else {
    Write-Host "⚠️  Slug column check inconclusive" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Final migration status..." -ForegroundColor Yellow
npx --yes dotenv-cli -e .env -- npx prisma migrate status

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan

