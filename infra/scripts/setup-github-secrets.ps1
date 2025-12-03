# =============================================================================
# GitHub Secrets and Variables Setup Script (PowerShell)
# =============================================================================
# Configures GitHub repository secrets and variables required for CI/CD
# 
# Prerequisites:
#   - GitHub CLI installed and authenticated (gh auth login)
#   - Access to the repository
#
# Usage:
#   .\setup-github-secrets.ps1
#
# This script will prompt for:
#   - Azure credentials (from setup-azure.ps1 output or manually)
#   - PostgreSQL admin credentials
#   - Application admin password
#   - WhatsApp number (optional)
# =============================================================================

$ErrorActionPreference = "Stop"

# Configuration
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

function Test-GitHubCLI {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Error "GitHub CLI (gh) is not installed."
        Write-Info "Install it from: https://cli.github.com/"
        exit 1
    }
    
    # Check if GITHUB_TOKEN is set as environment variable
    if ($env:GITHUB_TOKEN) {
        Write-Info "GITHUB_TOKEN environment variable is set"
        Write-Info "Testing token validity..."
        # Test if the token works
        $testResult = gh api user 2>&1
        $testExitCode = $LASTEXITCODE
        if ($testExitCode -eq 0) {
            Write-Success "GitHub CLI is authenticated via GITHUB_TOKEN"
            return
        } else {
            Write-Warning "GITHUB_TOKEN environment variable is set but appears to be invalid or expired"
            Write-Info "Token test result: $testResult"
            Write-Info ""
            Write-Info "To fix this, you can:"
            Write-Info "  1. Clear the token and use gh auth login:"
            Write-Info "     Remove-Item Env:\GITHUB_TOKEN"
            Write-Info "     gh auth login"
            Write-Info "  2. Or set a new valid token:"
            Write-Info "     `$env:GITHUB_TOKEN = 'your-valid-token'"
            Write-Info ""
            Write-Info "Note: If you want to use gh auth login instead of GITHUB_TOKEN,"
            Write-Info "you need to clear the environment variable first."
            exit 1
        }
    }
    
    # Check standard authentication
    $authResult = gh auth status 2>&1
    $authExitCode = $LASTEXITCODE
    if ($authExitCode -eq 0) {
        Write-Success "GitHub CLI is installed and authenticated"
        return
    }
    
    # If we get here, authentication failed
    Write-Error "GitHub CLI is not authenticated."
    Write-Info "You can authenticate in one of these ways:"
    Write-Info "  1. Run: gh auth login"
    Write-Info "  2. Set GITHUB_TOKEN environment variable: `$env:GITHUB_TOKEN = 'your-token'"
    exit 1
}

# =============================================================================
# Main Script
# =============================================================================

Write-Info "GitHub Secrets and Variables Setup"
Write-Info "Repository: $GITHUB_REPO"
Write-Host ""

Test-GitHubCLI

Write-Host ""
Write-Info "This script will help you configure GitHub secrets and variables."
Write-Info "You can skip any secret by pressing Enter (you can set it later)."
Write-Host ""

# Azure Credentials
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "Azure Credentials"
Write-Host ""

# Try to automatically retrieve Azure credentials
$azureCreds = $null
$subscriptionId = $null
$SP_NAME = "sp-twinesandstraps-github"

# Check if Azure CLI is available
if (Get-Command az -ErrorAction SilentlyContinue) {
    Write-Info "Azure CLI detected. Attempting to retrieve credentials automatically..."
    
    try {
        # Check if logged in to Azure
        $azAccount = az account show 2>&1
        if ($LASTEXITCODE -eq 0) {
            $subscriptionId = az account show --query "id" -o tsv
            $tenantId = az account show --query "tenantId" -o tsv
            
            # Check if service principal exists
            $existingSp = az ad sp list --display-name $SP_NAME --query "[0].appId" -o tsv 2>$null
            
            if ($existingSp) {
                Write-Info "Found existing service principal: $existingSp"
                $resetCreds = Read-Host "Do you want to reset credentials to get a new secret? (y/N)"
                
                if ($resetCreds -match "^[Yy]$") {
                    Write-Info "Resetting service principal credentials..."
                    # Reset credentials (without --sdk-auth as it's not supported for reset)
                    # Use a temp file to capture clean JSON output
                    $tempFile = [System.IO.Path]::GetTempFileName()
                    try {
                        az ad sp credential reset --id $existingSp --output json 2>$null | Out-File -FilePath $tempFile -Encoding utf8
                        
                        if ($LASTEXITCODE -eq 0) {
                            $resetOutput = Get-Content -Path $tempFile -Raw
                            
                            # Try to parse JSON
                            try {
                                $resetCredsObj = $resetOutput | ConvertFrom-Json
                                $clientSecret = $resetCredsObj.password
                                
                                if (-not $clientSecret) {
                                    throw "Password not found in reset output"
                                }
                                
                                # Get additional info we need
                                $spInfoJson = az ad sp show --id $existingSp --query "{appId:appId, tenantId:appOwnerTenantId}" -o json 2>$null
                                if ($spInfoJson) {
                                    $spInfo = $spInfoJson | ConvertFrom-Json
                                    
                                    # Construct AZURE_CREDENTIALS JSON in the format expected by azure/login@v2
                                    $azureCredsObj = @{
                                        clientId = $spInfo.appId
                                        clientSecret = $clientSecret
                                        subscriptionId = $subscriptionId
                                        tenantId = $tenantId
                                    }
                                    
                                    # Convert to JSON string
                                    $azureCreds = $azureCredsObj | ConvertTo-Json -Compress
                                    
                                    Write-Success "Retrieved Azure credentials automatically"
                                } else {
                                    throw "Could not retrieve service principal info"
                                }
                            } catch {
                                Write-Warning "Failed to parse credentials: $_"
                                Write-Warning "You'll need to enter them manually."
                            }
                        } else {
                            Write-Warning "Failed to reset credentials (exit code: $LASTEXITCODE)"
                            Write-Warning "You'll need to enter them manually."
                        }
                    } finally {
                        # Clean up temp file
                        if (Test-Path $tempFile) {
                            Remove-Item $tempFile -Force
                        }
                    }
                } else {
                    Write-Warning "Cannot retrieve existing secret. You'll need to enter it manually or reset credentials."
                }
            } else {
                Write-Info "Service principal '$SP_NAME' not found."
                Write-Info "Run setup-azure.ps1 first to create it, or enter credentials manually."
            }
        } else {
            Write-Warning "Not logged in to Azure CLI. Run 'az login' first."
        }
    } catch {
        Write-Warning "Could not automatically retrieve Azure credentials: $_"
    }
} else {
    Write-Info "Azure CLI not found. You'll need to enter credentials manually."
}

