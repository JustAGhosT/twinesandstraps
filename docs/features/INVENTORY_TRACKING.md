# Inventory Movement Tracking

**Last Updated:** December 2024  
**Status:** ✅ Complete

---

## Overview

The Inventory Movement Tracking system provides a complete audit trail for all stock changes in the system. Every stock addition, removal, adjustment, and status change is automatically recorded with timestamps, user information, and context.

---

## Features

### ✅ Automatic Tracking

The system automatically tracks:
- **Order Fulfillment** - Stock removed when orders are fulfilled
- **Stock Status Changes** - When products move between IN_STOCK, LOW_STOCK, OUT_OF_STOCK
- **Supplier Deliveries** - Stock additions from suppliers (via API)
- **Manual Adjustments** - Admin-initiated stock changes

### ✅ Event Types

- `STOCK_ADDED` - Stock was added
- `STOCK_REMOVED` - Stock was removed
- `STOCK_ADJUSTED` - Stock quantity was adjusted
- `SUPPLIER_DELIVERY` - Stock added from supplier
- `ORDER_FULFILLMENT` - Stock removed for order
- `MANUAL_ADJUSTMENT` - Manual stock adjustment by admin
- `STOCK_STATUS_CHANGE` - Stock status changed (e.g., IN_STOCK → OUT_OF_STOCK)

### ✅ Reference Types

- `ORDER` - Related to an order
- `SUPPLIER_DELIVERY` - Related to supplier delivery
- `MANUAL` - Manual admin action
- `SYSTEM` - System-generated event

---

## Database Schema

### InventoryEvent Model

```prisma
model InventoryEvent {
  id              Int      @id @default(autoincrement())
  product_id      Int
  event_type      String
  quantity_change Int      // Positive for additions, negative for removals
  quantity_before Int?
  quantity_after  Int?
  reference_type  String?
  reference_id    Int?
  notes           String?
  created_by_user_id Int?
  created_at      DateTime @default(now())

  product Product @relation(fields: [product_id], references: [id], onDelete: Cascade)

  @@index([product_id])
  @@index([event_type])
  @@index([reference_type, reference_id])
  @@index([created_at])
}
```

---

## API Endpoints

### Get Inventory History

```
GET /api/admin/inventory/history
```

**Query Parameters:**
- `productId` (optional) - Filter by specific product
- `eventType` (optional) - Filter by event type
- `referenceType` (optional) - Filter by reference type
- `startDate` (optional) - Start date filter (ISO format)
- `endDate` (optional) - End date filter (ISO format)
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "events": [...],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### Record Supplier Delivery

```
POST /api/admin/inventory/supplier-delivery
```

**Request Body:**
```json
{
  "productId": 123,
  "quantity": 100,
  "supplierId": 5,
  "notes": "Delivery from ABC Supplier"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Supplier delivery recorded successfully"
}
```

---

## Admin Interface

### Inventory History Page

**Location:** `/admin/inventory`

**Features:**
- View all inventory movement events
- Filter by event type, reference type, date range
- Pagination support
- Color-coded event types
- Links to related products and orders
- Export functionality (future enhancement)

---

## Automatic Tracking Integration

### Order Fulfillment

When an order is fulfilled via `/api/admin/orders/[id]/fulfill`:
- Automatically creates inventory events for each product
- Records quantity removed
- Links to order ID

### Product Stock Status Changes

When a product's stock status is updated:
- Automatically creates inventory event
- Records old and new status
- Links to admin user (if available)

---

## Usage Examples

### Track Supplier Delivery

```typescript
import { trackSupplierDelivery } from '@/lib/inventory/tracking';

await trackSupplierDelivery(
  productId: 123,
  quantity: 100,
  supplierId: 5,
  notes: 'Monthly delivery from ABC Supplier'
);
```

### Track Manual Adjustment

```typescript
import { trackManualAdjustment } from '@/lib/inventory/tracking';

await trackManualAdjustment(
  productId: 123,
  quantityChange: -10, // Negative for removal
  quantityBefore: 100,
  quantityAfter: 90,
  userId: 1, // Admin user ID
  notes: 'Stock take adjustment'
);
```

### Get Product History

```typescript
import { getProductInventoryHistory } from '@/lib/inventory/tracking';

const history = await getProductInventoryHistory(productId, 50);
```

---

## Benefits

1. **Complete Audit Trail** - Every stock change is recorded
2. **Compliance** - Meets accounting and inventory management requirements
3. **Troubleshooting** - Easy to identify when and why stock changed
4. **Reporting** - Foundation for inventory reports and analytics
5. **Accountability** - Track who made changes and when

---

## Future Enhancements

- [ ] Export inventory history to CSV/Excel
- [ ] Inventory reports (stock movements by period)
- [ ] Stock reconciliation reports
- [ ] Integration with accounting systems (Xero)
- [ ] Real-time inventory alerts
- [ ] Inventory forecasting based on movement patterns

---

## Related Features

- **Low Stock Alerts** - Uses inventory tracking for stock level monitoring
- **Order Fulfillment** - Automatically tracks inventory on fulfillment
- **Xero Integration** (Planned) - Will use inventory events for accounting sync

---

*This feature is part of Phase 7: Accounting & Inventory Integration*
