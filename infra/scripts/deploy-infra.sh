#!/bin/bash
# =============================================================================
# Azure Infrastructure Deployment Script
# =============================================================================
# Deploys the Twines and Straps SA infrastructure to Azure
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - Appropriate Azure subscription and permissions
#
# Usage:
#   ./deploy-infra.sh <environment> [location] [subscription-id]
#
# Examples:
#   ./deploy-infra.sh dev
#   ./deploy-infra.sh staging southafricanorth
#   ./deploy-infra.sh prod southafricanorth my-subscription-id
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_LOCATION="southafricanorth"
BASE_NAME="twinesandstraps"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BICEP_DIR="$(dirname "$SCRIPT_DIR")/bicep"

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
    echo "Usage: $0 <environment> [location] [subscription-id]"
    echo ""
    echo "Arguments:"
    echo "  environment      Required. One of: dev, staging, prod"
    echo "  location         Optional. Azure region (default: ${DEFAULT_LOCATION})"
    echo "  subscription-id  Optional. Azure subscription ID"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging southafricanorth"
    echo "  $0 prod southafricanorth xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    exit 1
}

validate_environment() {
    local env=$1
    if [[ ! "$env" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Invalid environment: $env"
        log_error "Must be one of: dev, staging, prod"
        exit 1
    fi
}

check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed."
        log_error "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure CLI."
        log_error "Run 'az login' to authenticate."
        exit 1
    fi
}

check_bicep() {
    if ! az bicep version &> /dev/null; then
        log_warning "Bicep CLI not found. Installing..."
        az bicep install
    fi
}

prompt_secrets() {
    local env=$1
    
    echo ""
    log_info "Please provide the following secrets for the $env environment:"
    echo ""
    
    # PostgreSQL admin credentials
    read -p "PostgreSQL admin login: " POSTGRES_ADMIN_LOGIN
    read -s -p "PostgreSQL admin password: " POSTGRES_ADMIN_PASSWORD
    echo ""
    
    # Application admin password
    read -s -p "Application admin password: " ADMIN_PASSWORD
    echo ""
    
    # Optional: Azure AI credentials
    read -p "Azure AI endpoint (optional, press Enter to skip): " AZURE_AI_ENDPOINT
    if [[ -n "$AZURE_AI_ENDPOINT" ]]; then
        read -s -p "Azure AI API key: " AZURE_AI_API_KEY
        echo ""
        read -p "Azure AI deployment name (default: gpt-4o): " AZURE_AI_DEPLOYMENT
        AZURE_AI_DEPLOYMENT="${AZURE_AI_DEPLOYMENT:-gpt-4o}"
    fi
}

# =============================================================================
# Main Script
# =============================================================================

# Check arguments
if [[ $# -lt 1 ]]; then
    show_usage
fi

ENVIRONMENT=$1
LOCATION=${2:-$DEFAULT_LOCATION}
SUBSCRIPTION=${3:-""}

# Validate inputs
validate_environment "$ENVIRONMENT"
check_azure_cli
check_bicep

# Set subscription if provided
if [[ -n "$SUBSCRIPTION" ]]; then
    log_info "Setting subscription to: $SUBSCRIPTION"
    az account set --subscription "$SUBSCRIPTION"
fi

# Get current subscription info
CURRENT_SUB=$(az account show --query "{name:name, id:id}" -o tsv)
log_info "Using Azure subscription: $CURRENT_SUB"

# Resource group name
RESOURCE_GROUP="${ENVIRONMENT}-rg-san-tassa"

log_info "Deployment Configuration:"
echo "  Environment:      $ENVIRONMENT"
echo "  Location:         $LOCATION"
echo "  Resource Group:   $RESOURCE_GROUP"
echo ""

# Prompt for secrets
prompt_secrets "$ENVIRONMENT"

# Create resource group if it doesn't exist
log_info "Creating resource group: $RESOURCE_GROUP"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags Environment="$ENVIRONMENT" Application="TwinesAndStraps" ManagedBy="Bicep" \
    --output none

log_success "Resource group created/updated: $RESOURCE_GROUP"

# Deploy infrastructure
log_info "Deploying infrastructure..."

DEPLOYMENT_NAME="deploy-${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"

DEPLOYMENT_PARAMS=(
    "environment=$ENVIRONMENT"
    "location=$LOCATION"
    "postgresAdminLogin=$POSTGRES_ADMIN_LOGIN"
    "postgresAdminPassword=$POSTGRES_ADMIN_PASSWORD"
    "adminPassword=$ADMIN_PASSWORD"
)

if [[ -n "${AZURE_AI_ENDPOINT:-}" ]]; then
    DEPLOYMENT_PARAMS+=("azureAiEndpoint=$AZURE_AI_ENDPOINT")
    DEPLOYMENT_PARAMS+=("azureAiApiKey=$AZURE_AI_API_KEY")
    DEPLOYMENT_PARAMS+=("azureAiDeploymentName=$AZURE_AI_DEPLOYMENT")
fi

log_info "Running deployment: $DEPLOYMENT_NAME"
if ! az deployment group create \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$BICEP_DIR/main.bicep" \
    --parameters "${DEPLOYMENT_PARAMS[@]}" \
    --output table; then
    log_error "Deployment failed!"
    log_error "Check the deployment status in Azure Portal."
    exit 1
fi

log_success "Deployment completed successfully!"

# Get deployment outputs
log_info "Retrieving deployment outputs..."

OUTPUTS=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.outputs" \
    -o json 2>/dev/null)

if [[ -z "$OUTPUTS" ]]; then
    log_warning "Could not retrieve deployment outputs. Deployment may have failed."
    log_warning "Check the deployment status in Azure Portal."
    WEB_APP_URL=""
    WEB_APP_NAME=""
    STORAGE_NAME=""
    POSTGRES_FQDN=""
    KEYVAULT_NAME=""
else
    WEB_APP_URL=$(echo "$OUTPUTS" | jq -r '.webAppUrl.value')
    WEB_APP_NAME=$(echo "$OUTPUTS" | jq -r '.webAppName.value')
    STORAGE_NAME=$(echo "$OUTPUTS" | jq -r '.storageAccountName.value')
    POSTGRES_FQDN=$(echo "$OUTPUTS" | jq -r '.postgresServerFqdn.value')
    KEYVAULT_NAME=$(echo "$OUTPUTS" | jq -r '.keyVaultName.value')
fi

echo ""
log_success "=========================================="
log_success "Infrastructure deployed successfully!"
log_success "=========================================="
echo ""
echo "Resources created:"
echo "  Web App URL:       $WEB_APP_URL"
echo "  Web App Name:      $WEB_APP_NAME"
echo "  Storage Account:   $STORAGE_NAME"
echo "  PostgreSQL Server: $POSTGRES_FQDN"
echo "  Key Vault:         $KEYVAULT_NAME"
echo ""
echo "Next steps:"
echo "  1. Run database migrations: ./migrate-db.sh $ENVIRONMENT"
echo "  2. Deploy the application:  ./deploy-app.sh $ENVIRONMENT"
echo "  3. Seed the database:       npm run seed"
echo ""
log_info "GitHub Secrets to configure for CI/CD:"
echo "  AZURE_CREDENTIALS         - Service principal credentials (JSON)"
echo "  AZURE_SUBSCRIPTION_ID     - $SUBSCRIPTION"
echo "  AZURE_RG_${ENVIRONMENT^^} - $RESOURCE_GROUP"
echo "  AZURE_WEBAPP_NAME_${ENVIRONMENT^^} - $WEB_APP_NAME"
echo ""
