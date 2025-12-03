# =============================================================================
# Azure Environment Setup Script (PowerShell)
# =============================================================================
# Sets up the initial Azure environment including service principal and
# GitHub secrets for CI/CD
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - GitHub CLI installed and authenticated (gh auth login)
#   - Owner or Contributor role on the Azure subscription
#
# Usage:
#   .\setup-azure.ps1 <subscription-id>
#
# Examples:
#   .\setup-azure.ps1 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId
)

$ErrorActionPreference = "Stop"

# Configuration
$SP_NAME = "sp-twinesandstraps-github"
$GITHUB_REPO = "JustAGhosT/twinesandstraps"

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

function Test-GithubCli {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Warning "GitHub CLI is not installed."
        Write-Warning "Secrets will need to be configured manually."
        return $false
    }
    
    $status = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Not logged in to GitHub CLI."
        Write-Warning "Secrets will need to be configured manually."
        return $false
    }
    
    return $true
}

# =============================================================================
# Main Script
# =============================================================================

Test-AzureCli

Write-Info "Azure Setup Configuration:"
Write-Host "  Subscription:        $SubscriptionId"
Write-Host "  Service Principal:   $SP_NAME"
Write-Host "  GitHub Repository:   $GITHUB_REPO"
Write-Host ""

# Set the subscription
Write-Info "Setting Azure subscription..."
az account set --subscription $SubscriptionId | Out-Null

# Get subscription details
$subName = az account show --query "name" -o tsv
Write-Success "Using subscription: $subName ($SubscriptionId)"

# Check if service principal already exists
Write-Info "Checking for existing service principal..."
$existingSp = az ad sp list --display-name $SP_NAME --query "[0].appId" -o tsv 2>$null

if ($existingSp) {
    Write-Warning "Service principal '$SP_NAME' already exists (App ID: $existingSp)"
    $clientId = $existingSp
    $resetCreds = Read-Host "Do you want to reset the credentials? (y/N)"
    if ($resetCreds -match "^[Yy]$") {
        Write-Info "Resetting service principal credentials..."
        $spCredentialsJson = az ad sp credential reset --id $existingSp --output json
        $spCredentials = $spCredentialsJson | ConvertFrom-Json
    } else {
        Write-Info "Keeping existing credentials. You'll need to use the existing secret."
        $spCredentials = $null
    }
} else {
    # Create service principal without role assignment (we'll do that separately)
    Write-Info "Creating service principal..."
    $spCredentialsJson = az ad sp create-for-rbac --name $SP_NAME --sdk-auth --output json
    $spCredentials = $spCredentialsJson | ConvertFrom-Json
    $clientId = $spCredentials.clientId
    
    # Fallback: get client ID directly from Azure if parsing failed
    if (-not $clientId) {
        $clientId = az ad sp list --display-name $SP_NAME --query "[0].appId" -o tsv
    }
}

