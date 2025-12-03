#!/bin/bash
# =============================================================================
# Database Migration Script
# =============================================================================
# Runs Prisma migrations against the Azure PostgreSQL database
# 
# Prerequisites:
#   - Azure CLI installed and configured (az login)
#   - Infrastructure already deployed
#   - Node.js and npm installed
#
# Usage:
#   ./migrate-db.sh <environment> [--seed]
#
# Examples:
#   ./migrate-db.sh dev
#   ./migrate-db.sh prod --seed
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
RUN_SEED=false

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
    echo "Usage: $0 <environment> [--seed]"
    echo ""
    echo "Arguments:"
    echo "  environment  Required. One of: dev, staging, prod"
    echo "  --seed       Optional. Run database seeding after migrations"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging --seed"
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

# =============================================================================
# Main Script
# =============================================================================

# Check arguments
if [[ $# -lt 1 ]]; then
    show_usage
fi

ENVIRONMENT=$1

# Parse optional flags
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --seed)
            RUN_SEED=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Validate inputs
validate_environment "$ENVIRONMENT"
check_azure_cli

# Resource names
RESOURCE_GROUP="${ENVIRONMENT}-rg-san-tassa"
KEYVAULT_NAME="${ENVIRONMENT}-kv-san-tassa"

log_info "Migration Configuration:"
echo "  Environment:    $ENVIRONMENT"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Key Vault:      $KEYVAULT_NAME"
echo "  Run Seed:       $RUN_SEED"
echo ""

# Get database URL from Key Vault
log_info "Retrieving database URL from Key Vault..."

DATABASE_URL=$(az keyvault secret show \
    --vault-name "$KEYVAULT_NAME" \
    --name "database-url" \
    --query "value" \
    -o tsv 2>/dev/null || echo "")

if [[ -z "$DATABASE_URL" ]]; then
    log_warning "Could not retrieve DATABASE_URL from Key Vault."
    log_info "Constructing DATABASE_URL from PostgreSQL server details..."
    
    # Get PostgreSQL server details
    POSTGRES_SERVER="${ENVIRONMENT}-psql-san-tassa"
    POSTGRES_FQDN=$(az postgres flexible-server show \
        --name "$POSTGRES_SERVER" \
        --resource-group "$RESOURCE_GROUP" \
        --query "fullyQualifiedDomainName" \
        -o tsv)
    
    if [[ -z "$POSTGRES_FQDN" ]]; then
        log_error "Could not find PostgreSQL server: $POSTGRES_SERVER"
        log_error "Make sure the infrastructure is deployed."
        exit 1
    fi
    
    read -p "PostgreSQL admin login: " POSTGRES_LOGIN
    read -s -p "PostgreSQL admin password: " POSTGRES_PASSWORD
    echo ""
    
    DATABASE_URL="postgresql://${POSTGRES_LOGIN}:${POSTGRES_PASSWORD}@${POSTGRES_FQDN}:5432/twinesandstraps?sslmode=require"
fi

log_success "Database URL retrieved"

# Run migrations
log_info "Running database migrations..."
cd "$PROJECT_DIR"

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    log_info "Installing dependencies..."
    npm ci
fi

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# Run migrations
log_info "Applying migrations..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

log_success "Migrations applied successfully!"

# Optionally run seed
if [[ "$RUN_SEED" == "true" ]]; then
    log_info "Running database seed..."
    DATABASE_URL="$DATABASE_URL" npm run seed
    log_success "Database seeded successfully!"
fi

echo ""
log_success "=========================================="
log_success "Database migration completed!"
log_success "=========================================="
echo ""
echo "You can now deploy the application using:"
echo "  ./deploy-app.sh $ENVIRONMENT"
echo ""
