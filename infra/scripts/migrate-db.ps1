# =============================================================================
# Database Migration Script (PowerShell)
# =============================================================================
# Runs Prisma migrations against the Azure PostgreSQL database
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - Infrastructure already deployed
#   - Node.js and npm installed
#
# Usage:
#   .\migrate-db.ps1 <environment> [-Seed]
#
# Examples:
#   .\migrate-db.ps1 dev
#   .\migrate-db.ps1 prod -Seed
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [switch]$Seed
)

$ErrorActionPreference = "Stop"

# Default values
$BASE_NAME = "twinesandstraps"

# Script and project directories
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent (Split-Path -Parent $SCRIPT_DIR)

# =============================================================================
# Functions
# =============================================================================

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-AzureCli {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Error "Azure CLI is not installed."
        exit 1
    }
    
    $account = az account show 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Not logged in to Azure CLI. Run 'az login' to authenticate."
        exit 1
    }
}

# =============================================================================
# Main Script
# =============================================================================

# Validate inputs
Test-AzureCli

# Resource names
$RESOURCE_GROUP = "${Environment}-rg-san-tassa"
$KEYVAULT_NAME = "${Environment}-kv-san-tassa"

Write-Info "Migration Configuration:"
Write-Host "  Environment:    $Environment"
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Key Vault:      $KEYVAULT_NAME"
Write-Host "  Run Seed:       $Seed"
Write-Host ""

# Get database URL from Key Vault
Write-Info "Retrieving database URL from Key Vault..."

$databaseUrl = az keyvault secret show `
    --vault-name $KEYVAULT_NAME `
    --name "database-url" `
    --query "value" `
    -o tsv 2>$null

if (-not $databaseUrl) {
    Write-Warning "Could not retrieve DATABASE_URL from Key Vault."
    Write-Info "Constructing DATABASE_URL from PostgreSQL server details..."
    
    # Get PostgreSQL server details
    $POSTGRES_SERVER = "${Environment}-psql-san-tassa"
    $postgresFqdn = az postgres flexible-server show `
        --name $POSTGRES_SERVER `
        --resource-group $RESOURCE_GROUP `
        --query "fullyQualifiedDomainName" `
        -o tsv
    
    if (-not $postgresFqdn) {
        Write-Error "Could not find PostgreSQL server: $POSTGRES_SERVER"
        Write-Error "Make sure the infrastructure is deployed."
        exit 1
    }
    
    $postgresLogin = Read-Host "PostgreSQL admin login"
    $securePassword = Read-Host "PostgreSQL admin password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $postgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $databaseUrl = "postgresql://${postgresLogin}:${postgresPassword}@${postgresFqdn}:5432/twinesandstraps?sslmode=require"
}

Write-Success "Database URL retrieved"

# Run migrations
Write-Info "Running database migrations..."
Set-Location $PROJECT_DIR

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Info "Installing dependencies..."
    npm ci
}

# Generate Prisma client
Write-Info "Generating Prisma client..."
npx prisma generate

# Run migrations
Write-Info "Applying migrations..."
$env:DATABASE_URL = $databaseUrl
npx prisma migrate deploy

Write-Success "Migrations applied successfully!"

# Optionally run seed
if ($Seed) {
    Write-Info "Running database seed..."
    $env:DATABASE_URL = $databaseUrl
    npm run seed
    Write-Success "Database seeded successfully!"
}

Write-Host ""
Write-Success "=========================================="
Write-Success "Database migration completed!"
Write-Success "=========================================="
Write-Host ""
Write-Host "You can now deploy the application using:"
Write-Host "  .\deploy-app.ps1 $Environment"
Write-Host ""

