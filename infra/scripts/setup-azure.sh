#!/bin/bash
# =============================================================================
# Azure Environment Setup Script
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
#   ./setup-azure.sh <subscription-id>
#
# Examples:
#   ./setup-azure.sh xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SP_NAME="sp-twinesandstraps-github"
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

show_usage() {
    echo "Usage: $0 <subscription-id>"
    echo ""
    echo "Arguments:"
    echo "  subscription-id  Required. Your Azure subscription ID"
    echo ""
    echo "This script will:"
    echo "  1. Create a service principal for GitHub Actions"
    echo "  2. Assign Contributor role to the service principal"
    echo "  3. Configure GitHub repository secrets"
    echo ""
    exit 1
}

check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed."
        log_error "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure CLI."
        log_error "Run 'az login' to authenticate."
        exit 1
    fi
}

check_github_cli() {
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI is not installed."
        log_warning "Secrets will need to be configured manually."
        return 1
    fi
    
    if ! gh auth status &> /dev/null; then
        log_warning "Not logged in to GitHub CLI."
        log_warning "Secrets will need to be configured manually."
        return 1
    fi
    
    return 0
}

# =============================================================================
# Main Script
# =============================================================================

if [[ $# -lt 1 ]]; then
    show_usage
fi

SUBSCRIPTION_ID=$1

check_azure_cli

log_info "Azure Setup Configuration:"
echo "  Subscription:        $SUBSCRIPTION_ID"
echo "  Service Principal:   $SP_NAME"
echo "  GitHub Repository:   $GITHUB_REPO"
echo ""

# Set the subscription
log_info "Setting Azure subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

# Get subscription details
SUB_NAME=$(az account show --query "name" -o tsv)
log_success "Using subscription: $SUB_NAME ($SUBSCRIPTION_ID)"

# Check if service principal already exists
log_info "Checking for existing service principal..."
EXISTING_SP=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [[ -n "$EXISTING_SP" ]]; then
    log_warning "Service principal '$SP_NAME' already exists (App ID: $EXISTING_SP)"
    read -p "Do you want to reset the credentials? (y/N): " RESET_CREDS
    if [[ "$RESET_CREDS" =~ ^[Yy]$ ]]; then
        log_info "Resetting service principal credentials..."
        SP_CREDENTIALS=$(az ad sp credential reset --id "$EXISTING_SP" --output json)
    else
        log_info "Keeping existing credentials. You'll need to use the existing secret."
        SP_CREDENTIALS=""
    fi
else
    # Create service principal
    log_info "Creating service principal..."
    SP_CREDENTIALS=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --role "Contributor" \
        --scopes "/subscriptions/$SUBSCRIPTION_ID" \
        --sdk-auth \
        --output json)
fi

if [[ -n "$SP_CREDENTIALS" ]]; then
    log_success "Service principal configured successfully!"
    
    # Parse credentials
    CLIENT_ID=$(echo "$SP_CREDENTIALS" | jq -r '.clientId')
    CLIENT_SECRET=$(echo "$SP_CREDENTIALS" | jq -r '.clientSecret')
    TENANT_ID=$(echo "$SP_CREDENTIALS" | jq -r '.tenantId')
    
    echo ""
    log_info "Service Principal Details:"
    echo "  Client ID:     $CLIENT_ID"
    echo "  Tenant ID:     $TENANT_ID"
    echo "  Secret:        ********** (hidden for security)"
    echo ""
fi

# Configure GitHub secrets
if check_github_cli; then
    echo ""
    read -p "Do you want to configure GitHub repository secrets? (Y/n): " CONFIGURE_GH
    if [[ ! "$CONFIGURE_GH" =~ ^[Nn]$ ]]; then
        log_info "Configuring GitHub secrets..."
        
        # AZURE_CREDENTIALS (full JSON for azure/login action)
        if [[ -n "${SP_CREDENTIALS:-}" ]]; then
            echo "$SP_CREDENTIALS" | gh secret set AZURE_CREDENTIALS --repo "$GITHUB_REPO"
            log_success "Set AZURE_CREDENTIALS secret"
        fi
        
        # Individual secrets for flexibility
        gh secret set AZURE_SUBSCRIPTION_ID --repo "$GITHUB_REPO" --body "$SUBSCRIPTION_ID"
        log_success "Set AZURE_SUBSCRIPTION_ID secret"
        
        if [[ -n "${CLIENT_ID:-}" ]]; then
            gh secret set AZURE_CLIENT_ID --repo "$GITHUB_REPO" --body "$CLIENT_ID"
            log_success "Set AZURE_CLIENT_ID secret"
        fi
        
        if [[ -n "${TENANT_ID:-}" ]]; then
            gh secret set AZURE_TENANT_ID --repo "$GITHUB_REPO" --body "$TENANT_ID"
            log_success "Set AZURE_TENANT_ID secret"
        fi
        
        if [[ -n "${CLIENT_SECRET:-}" ]]; then
            gh secret set AZURE_CLIENT_SECRET --repo "$GITHUB_REPO" --body "$CLIENT_SECRET"
            log_success "Set AZURE_CLIENT_SECRET secret"
        fi
        
        log_success "GitHub secrets configured!"
    fi
else
    echo ""
    log_info "To configure GitHub secrets manually, go to:"
    echo "  https://github.com/$GITHUB_REPO/settings/secrets/actions"
    echo ""
    echo "Add the following secrets:"
    echo "  AZURE_CREDENTIALS      - The full JSON output from service principal creation"
    echo "  AZURE_SUBSCRIPTION_ID  - $SUBSCRIPTION_ID"
    if [[ -n "${CLIENT_ID:-}" ]]; then
        echo "  AZURE_CLIENT_ID        - $CLIENT_ID"
        echo "  AZURE_TENANT_ID        - $TENANT_ID"
        echo "  AZURE_CLIENT_SECRET    - (the clientSecret from the JSON)"
    fi
fi

echo ""
log_success "=========================================="
log_success "Azure setup completed!"
log_success "=========================================="
echo ""
echo "Next steps:"
echo "  1. Deploy infrastructure: ./deploy-infra.sh dev"
echo "  2. Run migrations:        ./migrate-db.sh dev"
echo "  3. Deploy application:    ./deploy-app.sh dev"
echo ""
echo "For CI/CD, the GitHub Actions workflows are now configured to use"
echo "the AZURE_CREDENTIALS secret for authentication."
echo ""
