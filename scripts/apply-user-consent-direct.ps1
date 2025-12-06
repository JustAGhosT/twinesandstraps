# Direct SQL approach to apply UserConsent table
# This bypasses Prisma migration system issues

Write-Host "Applying UserConsent table directly to database..." -ForegroundColor Cyan

# Load .env file
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

$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Host "❌ ERROR: DATABASE_URL not found" -ForegroundColor Red
    exit 1
}

# Read the migration SQL
$migrationPath = "prisma/migrations/20250107000000_add_user_consent/migration.sql"
if (-not (Test-Path $migrationPath)) {
    Write-Host "❌ Migration file not found: $migrationPath" -ForegroundColor Red
    exit 1
}

$sql = Get-Content $migrationPath -Raw

Write-Host "Migration SQL:" -ForegroundColor Yellow
Write-Host $sql -ForegroundColor Gray
Write-Host ""

# Apply using Prisma db execute
Write-Host "Executing migration SQL..." -ForegroundColor Cyan

# Use Prisma's db execute to run the SQL
$sql | npx --yes dotenv-cli -e .env -- npx prisma db execute --stdin --schema=prisma/schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ UserConsent table created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Mark the migration as applied in Prisma's migration history:" -ForegroundColor Yellow
    Write-Host "  npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20250107000000_add_user_consent" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Error applying migration. The table might already exist." -ForegroundColor Red
    Write-Host "Check the error message above for details." -ForegroundColor Yellow
}

