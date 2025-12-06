# Fix the failed Quote migration
# The migration started but never finished, even though tables exist

Write-Host "=== Fixing Failed Quote Migration ===" -ForegroundColor Cyan
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

Write-Host "Step 1: Verifying Quote tables exist..." -ForegroundColor Yellow
$tableCheck = npx --yes dotenv-cli -e .env -- npx tsx scripts/check-failed-migrations.ts 2>&1

if ($tableCheck -match "✅ Quote tables exist") {
    Write-Host "✅ Quote tables exist - migration actually succeeded" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 2: Marking migration as rolled back (to clear failed state)..." -ForegroundColor Yellow
    
    # Try to mark as rolled back - this should clear the failed state
    $migrationName = "20251205212300_add_quote_model"
    
    Write-Host "Running: npx prisma migrate resolve --rolled-back $migrationName" -ForegroundColor Gray
    $result1 = npx --yes dotenv-cli -e .env -- npx prisma migrate resolve --rolled-back $migrationName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration marked as rolled back" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Step 3: Now marking it as applied (since tables exist)..." -ForegroundColor Yellow
        Write-Host "Running: npx prisma migrate resolve --applied $migrationName" -ForegroundColor Gray
        
        $result2 = npx --yes dotenv-cli -e .env -- npx prisma migrate resolve --applied $migrationName 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration successfully resolved!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Result: $result2" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Error: $result1" -ForegroundColor Red
        Write-Host ""
        Write-Host "Trying alternative approach..." -ForegroundColor Yellow
        
        # Alternative: Directly update the migration record in database
        Write-Host "Attempting to fix migration record directly in database..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Step 4: Checking final migration status..." -ForegroundColor Yellow
    npx --yes dotenv-cli -e .env -- npx prisma migrate status
    
} else {
    Write-Host "❌ Quote tables may not exist. Check the output above." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan

