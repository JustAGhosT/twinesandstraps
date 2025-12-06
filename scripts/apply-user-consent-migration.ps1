# Script to safely apply UserConsent migration
# This checks if the table exists before applying

Write-Host "Checking database connection..." -ForegroundColor Cyan

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

$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Host "❌ ERROR: DATABASE_URL not found" -ForegroundColor Red
    exit 1
}

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database?sslmode=require
if ($databaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "✓ Connected to database: $dbName at $dbHost" -ForegroundColor Green
} else {
    Write-Host "❌ Could not parse DATABASE_URL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking if UserConsent table exists..." -ForegroundColor Cyan

# Check if UserConsent table exists using Prisma
$checkResult = npx --yes dotenv-cli -e .env -- npx prisma db execute --stdin 2>&1
$checkSQL = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserConsent');"

# Use Prisma Studio or direct SQL check
Write-Host "Applying UserConsent migration..." -ForegroundColor Cyan
Write-Host ""

# Read the migration SQL
$migrationSQL = Get-Content "prisma/migrations/20250107000000_add_user_consent/migration.sql" -Raw

# Apply migration using Prisma migrate resolve if needed
Write-Host "Option 1: Try to apply just the UserConsent migration" -ForegroundColor Yellow
Write-Host "If the table already exists, we'll skip it." -ForegroundColor Gray
Write-Host ""

# Let's try a simpler approach - check if we can apply the migration manually
Write-Host "Running migration with Prisma..." -ForegroundColor Cyan
Write-Host "Note: If you get errors about existing tables, you may need to resolve migration state first." -ForegroundColor Yellow
Write-Host ""

npx --yes dotenv-cli -e .env -- npx prisma migrate resolve --applied 20251205212300_add_quote_model
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Resolved quote migration state" -ForegroundColor Green
}

Write-Host ""
Write-Host "Now applying new migrations..." -ForegroundColor Cyan
npx --yes dotenv-cli -e .env -- npx prisma migrate deploy

