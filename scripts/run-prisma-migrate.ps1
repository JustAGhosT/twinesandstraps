# Script to run Prisma migrations with proper environment variable loading
# Usage: .\scripts\run-prisma-migrate.ps1 --name migration_name

param(
    [Parameter(Mandatory=$false)]
    [string]$Name = "migration"
)

# Load .env file
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Cyan
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
                $value = $matches[1]
            }
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

# Verify DATABASE_URL is loaded
if (-not $env:DATABASE_URL) {
    Write-Host ""
    Write-Host "❌ ERROR: DATABASE_URL not found in environment" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure DATABASE_URL is set in your .env file:" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=`"postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`"" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ DATABASE_URL loaded successfully" -ForegroundColor Green
Write-Host ""

# Run Prisma migration
Write-Host "Running Prisma migration: $Name" -ForegroundColor Cyan
npx prisma migrate dev --name $Name

