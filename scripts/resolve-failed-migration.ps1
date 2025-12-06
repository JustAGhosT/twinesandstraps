# Script to resolve failed migration state
# Fixes P3009 error: "migrate found failed migrations in the target database"

Write-Host "=== Resolving Failed Migration ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables..." -ForegroundColor Yellow
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
    Write-Host "✅ Environment loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Checking if Quote table exists..." -ForegroundColor Cyan

# Check if Quote table exists using our diagnostic script
$tableCheck = npx --yes dotenv-cli -e .env -- npx tsx scripts/check-database-tables.ts 2>&1
if ($tableCheck -match "✓ Quote") {
    Write-Host "✅ Quote table exists in database" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 2: Resolving failed migration..." -ForegroundColor Cyan
    Write-Host "Since the Quote table exists, the migration actually succeeded." -ForegroundColor Yellow
    Write-Host "We'll mark it as rolled back first, then as applied." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Marking migration as rolled back..." -ForegroundColor Yellow
    $rollbackResult = npx --yes dotenv-cli -e .env -- npx prisma migrate resolve --rolled-back 20251205212300_add_quote_model 2>&1
    Write-Host $rollbackResult
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration marked as rolled back" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Now marking it as applied (since table exists)..." -ForegroundColor Yellow
        $applyResult = npx --yes dotenv-cli -e .env -- npx prisma migrate resolve --applied 20251205212300_add_quote_model 2>&1
        Write-Host $applyResult
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration resolved successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not mark as applied, but that's okay - let's check status" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Quote table does not exist!" -ForegroundColor Red
    Write-Host "The migration may have actually failed. Checking migration status..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Checking migration status..." -ForegroundColor Cyan
npx --yes dotenv-cli -e .env -- npx prisma migrate status

Write-Host ""
Write-Host "=== Resolution Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the migration is still showing as failed:" -ForegroundColor Yellow
Write-Host "1. Check if all tables from the migration exist" -ForegroundColor Gray
Write-Host "2. If they exist, mark migration as rolled back then applied" -ForegroundColor Gray
Write-Host "3. If they don't exist, you may need to manually create them" -ForegroundColor Gray
Write-Host ""

