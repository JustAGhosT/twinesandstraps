# Script to resolve Prisma migration conflicts
# Fixes issues when tables already exist in database but migrations haven't been marked as applied

Write-Host "=== Prisma Migration Conflict Resolution ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Yellow
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
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Checking migration status..." -ForegroundColor Cyan
npx --yes dotenv-cli -e .env -- npx prisma migrate status

Write-Host ""
Write-Host "Step 2: Checking which tables exist in database..." -ForegroundColor Cyan

# Create a temp script to check tables
$checkTablesScript = @"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTables() {
  const tables = await prisma.`$queryRaw\`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  \`;
  
  console.log('\nTables in database:');
  tables.forEach((t: any) => console.log('  -', t.table_name));
  
  await prisma.`$disconnect();
}

checkTables();
"@

$checkTablesScript | Out-File -FilePath "temp-check-tables.ts" -Encoding utf8
npx --yes dotenv-cli -e .env -- npx tsx temp-check-tables.ts
Remove-Item "temp-check-tables.ts" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 3: Resolving migration conflicts..." -ForegroundColor Cyan
Write-Host ""

# List of migrations that might already be applied
$migrationsToResolve = @(
    "20251205212300_add_quote_model",
    "20250107000000_add_user_consent"
)

foreach ($migration in $migrationsToResolve) {
    Write-Host "Checking migration: $migration" -ForegroundColor Yellow
    
    # Check if migration directory exists
    $migrationPath = "prisma/migrations/$migration"
    if (-not (Test-Path $migrationPath)) {
        Write-Host "  ⚠️  Migration directory not found, skipping" -ForegroundColor Gray
        continue
    }
    
    Write-Host "  Attempting to mark as applied..." -ForegroundColor Gray
    
    # Try to resolve - if it's already applied, this will just confirm it
    $result = npx --yes dotenv-cli -e .env -- npx prisma migrate resolve --applied $migration 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Migration $migration marked as applied" -ForegroundColor Green
    } else {
        $resultString = $result -join "`n"
        if ($resultString -match "already applied" -or $resultString -match "not found") {
            Write-Host "  ℹ️  Migration already resolved or not in pending state" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  Could not resolve: $resultString" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Step 4: Final migration status..." -ForegroundColor Cyan
npx --yes dotenv-cli -e .env -- npx prisma migrate status

Write-Host ""
Write-Host "=== Resolution Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If migrations are still showing as pending, you can:" -ForegroundColor Yellow
Write-Host "1. Apply them manually using the SQL files" -ForegroundColor Gray
Write-Host "2. Or use: npx dotenv-cli -e .env -- npx prisma migrate deploy" -ForegroundColor Gray
Write-Host ""

