#!/bin/bash
# =============================================================================
# GitHub Secrets and Variables Setup Script
# =============================================================================
# Configures GitHub repository secrets and variables required for CI/CD
# 
# Prerequisites:
#   - GitHub CLI installed and authenticated (gh auth login)
#   - Access to the repository
#
# Usage:
#   ./setup-github-secrets.sh
#
# This script will prompt for:
#   - Azure credentials (from setup-azure.sh output or manually)
#   - PostgreSQL admin credentials
#   - Application admin password
#   - WhatsApp number (optional)
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="JustAGhosT/twinesandstraps"

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed."
        log_info "Install it from: https://cli.github.com/"
        exit 1
    fi
    
    # Check if GITHUB_TOKEN is set as environment variable
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        log_info "GITHUB_TOKEN environment variable is set"
        # Test if the token works
        if gh api user &> /dev/null; then
            log_success "GitHub CLI is authenticated via GITHUB_TOKEN"
            return 0
        else
            log_warning "GITHUB_TOKEN environment variable is set but may be invalid"
        fi
    fi
    
    # Check standard authentication
    if gh auth status &> /dev/null; then
        log_success "GitHub CLI is installed and authenticated"
        return 0
    fi
    
    # If we get here, authentication failed
    log_error "GitHub CLI is not authenticated."
    log_info "You can authenticate in one of these ways:"
    log_info "  1. Run: gh auth login"
    log_info "  2. Set GITHUB_TOKEN environment variable: export GITHUB_TOKEN='your-token'"
    log_info "  3. If GITHUB_TOKEN is already set, verify it's valid: gh api user"
    exit 1
}

# =============================================================================
# Main Script
# =============================================================================

log_info "GitHub Secrets and Variables Setup"
log_info "Repository: $GITHUB_REPO"
echo ""

check_gh_cli

echo ""
log_info "This script will help you configure GitHub secrets and variables."
log_info "You can skip any secret by pressing Enter (you can set it later)."
echo ""

# Azure Credentials
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Azure Credentials"
echo ""

# Try to automatically retrieve Azure credentials
azure_creds=""
subscription_id=""
SP_NAME="sp-twinesandstraps-github"

