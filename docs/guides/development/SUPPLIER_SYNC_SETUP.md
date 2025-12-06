# Supplier Inventory Sync Setup

**Last Updated:** December 2025

---

## Overview

Automated daily inventory sync from supplier APIs to keep stock levels and prices up to date.

---

## Configuration

### Cron Job Setup

A daily cron job is configured to sync all active suppliers:

**Endpoint:** `/api/cron/inventory-sync`  
**Method:** GET  
**Authentication:** Bearer token with `CRON_SECRET`

### Environment Variables

- `CRON_SECRET` - Secret token for cron endpoint authentication

---

## Implementation

### Automatic Sync

The sync runs daily via Azure Functions or scheduled job:

1. Fetches products from all active suppliers
2. Updates existing products with new stock levels and prices
3. Creates new products (if category mapping exists)
4. Tracks all changes via InventoryEvent model

### Manual Sync

Admins can trigger sync via:

**POST** `/api/admin/inventory/sync-suppliers`

**Body:**
```json
{
  "supplierId": 1  // Optional - omit to sync all suppliers
}
```

---

## Supplier API Integration

To integrate with a specific supplier:

1. Create a supplier-specific fetcher function
2. Add it to `syncAllSuppliers()` function
3. Map supplier product format to `SupplierProduct` interface

**Example:**
```typescript
async function fetchProductsFromSupplier(supplier: Supplier): Promise<SupplierProduct[]> {
  // Implement supplier-specific API call
  const response = await fetch(supplier.api_endpoint, {
    headers: { 'Authorization': `Bearer ${supplier.api_key}` },
  });
  
  const data = await response.json();
  
  // Map to SupplierProduct format
  return data.products.map((p: any) => ({
    supplier_sku: p.sku,
    name: p.name,
    price: p.price,
    stock_quantity: p.stock,
    // ... other fields
  }));
}
```

---

## Discrepancy Handling

When sync conflicts occur (local vs supplier values):

1. **Accept Supplier** - Override local values with supplier data
2. **Keep Local** - Maintain current local values
3. **Manual Adjust** - Set custom value

Access via admin dashboard (to be implemented).

---

## Sync Logs

View sync history via:

**GET** `/api/admin/inventory/sync-logs?supplierId=1`

Returns recent inventory events from supplier syncs.

---

**Last Updated:** December 2025

