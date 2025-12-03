# =============================================================================
# Application Deployment Script (PowerShell)
# =============================================================================
# Deploys the Next.js application to Azure App Service
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - Infrastructure already deployed (run deploy-infra.ps1 first)
#   - Node.js and npm installed
#
# Usage:
#   .\deploy-app.ps1 <environment>
#
# Examples:
#   .\deploy-app.ps1 dev
#   .\deploy-app.ps1 prod
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment
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

function Test-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed."
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed."
        exit 1
    }
}

# =============================================================================
# Main Script
# =============================================================================

# Validate inputs
Test-AzureCli
Test-Node

# Resource names
$RESOURCE_GROUP = "${Environment}-rg-san-tassa"
$WEB_APP_NAME = "${Environment}-app-san-tassa"

Write-Info "Deployment Configuration:"
Write-Host "  Environment:    $Environment"
Write-Host "  Resource Group: $RESOURCE_GROUP"
Write-Host "  Web App:        $WEB_APP_NAME"
Write-Host "  Project Dir:    $PROJECT_DIR"
Write-Host ""

# Verify the web app exists
Write-Info "Verifying web app exists..."
$webAppCheck = az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Web app '$WEB_APP_NAME' not found in resource group '$RESOURCE_GROUP'"
    Write-Error "Run deploy-infra.ps1 first to create the infrastructure."
    exit 1
}

Write-Success "Web app found: $WEB_APP_NAME"

# Build the application
Write-Info "Building the application..."
Set-Location $PROJECT_DIR

# Install dependencies
Write-Info "Installing dependencies..."
npm ci

# Generate Prisma client
Write-Info "Generating Prisma client..."
npx prisma generate

# Build Next.js
Write-Info "Building Next.js application..."
npm run build

Write-Success "Build completed successfully!"

# Create deployment package
Write-Info "Creating deployment package..."

$deployDir = Join-Path $env:TEMP "twinesandstraps-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

# Copy necessary files
Copy-Item -Path ".next" -Destination $deployDir -Recurse -Force
Copy-Item -Path "public" -Destination $deployDir -Recurse -Force
Copy-Item -Path "node_modules" -Destination $deployDir -Recurse -Force
Copy-Item -Path "prisma" -Destination $deployDir -Recurse -Force
Copy-Item -Path "package.json" -Destination $deployDir -Force
Copy-Item -Path "package-lock.json" -Destination $deployDir -Force
Copy-Item -Path "next.config.js" -Destination $deployDir -Force

# Create zip for deployment
Write-Info "Creating deployment zip..."
Set-Location $deployDir
$zipPath = Join-Path $deployDir "deploy.zip"
Compress-Archive -Path * -DestinationPath $zipPath -Force

Write-Success "Deployment package created"

# Deploy to Azure
Write-Info "Deploying to Azure App Service..."

az webapp deployment source config-zip `
    --name $WEB_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --src $zipPath `
    --timeout 600

# Clean up
Write-Info "Cleaning up temporary files..."
Remove-Item -Path $deployDir -Recurse -Force

# Get the web app URL
$WEB_APP_URL = az webapp show `
    --name $WEB_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --query "defaultHostName" `
    -o tsv

Write-Host ""
Write-Success "=========================================="
Write-Success "Application deployed successfully!"
Write-Success "=========================================="
Write-Host ""
Write-Host "Application URL: https://$WEB_APP_URL"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Verify the application at: https://$WEB_APP_URL"
Write-Host "  2. Check Application Insights for monitoring"
Write-Host "  3. Run health check: Invoke-WebRequest -Uri https://$WEB_APP_URL/api/health"
Write-Host ""

# Run health check
Write-Info "Running health check..."
try {
    $response = Invoke-WebRequest -Uri "https://$WEB_APP_URL/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Success "Health check passed! (HTTP $($response.StatusCode))"
    } else {
        Write-Warning "Health check returned HTTP $($response.StatusCode)"
        Write-Warning "The app may still be starting up. Wait a moment and try again."
    }
} catch {
    Write-Warning "Health check failed: $($_.Exception.Message)"
    Write-Warning "The app may still be starting up. Wait a moment and try again."
}