# Assign Contributor role to the subscription (if not already assigned)
if ($clientId) {
    Write-Info "Checking/assigning Contributor role to service principal..."
    
    # Ensure subscription is set in context
    az account set --subscription $SubscriptionId | Out-Null
    
    $subscriptionScope = "/subscriptions/$SubscriptionId"
    
    # Check if role assignment already exists
    $roleExists = az role assignment list `
        --assignee $clientId `
        --role "Contributor" `
        --scope $subscriptionScope `
        --subscription $SubscriptionId `
        --query "[].id" -o tsv 2>$null
    
    if (-not $roleExists) {
        Write-Info "Creating Contributor role assignment..."
        $roleOutput = az role assignment create `
            --assignee $clientId `
            --role "Contributor" `
            --scope $subscriptionScope `
            --subscription $SubscriptionId `
            --output json 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Role assignment created successfully"
        } else {
            Write-Warning "Failed to create role assignment automatically."
            Write-Warning ""
            Write-Warning "This may be due to:"
            Write-Warning "  1. Insufficient permissions (need 'Owner' or 'User Access Administrator')"
            Write-Warning ""
            Write-Warning "To assign the role manually, run:"
            Write-Warning "  az role assignment create \`"
            Write-Warning "    --assignee $clientId \`"
            Write-Warning "    --role Contributor \`"
            Write-Warning "    --scope `"/subscriptions/$SubscriptionId`" \`"
            Write-Warning "    --subscription $SubscriptionId"
        }
    } else {
        Write-Success "Role assignment already exists"
    }
}

if ($spCredentials) {
    Write-Success "Service principal configured successfully!"
    
    # Get values from the credentials object
    if (-not $clientId) {
        $clientId = $spCredentials.clientId
    }
    $clientSecret = $spCredentials.clientSecret
    $tenantId = $spCredentials.tenantId
    
    # Fallback: get values from Azure CLI if parsing failed
    if (-not $clientId) {
        $clientId = az ad sp list --display-name $SP_NAME --query "[0].appId" -o tsv
    }
    if (-not $tenantId) {
        $tenantId = az account show --query "tenantId" -o tsv
    }
    
    Write-Host ""
    Write-Info "Service Principal Details:"
    Write-Host "  Client ID:     $clientId"
    Write-Host "  Tenant ID:     $tenantId"
    Write-Host "  Secret:        ********** (hidden for security)"
    Write-Host ""
}

# Configure GitHub secrets
if (Test-GithubCli) {
    Write-Host ""
    $configureGh = Read-Host "Do you want to configure GitHub repository secrets? (Y/n)"
    if ($configureGh -notmatch "^[Nn]$") {
        Write-Info "Configuring GitHub secrets..."
        
        # AZURE_CREDENTIALS (full JSON for azure/login action)
        if ($spCredentials) {
            $spCredentialsJson | gh secret set AZURE_CREDENTIALS --repo $GITHUB_REPO
            Write-Success "Set AZURE_CREDENTIALS secret"
        }
        
        # Individual secrets for flexibility
        gh secret set AZURE_SUBSCRIPTION_ID --repo $GITHUB_REPO --body $SubscriptionId
        Write-Success "Set AZURE_SUBSCRIPTION_ID secret"
        
        if ($clientId) {
            gh secret set AZURE_CLIENT_ID --repo $GITHUB_REPO --body $clientId
            Write-Success "Set AZURE_CLIENT_ID secret"
        }
        
        if ($tenantId) {
            gh secret set AZURE_TENANT_ID --repo $GITHUB_REPO --body $tenantId
            Write-Success "Set AZURE_TENANT_ID secret"
        }
        
        if ($clientSecret) {
            gh secret set AZURE_CLIENT_SECRET --repo $GITHUB_REPO --body $clientSecret
            Write-Success "Set AZURE_CLIENT_SECRET secret"
        }
        
        Write-Success "GitHub secrets configured!"
    }
} else {
    Write-Host ""
    Write-Info "To configure GitHub secrets manually, go to:"
    Write-Host "  https://github.com/$GITHUB_REPO/settings/secrets/actions"
    Write-Host ""
    Write-Host "Add the following secrets:"
    Write-Host "  AZURE_CREDENTIALS      - The full JSON output from service principal creation"
    Write-Host "  AZURE_SUBSCRIPTION_ID  - $SubscriptionId"
    if ($clientId) {
        Write-Host "  AZURE_CLIENT_ID        - $clientId"
        Write-Host "  AZURE_TENANT_ID        - $tenantId"
        Write-Host "  AZURE_CLIENT_SECRET    - (the clientSecret from the JSON)"
    }
}

Write-Host ""
Write-Success "=========================================="
Write-Success "Azure setup completed!"
Write-Success "=========================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Deploy infrastructure: .\deploy-infra.ps1 dev"
Write-Host "  2. Run migrations:        .\migrate-db.ps1 dev"
Write-Host "  3. Deploy application:    .\deploy-app.ps1 dev"
Write-Host ""
Write-Host "For CI/CD, the GitHub Actions workflows are now configured to use"
Write-Host "the AZURE_CREDENTIALS secret for authentication."
Write-Host ""

