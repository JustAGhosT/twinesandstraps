# Script to set up DATABASE_URL in .env file
# Usage: .\scripts\setup-database-url.ps1

$envFile = ".env"

# Check if .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $envFile | Out-Null
}

# Read existing .env file
$envContent = @()
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
}

# Check if DATABASE_URL already exists
$hasDatabaseUrl = $false
foreach ($line in $envContent) {
    if ($line -match "^DATABASE_URL=") {
        $hasDatabaseUrl = $true
        Write-Host "DATABASE_URL already exists in .env file" -ForegroundColor Yellow
        Write-Host "Current value: $line" -ForegroundColor Gray
        break
    }
}

if (-not $hasDatabaseUrl) {
    Write-Host ""
    Write-Host "Please provide your database connection details:" -ForegroundColor Cyan
    Write-Host ""
    
    $pgHost = Read-Host "PostgreSQL Host (PGHOST)"
    $pgUser = Read-Host "PostgreSQL User (PGUSER)"
    $pgPort = Read-Host "PostgreSQL Port (PGPORT) [default: 5432]"
    if ([string]::IsNullOrWhiteSpace($pgPort)) {
        $pgPort = "5432"
    }
    $pgDatabase = Read-Host "Database Name (PGDATABASE)"
    $pgPassword = Read-Host "PostgreSQL Password (PGPASSWORD)" -AsSecureString
    $pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
    )
    
    # Construct DATABASE_URL
    $databaseUrl = "postgresql://${pgUser}:${pgPasswordPlain}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=require"
    
    # Add DATABASE_URL to .env file
    Add-Content -Path $envFile -Value ""
    Add-Content -Path $envFile -Value "# Database URL"
    Add-Content -Path $envFile -Value "DATABASE_URL=`"$databaseUrl`""
    
    Write-Host ""
    Write-Host "✅ DATABASE_URL has been added to .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: npx prisma migrate dev --name add_user_consent" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "To update DATABASE_URL, you can:" -ForegroundColor Yellow
    Write-Host "1. Edit .env file manually" -ForegroundColor Gray
    Write-Host "2. Or use the format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" -ForegroundColor Gray
}