# Check if Azure CLI is available
if command -v az &> /dev/null; then
    log_info "Azure CLI detected. Attempting to retrieve credentials automatically..."
    
    # Check if logged in to Azure
    if az account show &> /dev/null; then
        subscription_id=$(az account show --query "id" -o tsv)
        tenant_id=$(az account show --query "tenantId" -o tsv)
        
        # Check if service principal exists
        existing_sp=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")
        
        if [[ -n "$existing_sp" ]]; then
            log_info "Found existing service principal: $existing_sp"
            read -p "Do you want to reset credentials to get a new secret? (y/N): " reset_creds
            
            if [[ "$reset_creds" =~ ^[Yy]$ ]]; then
                log_info "Resetting service principal credentials..."
                # Reset credentials (without --sdk-auth as it's not supported for reset)
                reset_output=$(az ad sp credential reset --id "$existing_sp" --output json 2>&1)
                
                if [[ $? -eq 0 ]]; then
                    # Parse the reset output to get the password
                    client_secret=$(echo "$reset_output" | grep -o '"password"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"password"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
                    
                    # Get additional info we need
                    sp_info=$(az ad sp show --id "$existing_sp" --query "{appId:appId, tenantId:appOwnerTenantId}" -o json)
                    client_id=$(echo "$sp_info" | grep -o '"appId"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"appId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
                    
                    # Construct AZURE_CREDENTIALS JSON in the format expected by azure/login@v2
                    azure_creds=$(cat <<EOF
{
  "clientId": "$client_id",
  "clientSecret": "$client_secret",
  "subscriptionId": "$subscription_id",
  "tenantId": "$tenant_id"
}
EOF
)
                    
                    log_success "Retrieved Azure credentials automatically"
                else
                    log_warning "Failed to reset credentials: $reset_output"
                    log_warning "You'll need to enter them manually."
                fi
            else
                log_warning "Cannot retrieve existing secret. You'll need to enter it manually or reset credentials."
            fi
        else
            log_info "Service principal '$SP_NAME' not found."
            log_info "Run setup-azure.sh first to create it, or enter credentials manually."
        fi
    else
        log_warning "Not logged in to Azure CLI. Run 'az login' first."
    fi
else
    log_info "Azure CLI not found. You'll need to enter credentials manually."
fi

echo ""

# Prompt for Azure credentials if not automatically retrieved
if [[ -z "${azure_creds:-}" ]]; then
    log_info "If you ran setup-azure.sh, you can find AZURE_CREDENTIALS in its output."
    log_info "Otherwise, you can create it manually from your service principal."
    echo ""
    read -p "Enter AZURE_CREDENTIALS (JSON, or press Enter to skip): " azure_creds
fi

if [[ -n "${azure_creds:-}" ]]; then
    echo "$azure_creds" | gh secret set AZURE_CREDENTIALS --repo "$GITHUB_REPO"
    log_success "Set AZURE_CREDENTIALS secret"
else
    log_warning "Skipped AZURE_CREDENTIALS (set it manually later)"
fi

# Prompt for subscription ID if not automatically retrieved
if [[ -z "${subscription_id:-}" ]]; then
    read -p "Enter AZURE_SUBSCRIPTION_ID (or press Enter to skip): " subscription_id
fi

if [[ -n "${subscription_id:-}" ]]; then
    echo -n "$subscription_id" | gh secret set AZURE_SUBSCRIPTION_ID --repo "$GITHUB_REPO"
    log_success "Set AZURE_SUBSCRIPTION_ID secret"
else
    log_warning "Skipped AZURE_SUBSCRIPTION_ID (set it manually later)"
fi

# PostgreSQL Credentials
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "PostgreSQL Credentials"
echo ""
read -p "Enter POSTGRES_ADMIN_LOGIN (or press Enter to skip): " postgres_login
if [[ -n "${postgres_login:-}" ]]; then
    echo -n "$postgres_login" | gh secret set POSTGRES_ADMIN_LOGIN --repo "$GITHUB_REPO"
    log_success "Set POSTGRES_ADMIN_LOGIN secret"
else
    log_warning "Skipped POSTGRES_ADMIN_LOGIN (set it manually later)"
fi

read -sp "Enter POSTGRES_ADMIN_PASSWORD (or press Enter to skip): " postgres_password
echo ""
if [[ -n "${postgres_password:-}" ]]; then
    echo -n "$postgres_password" | gh secret set POSTGRES_ADMIN_PASSWORD --repo "$GITHUB_REPO"
    log_success "Set POSTGRES_ADMIN_PASSWORD secret"
else
    log_warning "Skipped POSTGRES_ADMIN_PASSWORD (set it manually later)"
fi

# Application Admin Password
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Application Admin Password"
echo ""
read -sp "Enter ADMIN_PASSWORD (or press Enter to skip): " admin_password
echo ""
if [[ -n "${admin_password:-}" ]]; then
    echo -n "$admin_password" | gh secret set ADMIN_PASSWORD --repo "$GITHUB_REPO"
    log_success "Set ADMIN_PASSWORD secret"
else
    log_warning "Skipped ADMIN_PASSWORD (set it manually later)"
fi

# WhatsApp Number (Variable, not secret)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "WhatsApp Number (Variable)"
echo ""
log_info "This is stored as a variable (not a secret) since it's not sensitive."
read -p "Enter WHATSAPP_NUMBER (or press Enter to skip): " whatsapp_number
if [[ -n "${whatsapp_number:-}" ]]; then
    gh variable set WHATSAPP_NUMBER --body "$whatsapp_number" --repo "$GITHUB_REPO"
    log_success "Set WHATSAPP_NUMBER variable"
else
    log_warning "Skipped WHATSAPP_NUMBER (set it manually later)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Setup complete!"
echo ""
log_info "Configured secrets/variables:"
echo "  Secrets:"
echo "    - AZURE_CREDENTIALS"
echo "    - AZURE_SUBSCRIPTION_ID"
echo "    - POSTGRES_ADMIN_LOGIN"
echo "    - POSTGRES_ADMIN_PASSWORD"
echo "    - ADMIN_PASSWORD"
echo "  Variables:"
echo "    - WHATSAPP_NUMBER"
echo ""
log_info "To view or update secrets/variables:"
log_info "  GitHub → Settings → Secrets and variables → Actions"
echo ""