Write-Host ""

# Prompt for Azure credentials if not automatically retrieved
if (-not $azureCreds) {
    Write-Info "If you ran setup-azure.ps1, you can find AZURE_CREDENTIALS in its output."
    Write-Info "Otherwise, you can create it manually from your service principal."
    Write-Host ""
    $azureCreds = Read-Host "Enter AZURE_CREDENTIALS (JSON, or press Enter to skip)"
}

if ($azureCreds) {
    $azureCreds | gh secret set AZURE_CREDENTIALS --repo $GITHUB_REPO
    Write-Success "Set AZURE_CREDENTIALS secret"
} else {
    Write-Warning "Skipped AZURE_CREDENTIALS (set it manually later)"
}

# Prompt for subscription ID if not automatically retrieved
if (-not $subscriptionId) {
    $subscriptionId = Read-Host "Enter AZURE_SUBSCRIPTION_ID (or press Enter to skip)"
}

if ($subscriptionId) {
    $subscriptionId | gh secret set AZURE_SUBSCRIPTION_ID --repo $GITHUB_REPO
    Write-Success "Set AZURE_SUBSCRIPTION_ID secret"
} else {
    Write-Warning "Skipped AZURE_SUBSCRIPTION_ID (set it manually later)"
}

# PostgreSQL Credentials
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "PostgreSQL Credentials"
Write-Host ""
$postgresLogin = Read-Host "Enter POSTGRES_ADMIN_LOGIN (or press Enter to skip)"
if ($postgresLogin) {
    $postgresLogin | gh secret set POSTGRES_ADMIN_LOGIN --repo $GITHUB_REPO
    Write-Success "Set POSTGRES_ADMIN_LOGIN secret"
} else {
    Write-Warning "Skipped POSTGRES_ADMIN_LOGIN (set it manually later)"
}

$securePostgresPassword = Read-Host "Enter POSTGRES_ADMIN_PASSWORD (or press Enter to skip)" -AsSecureString
if ($securePostgresPassword) {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePostgresPassword)
    $postgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    $postgresPassword | gh secret set POSTGRES_ADMIN_PASSWORD --repo $GITHUB_REPO
    Write-Success "Set POSTGRES_ADMIN_PASSWORD secret"
} else {
    Write-Warning "Skipped POSTGRES_ADMIN_PASSWORD (set it manually later)"
}

# Application Admin Password
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "Application Admin Password"
Write-Host ""
$secureAdminPassword = Read-Host "Enter ADMIN_PASSWORD (or press Enter to skip)" -AsSecureString
if ($secureAdminPassword) {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAdminPassword)
    $adminPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    $adminPassword | gh secret set ADMIN_PASSWORD --repo $GITHUB_REPO
    Write-Success "Set ADMIN_PASSWORD secret"
} else {
    Write-Warning "Skipped ADMIN_PASSWORD (set it manually later)"
}

# WhatsApp Number (Variable, not secret)
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "WhatsApp Number (Variable)"
Write-Host ""
Write-Info "This is stored as a variable (not a secret) since it's not sensitive."
$whatsappNumber = Read-Host "Enter WHATSAPP_NUMBER (or press Enter to skip)"
if ($whatsappNumber) {
    gh variable set WHATSAPP_NUMBER --body $whatsappNumber --repo $GITHUB_REPO
    Write-Success "Set WHATSAPP_NUMBER variable"
} else {
    Write-Warning "Skipped WHATSAPP_NUMBER (set it manually later)"
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "Setup complete!"
Write-Host ""
Write-Info "Configured secrets/variables:"
Write-Host "  Secrets:"
Write-Host "    - AZURE_CREDENTIALS"
Write-Host "    - AZURE_SUBSCRIPTION_ID"
Write-Host "    - POSTGRES_ADMIN_LOGIN"
Write-Host "    - POSTGRES_ADMIN_PASSWORD"
Write-Host "    - ADMIN_PASSWORD"
Write-Host "  Variables:"
Write-Host "    - WHATSAPP_NUMBER"
Write-Host ""
Write-Info "To view or update secrets/variables:"
Write-Info "  GitHub → Settings → Secrets and variables → Actions"
Write-Host ""

