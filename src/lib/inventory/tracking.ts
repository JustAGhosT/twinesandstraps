/**
 * Inventory Movement Tracking
 * Automatically tracks all stock changes for audit trail
 */

import prisma from '@/lib/prisma';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export enum InventoryEventType {
  STOCK_ADDED = 'STOCK_ADDED',
  STOCK_REMOVED = 'STOCK_REMOVED',
  STOCK_ADJUSTED = 'STOCK_ADJUSTED',
  SUPPLIER_DELIVERY = 'SUPPLIER_DELIVERY',
  ORDER_FULFILLMENT = 'ORDER_FULFILLMENT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  STOCK_STATUS_CHANGE = 'STOCK_STATUS_CHANGE',
}

export enum ReferenceType {
  ORDER = 'ORDER',
  SUPPLIER_DELIVERY = 'SUPPLIER_DELIVERY',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
}

interface CreateInventoryEventParams {
  productId: number;
  eventType: InventoryEventType;
  quantityChange: number; // Positive for additions, negative for removals
  quantityBefore?: number;
  quantityAfter?: number;
  referenceType?: ReferenceType;
  referenceId?: number;
  notes?: string;
  createdByUserId?: number;
}

/**
 * Create an inventory event to track stock movement
 */
export async function createInventoryEvent(
  params: CreateInventoryEventParams
): Promise<void> {
  try {
    await prisma.inventoryEvent.create({
      data: {
        product_id: params.productId,
        event_type: params.eventType,
        quantity_change: params.quantityChange,
        quantity_before: params.quantityBefore,
        quantity_after: params.quantityAfter,
        reference_type: params.referenceType,
        reference_id: params.referenceId,
        notes: params.notes,
        created_by_user_id: params.createdByUserId,
      },
    });
  } catch (error) {
    // Log error but don't throw - inventory tracking shouldn't break main operations
    logError('Failed to create inventory event:', error);
  }
}

/**
 * Track stock removal when order is fulfilled
 */
export async function trackOrderFulfillment(
  orderId: number,
  orderItems: Array<{ product_id: number; quantity: number }>
): Promise<void> {
  for (const item of orderItems) {
    // Get current stock status (if we had a quantity field, we'd use that)
    // For now, we'll track the event without quantity_before/after
    await createInventoryEvent({
      productId: item.product_id,
      eventType: InventoryEventType.ORDER_FULFILLMENT,
      quantityChange: -item.quantity,
      referenceType: ReferenceType.ORDER,
      referenceId: orderId,
      notes: `Stock removed for order fulfillment`,
    });
  }
}

/**
 * Track supplier delivery (stock addition)
 */
export async function trackSupplierDelivery(
  productId: number,
  quantity: number,
  supplierId?: number,
  notes?: string
): Promise<void> {
  await createInventoryEvent({
    productId,
    eventType: InventoryEventType.SUPPLIER_DELIVERY,
    quantityChange: quantity,
    referenceType: supplierId ? ReferenceType.SUPPLIER_DELIVERY : ReferenceType.MANUAL,
    referenceId: supplierId,
    notes: notes || `Stock added from supplier delivery`,
  });
}

/**
 * Track manual stock adjustment
 */
export async function trackManualAdjustment(
  productId: number,
  quantityChange: number,
  quantityBefore: number,
  quantityAfter: number,
  userId?: number,
  notes?: string
): Promise<void> {
  await createInventoryEvent({
    productId,
    eventType: InventoryEventType.MANUAL_ADJUSTMENT,
    quantityChange,
    quantityBefore,
    quantityAfter,
    referenceType: ReferenceType.MANUAL,
    createdByUserId: userId,
    notes: notes || `Manual stock adjustment`,
  });
}

/**
 * Track stock status change (e.g., IN_STOCK to OUT_OF_STOCK)
 */
export async function trackStockStatusChange(
  productId: number,
  oldStatus: string,
  newStatus: string,
  userId?: number
): Promise<void> {
  await createInventoryEvent({
    productId,
    eventType: InventoryEventType.STOCK_STATUS_CHANGE,
    quantityChange: 0, // No quantity change, just status
    referenceType: ReferenceType.MANUAL,
    createdByUserId: userId,
    notes: `Stock status changed from ${oldStatus} to ${newStatus}`,
  });
}

/**
 * Get inventory history for a product
 */
export async function getProductInventoryHistory(
  productId: number,
  limit: number = 50
) {
  return await prisma.inventoryEvent.findMany({
    where: {
      product_id: productId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  });
}

/**
 * Get all inventory events with filters
 */
export async function getAllInventoryEvents(filters?: {
  productId?: number;
  eventType?: InventoryEventType;
  referenceType?: ReferenceType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.productId) {
    where.product_id = filters.productId;
  }

  if (filters?.eventType) {
    where.event_type = filters.eventType;
  }

  if (filters?.referenceType) {
    where.reference_type = filters.referenceType;
  }

  if (filters?.startDate || filters?.endDate) {
    where.created_at = {};
    if (filters.startDate) {
      where.created_at.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.created_at.lte = filters.endDate;
    }
  }

  const [events, total] = await Promise.all([
    prisma.inventoryEvent.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.inventoryEvent.count({ where }),
  ]);

  return {
    events,
    total,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
  };
}

