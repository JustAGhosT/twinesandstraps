# =============================================================================
# Azure Infrastructure Deployment Script (PowerShell)
# =============================================================================
# Deploys the Twines and Straps SA infrastructure to Azure
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - Appropriate Azure subscription and permissions
#
# Usage:
#   .\deploy-infra.ps1 <environment> [location] [subscription-id]
#
# Examples:
#   .\deploy-infra.ps1 dev
#   .\deploy-infra.ps1 staging southafricanorth
#   .\deploy-infra.ps1 prod southafricanorth my-subscription-id
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "southafricanorth",
    
    [Parameter(Mandatory=$false)]
    [string]$Subscription = ""
)

$ErrorActionPreference = "Stop"

# Default values
$BASE_NAME = "twinesandstraps"

# Script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BICEP_DIR = Join-Path (Split-Path -Parent $SCRIPT_DIR) "bicep"

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
        Write-Error "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    }
    
    $account = az account show 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Not logged in to Azure CLI."
        Write-Error "Run 'az login' to authenticate."
        exit 1
    }
}

function Test-Bicep {
    $bicepVersion = az bicep version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Bicep CLI not found. Installing..."
        az bicep install
    }
}

function Get-Secrets {
    param([string]$Env)
    
    Write-Host ""
    Write-Info "Please provide the following secrets for the $Env environment:"
    Write-Host ""
    
    # PostgreSQL admin credentials
    $script:POSTGRES_ADMIN_LOGIN = Read-Host "PostgreSQL admin login"
    $securePassword = Read-Host "PostgreSQL admin password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $script:POSTGRES_ADMIN_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Application admin password
    $secureAdminPassword = Read-Host "Application admin password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAdminPassword)
    $script:ADMIN_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Optional: Azure AI credentials
    $script:AZURE_AI_ENDPOINT = Read-Host "Azure AI endpoint (optional, press Enter to skip)"
    if ($script:AZURE_AI_ENDPOINT) {
        $secureAiKey = Read-Host "Azure AI API key" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAiKey)
        $script:AZURE_AI_API_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        $aiDeployment = Read-Host "Azure AI deployment name (default: gpt-4o)"
        $script:AZURE_AI_DEPLOYMENT = if ($aiDeployment) { $aiDeployment } else { "gpt-4o" }
    }
}

# =============================================================================
# Main Script
# =============================================================================

# Validate inputs
Test-AzureCli
Test-Bicep

# Set subscription if provided
if ($Subscription) {
    Write-Info "Setting subscription to: $Subscription"
    az account set --subscription $Subscription | Out-Null
}

# Get current subscription info
$currentSub = az account show --query "{name:name, id:id}" -o tsv
Write-Info "Using Azure subscription: $currentSub"

# Resource group name
$RESOURCE_GROUP = "${Environment}-rg-san-tassa"

Write-Info "Deployment Configuration:"
Write-Host "  Environment:      $Environment"
Write-Host "  Location:         $Location"
Write-Host "  Resource Group:   $RESOURCE_GROUP"
Write-Host ""

# Prompt for secrets
Get-Secrets $Environment

# Create resource group if it doesn't exist
Write-Info "Creating resource group: $RESOURCE_GROUP"
az group create `
    --name $RESOURCE_GROUP `
    --location $Location `
    --tags Environment=$Environment Application="TwinesAndStraps" ManagedBy="Bicep" `
    --output none

Write-Success "Resource group created/updated: $RESOURCE_GROUP"

# Deploy infrastructure
Write-Info "Deploying infrastructure..."

$deploymentName = "deploy-${Environment}-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Build parameters
$params = @(
    "environment=$Environment",
    "location=$Location",
    "postgresAdminLogin=$POSTGRES_ADMIN_LOGIN",
    "postgresAdminPassword=$POSTGRES_ADMIN_PASSWORD",
    "adminPassword=$ADMIN_PASSWORD"
)

if ($AZURE_AI_ENDPOINT) {
    $params += "azureAiEndpoint=$AZURE_AI_ENDPOINT"
    $params += "azureAiApiKey=$AZURE_AI_API_KEY"
    $params += "azureAiDeploymentName=$AZURE_AI_DEPLOYMENT"
}

$bicepFile = Join-Path $BICEP_DIR "main.bicep"

Write-Info "Running deployment: $deploymentName"
$deploymentResult = az deployment group create `
    --name $deploymentName `
    --resource-group $RESOURCE_GROUP `
    --template-file $bicepFile `
    --parameters $params `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    Write-Error $deploymentResult
    exit 1
}

Write-Success "Deployment completed successfully!"

# Get deployment outputs
Write-Info "Retrieving deployment outputs..."

$outputsJson = az deployment group show `
    --name $deploymentName `
    --resource-group $RESOURCE_GROUP `
    --query "properties.outputs" `
    -o json 2>$null

if (-not $outputsJson) {
    Write-Warning "Could not retrieve deployment outputs. Deployment may have failed."
    Write-Warning "Check the deployment status in Azure Portal."
    $WEB_APP_URL = ""
    $WEB_APP_NAME = ""
    $STORAGE_NAME = ""
    $POSTGRES_FQDN = ""
    $KEYVAULT_NAME = ""
} else {
    $outputs = $outputsJson | ConvertFrom-Json

    $WEB_APP_URL = $outputs.webAppUrl.value
    $WEB_APP_NAME = $outputs.webAppName.value
    $STORAGE_NAME = $outputs.storageAccountName.value
    $POSTGRES_FQDN = $outputs.postgresServerFqdn.value
    $KEYVAULT_NAME = $outputs.keyVaultName.value
}

Write-Host ""
Write-Success "=========================================="
Write-Success "Infrastructure deployed successfully!"
Write-Success "=========================================="
Write-Host ""
Write-Host "Resources created:"
Write-Host "  Web App URL:       $WEB_APP_URL"
Write-Host "  Web App Name:      $WEB_APP_NAME"
Write-Host "  Storage Account:   $STORAGE_NAME"
Write-Host "  PostgreSQL Server: $POSTGRES_FQDN"
Write-Host "  Key Vault:         $KEYVAULT_NAME"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run database migrations: .\migrate-db.ps1 $Environment"
Write-Host "  2. Deploy the application:  .\deploy-app.ps1 $Environment"
Write-Host "  3. Seed the database:       npm run seed"
Write-Host ""
Write-Info "GitHub Secrets to configure for CI/CD:"
Write-Host "  AZURE_CREDENTIALS         - Service principal credentials (JSON)"
Write-Host "  AZURE_SUBSCRIPTION_ID     - $Subscription"
$envUpper = $Environment.ToUpper()
Write-Host "  AZURE_RG_${envUpper} - $RESOURCE_GROUP"
Write-Host "  AZURE_WEBAPP_NAME_${envUpper} - $WEB_APP_NAME"
Write-Host ""

