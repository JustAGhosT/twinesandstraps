#!/bin/bash
# =============================================================================
# Application Deployment Script
# =============================================================================
# Deploys the Next.js application to Azure App Service
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - Infrastructure already deployed (run deploy-infra.sh first)
#   - Node.js and npm installed
#
# Usage:
#   ./deploy-app.sh <environment>
#
# Examples:
#   ./deploy-app.sh dev
#   ./deploy-app.sh prod
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_NAME="twinesandstraps"

# Script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

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
    echo "Usage: $0 <environment>"
    echo ""
    echo "Arguments:"
    echo "  environment  Required. One of: dev, staging, prod"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 prod"
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
        exit 1
    fi
    
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure CLI. Run 'az login' to authenticate."
        exit 1
    fi
}

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
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

# Validate inputs
validate_environment "$ENVIRONMENT"
check_azure_cli
check_node

# Resource names
RESOURCE_GROUP="rg-${BASE_NAME}-${ENVIRONMENT}"
WEB_APP_NAME="app-${BASE_NAME}-${ENVIRONMENT}"

log_info "Deployment Configuration:"
echo "  Environment:    $ENVIRONMENT"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Web App:        $WEB_APP_NAME"
echo "  Project Dir:    $PROJECT_DIR"
echo ""

# Verify the web app exists
log_info "Verifying web app exists..."
if ! az webapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    log_error "Web app '$WEB_APP_NAME' not found in resource group '$RESOURCE_GROUP'"
    log_error "Run deploy-infra.sh first to create the infrastructure."
    exit 1
fi

log_success "Web app found: $WEB_APP_NAME"

# Build the application
log_info "Building the application..."
cd "$PROJECT_DIR"

# Install dependencies
log_info "Installing dependencies..."
npm ci

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# Build Next.js
log_info "Building Next.js application..."
npm run build

log_success "Build completed successfully!"

# Create deployment package
log_info "Creating deployment package..."

DEPLOY_DIR="/tmp/twinesandstraps-deploy-$$"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r .next "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"
cp -r node_modules "$DEPLOY_DIR/"
cp -r prisma "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp next.config.js "$DEPLOY_DIR/"

# Create zip for deployment
log_info "Creating deployment zip..."
cd "$DEPLOY_DIR"
zip -r deploy.zip . -x "*.git*" > /dev/null 2>&1

log_success "Deployment package created"

# Deploy to Azure
log_info "Deploying to Azure App Service..."

az webapp deployment source config-zip \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --src "$DEPLOY_DIR/deploy.zip" \
    --timeout 600

# Clean up
log_info "Cleaning up temporary files..."
rm -rf "$DEPLOY_DIR"

# Get the web app URL
WEB_APP_URL=$(az webapp show \
    --name "$WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostName" \
    -o tsv)

echo ""
log_success "=========================================="
log_success "Application deployed successfully!"
log_success "=========================================="
echo ""
echo "Application URL: https://$WEB_APP_URL"
echo ""
echo "Next steps:"
echo "  1. Verify the application at: https://$WEB_APP_URL"
echo "  2. Check Application Insights for monitoring"
echo "  3. Run health check: curl https://$WEB_APP_URL/api/health"
echo ""

# Run health check
log_info "Running health check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$WEB_APP_URL/api/health" || echo "000")

if [[ "$HEALTH_STATUS" == "200" ]]; then
    log_success "Health check passed! (HTTP $HEALTH_STATUS)"
else
    log_warning "Health check returned HTTP $HEALTH_STATUS"
    log_warning "The app may still be starting up. Wait a moment and try again."
fi
