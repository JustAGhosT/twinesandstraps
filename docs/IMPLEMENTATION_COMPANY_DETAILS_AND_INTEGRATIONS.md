# Company Details & Product Integration Management Implementation

**Last Updated:** December 2025

## Overview

Successfully implemented comprehensive company details management, supplier provider system, and per-product integration configuration for suppliers and marketplaces with intelligent defaults and a clever admin UI.

---

## ✅ Completed Work

### 1. Extended Company Details in Database

**Prisma Schema Updates:**
- Added to `SiteSetting` model:
  - `company_registration_number` - Company registration (e.g., "2023/123456/07")
  - `tax_number` - SARS tax number
  - `vat_number` - VAT registration number
  - `bbbee_level` - B-BBEE level (e.g., "Level 4")
  - `physical_address` - Full physical address
  - `postal_address` - Postal address (if different)
  - `postal_code`, `city`, `province`, `country` - Address components
  - `bank_name`, `bank_account_number`, `bank_account_type`, `branch_code` - Banking details

**Migration:**
- Created migration: `20251207000002_extend_company_details`
- ✅ Applied successfully

### 2. Supplier Provider System

**Created Supplier Provider Interface:**
- `src/lib/suppliers/provider.interface.ts` - `ISupplierProvider` interface
- Methods: `fetchProducts()`, `getProduct()`, `getInventory()`, `getPricing()`, `placeOrder()`, `getOrderStatus()`

**Provider Implementations:**
- `ManualSupplierProvider` - For manual data entry/CSV import
- `ApiSupplierProvider` - For REST API integrations
- `SupplierProviderFactory` - Factory for managing providers

**Supplier Model Updates:**
- Added `provider_type` field ('manual', 'api', 'csv', 'edi')
- Added `provider_config` JSON field for provider-specific settings

### 3. Product Integration Configuration System

**New Model: `ProductIntegration`**
- Per-product settings for suppliers and marketplaces
- **Pricing Settings:**
  - `price_override` - Override product price
  - `margin_percentage` - Margin to apply
  - `min_price`, `max_price` - Price boundaries
- **Quantity Settings:**
  - `quantity_override` - Override available quantity
  - `min_quantity`, `max_quantity` - Quantity boundaries
  - `reserve_quantity` - Quantity to reserve (not list)
- **Timing Settings:**
  - `lead_time_days` - Override lead time
  - `sync_schedule` - 'realtime', 'hourly', 'daily', 'weekly', 'manual'
  - `next_sync_at` - Calculated next sync time
- **Control Settings:**
  - `auto_sync` - Auto-sync when product changes
  - `sync_on_price_change` - Sync on price updates
  - `sync_on_stock_change` - Sync on stock updates
- **Status:**
  - `is_enabled` - Integration enabled
  - `is_active` - Integration active and syncing
  - `error_message` - Last error if sync failed
  - `last_synced_at` - Last successful sync

### 4. Admin UI - Company Details

**Updated:** `src/app/admin/settings/page.tsx`
- Added "Company Registration & Legal Details" section:
  - Company Registration Number
  - Tax Number
  - VAT Number
  - B-BBEE Level
- Added "Physical & Postal Address" section:
  - Physical Address (textarea)
  - Postal Address (textarea)
  - City, Province, Postal Code, Country
- Added "Banking Details" section:
  - Bank Name
  - Account Number
  - Account Type (dropdown: Cheque, Savings, Current)
  - Branch Code

**Features:**
- All fields show "(modified)" indicator when changed
- Fields are organized in logical sections
- Validation through updated schema

### 5. Admin UI - Product Integration Manager

**Created:** `src/components/admin/ProductIntegrationManager.tsx`

**Features:**
- **Integration List View:**
  - Shows all integrations (suppliers & marketplaces) for a product
  - Status badges (Active, Enabled, Disabled)
  - Quick stats: Price, Sync Schedule, Lead Time
  - Error message display
  - Edit button for each integration

- **Add Integration Modal:**
  - Select integration type (Supplier or Marketplace)
  - Choose from available suppliers/marketplaces
  - Smart defaults applied automatically

- **Edit Integration Modal:**
  - **Enable/Disable Toggle** - Master switch
  - **Pricing Section:**
    - Price Override (optional)
    - Margin Percentage (optional)
    - Min/Max Price boundaries
    - **Effective Price Calculator** - Shows calculated price in real-time
  - **Quantity Section:**
    - Quantity Override (optional)
    - Reserve Quantity (default: 0)
    - Min/Max Quantity boundaries
  - **Sync Settings:**
    - Sync Schedule dropdown
    - Lead Time (days)
    - Auto-sync checkboxes:
      - Auto-sync when product changes
      - Sync on price change
      - Sync on stock change

**Smart Defaults:**
- **Suppliers:**
  - Margin: 30%
  - Auto-sync: Enabled
  - Sync Schedule: Daily
  - Reserve Quantity: 0
- **Marketplaces:**
  - Min Price: 90% of product price
  - Max Price: 110% of product price
  - Auto-sync: Enabled
  - Sync Schedule: Hourly
  - Reserve Quantity: 0

### 6. API Endpoints

**Created:** `src/app/api/admin/products/[id]/integrations/route.ts`
- `GET` - Get all integrations for a product
- `POST` - Create/update product integration
- Validates all fields
- Calculates `next_sync_at` based on schedule
- Returns formatted integration data

