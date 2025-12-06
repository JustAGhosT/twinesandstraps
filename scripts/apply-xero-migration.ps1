# Apply Xero Models Migration
# This script applies the XeroToken and XeroInvoiceMapping migration

Write-Host "Applying Xero models migration..." -ForegroundColor Cyan

# Check migration status first
Write-Host "`nChecking migration status..." -ForegroundColor Yellow
npx dotenv-cli -e .env -- npx prisma migrate status

# Confirm before applying
Write-Host "`nReady to apply migration: 20251206030000_add_xero_models" -ForegroundColor Yellow
Write-Host "This will create:" -ForegroundColor Yellow
Write-Host "  - XeroToken table" -ForegroundColor Gray
Write-Host "  - XeroInvoiceMapping table" -ForegroundColor Gray
Write-Host "  - Required indexes and constraints" -ForegroundColor Gray

$confirm = Read-Host "`nContinue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Migration cancelled." -ForegroundColor Red
    exit
}

# Apply migration
Write-Host "`nApplying migration..." -ForegroundColor Cyan
npx dotenv-cli -e .env -- npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migration applied successfully!" -ForegroundColor Green
    
    # Verify migration status
    Write-Host "`nVerifying migration status..." -ForegroundColor Yellow
    npx dotenv-cli -e .env -- npx prisma migrate status
    
    Write-Host "`n✅ Xero models migration complete!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Test Xero OAuth connection" -ForegroundColor Gray
    Write-Host "  2. Test invoice syncing" -ForegroundColor Gray
    Write-Host "  3. Test payment syncing" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Migration failed. Please check the error above." -ForegroundColor Red
    Write-Host "`nSee: docs/guides/deployment/APPLY_XERO_MIGRATION.md for troubleshooting" -ForegroundColor Yellow
    exit 1
}