**Updated:** `src/app/api/admin/settings/route.ts`
- Extended to handle new company detail fields
- Updated conversion functions (`dbToApiFormat`, `apiToDbFormat`)

**Updated:** `src/app/api/admin/providers/route.ts`
- Added marketplace providers to response
- Added IDs to marketplace providers for integration management

**Updated:** `src/app/api/admin/suppliers/route.ts`
- Returns both `data` and `suppliers` for compatibility

### 7. Product Edit Page Integration

**Updated:** `src/app/admin/products/[id]/page.tsx`
- Added `ProductIntegrationManager` component
- Only shows for existing products (not new)
- Tracks product price for integration calculations
- Updates price when form changes

---

## 📊 Smart Defaults Summary

### Supplier Integrations

| Setting              | Default   | Rationale                      |
| -------------------- | --------- | ------------------------------ |
| Margin Percentage    | 30%       | Standard markup for B2B        |
| Auto Sync            | ✅ Enabled | Keep inventory current         |
| Sync Schedule        | Daily     | Balance freshness vs API calls |
| Sync on Price Change | ✅ Enabled | Price changes are important    |
| Sync on Stock Change | ✅ Enabled | Stock changes are critical     |
| Reserve Quantity     | 0         | No reserve by default          |

### Marketplace Integrations

| Setting              | Default         | Rationale                             |
| -------------------- | --------------- | ------------------------------------- |
| Min Price            | 90% of product  | Allow slight discount for marketplace |
| Max Price            | 110% of product | Allow premium pricing                 |
| Auto Sync            | ✅ Enabled       | Keep listings current                 |
| Sync Schedule        | Hourly          | Marketplaces need frequent updates    |
| Sync on Price Change | ✅ Enabled       | Price competitiveness                 |
| Sync on Stock Change | ✅ Enabled       | Avoid overselling                     |
| Reserve Quantity     | 0               | No reserve by default                 |

---

## 🎯 Usage Examples

### Adding a Supplier Integration

1. Navigate to product edit page (`/admin/products/[id]`)
2. Scroll to "Product Integrations" section
3. Click "+ Add Integration"
4. Select "Supplier"
5. Choose supplier from list
6. Configure settings (or use defaults)
7. Enable integration
8. Save

### Adding a Marketplace Integration

1. Navigate to product edit page
2. Click "+ Add Integration"
3. Select "Marketplace"
4. Choose marketplace (Takealot, Google Shopping, Facebook)
5. Review smart defaults (min/max price calculated automatically)
6. Adjust if needed
7. Enable integration
8. Save

### Price Calculation Logic

The system calculates effective price in this order:
1. If `priceOverride` is set → Use override
2. If `marginPercentage` is set → Calculate: `productPrice * (1 + margin / 100)`
3. Otherwise → Use product price

**Example:**
- Product Price: R100
- Margin: 30%
- Effective Price: R130

If `priceOverride` is R125, effective price is R125 (override takes precedence).

---

## 📝 Files Created/Modified

### New Files

**Database:**
- `prisma/migrations/20251207000002_extend_company_details/migration.sql`

**Suppliers:**
- `src/lib/suppliers/provider.interface.ts`
- `src/lib/suppliers/providers/manual.provider.ts`
- `src/lib/suppliers/providers/api.provider.ts`
- `src/lib/suppliers/provider.factory.ts`

**Product Integrations:**
- `src/components/admin/ProductIntegrationManager.tsx`
- `src/app/api/admin/products/[id]/integrations/route.ts`

### Modified Files

- `prisma/schema.prisma` - Extended SiteSetting, Supplier, added ProductIntegration
- `src/app/admin/settings/page.tsx` - Added company details sections
- `src/app/api/admin/settings/route.ts` - Extended to handle new fields
- `src/app/admin/products/[id]/page.tsx` - Added ProductIntegrationManager
- `src/lib/validations.ts` - Extended siteSettingsSchema
- `src/app/api/admin/providers/route.ts` - Added marketplace with IDs
- `src/app/api/admin/suppliers/route.ts` - Added data field for compatibility

---

## 🔧 Configuration

### Environment Variables

No new environment variables required for basic functionality. Supplier API providers would need:
- `SUPPLIER_[NAME]_API_URL`
- `SUPPLIER_[NAME]_API_KEY`

---

## ✅ Next Steps

1. **Test Company Details:**
   - Navigate to `/admin/settings`
   - Fill in company registration, tax, banking details
   - Verify data persists

2. **Test Product Integrations:**
   - Navigate to a product edit page
   - Add supplier integration
   - Add marketplace integration
   - Test price calculations
   - Test sync schedules

3. **Implement Sync Jobs:**
   - Create cron job to process `next_sync_at` integrations
   - Implement sync logic for each integration type
   - Handle errors and update `error_message`

4. **Add CSV/EDI Suppliers:**
   - Implement `CsvSupplierProvider`
   - Implement `EdiSupplierProvider`
   - Add file upload/processing UI

5. **Bulk Integration Management:**
   - Add bulk enable/disable for multiple products
   - Add bulk sync trigger
   - Add integration health dashboard

---

## 📚 References

- **Product Integration Manager:** `src/components/admin/ProductIntegrationManager.tsx`
- **Integration API:** `src/app/api/admin/products/[id]/integrations/route.ts`
- **Supplier Providers:** `src/lib/suppliers/`
- **Company Settings:** `src/app/admin/settings/page.tsx`

