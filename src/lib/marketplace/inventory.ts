/**
 * Unified Inventory Management
 * Tracks inventory across multiple sales channels
 */

import prisma from '../prisma';
import { STOCK_STATUS } from '@/constants';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export interface ChannelInventory {
  channel: string; // 'WEBSITE', 'TAKEALOT', 'FACEBOOK', etc.
  productId: number;
  availableQuantity: number;
  reservedQuantity: number;
  lastSyncedAt: Date;
}

export interface InventorySync {
  productId: number;
  channel: string;
  quantity: number;
  status: 'success' | 'failed';
  error?: string;
  syncedAt: Date;
}

/**
 * Get available inventory for a product across all channels
 */
export async function getProductInventory(productId: number): Promise<{
  totalAvailable: number;
  totalReserved: number;
  channels: ChannelInventory[];
}> {
  // For now, use the product's stock_status as the source of truth
  // In production, you'd have a separate ChannelInventory table
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return {
      totalAvailable: 0,
      totalReserved: 0,
      channels: [],
    };
  }

  // Calculate available quantity based on stock status
  // This is simplified - in production, track actual quantities
  const totalAvailable = product.stock_status === STOCK_STATUS.OUT_OF_STOCK
    ? 0
    : product.stock_status === STOCK_STATUS.LOW_STOCK
    ? 10 // Assume low stock means < 10
    : 100; // Assume in stock means > 10

  return {
    totalAvailable,
    totalReserved: 0, // Would track reserved inventory
    channels: [
      {
        channel: 'WEBSITE',
        productId,
        availableQuantity: totalAvailable,
        reservedQuantity: 0,
        lastSyncedAt: new Date(),
      },
    ],
  };
}

/**
 * Reserve inventory for an order
 */
export async function reserveInventory(
  productId: number,
  quantity: number,
  channel: string = 'WEBSITE'
): Promise<boolean> {
  try {
    const inventory = await getProductInventory(productId);

    if (inventory.totalAvailable < quantity) {
      return false; // Not enough inventory
    }

    // In production, update ChannelInventory table
    // For now, just return success
    return true;
  } catch (error) {
    logError('Error reserving inventory:', error);
    return false;
  }
}

/**
 * Release reserved inventory
 */
export async function releaseInventory(
  productId: number,
  quantity: number,
  channel: string = 'WEBSITE'
): Promise<void> {
  // In production, update ChannelInventory table
  logInfo(`Releasing ${quantity} units of product ${productId} from ${channel}`);
}

/**
 * Sync inventory to external channel (e.g., Takealot)
 */
export async function syncInventoryToChannel(
  productId: number,
  channel: string,
  quantity: number
): Promise<InventorySync> {
  try {
    // This would call the channel's API to update inventory
    // For now, just log the sync
    logInfo(`Syncing product ${productId} to ${channel}: ${quantity} units`);

    return {
      productId,
      channel,
      quantity,
      status: 'success',
      syncedAt: new Date(),
    };
  } catch (error) {
    logError(`Error syncing inventory to ${channel}:`, error);
    return {
      productId,
      channel,
      quantity,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      syncedAt: new Date(),
    };
  }
}

/**
 * Get all products that need inventory sync
 */
export async function getProductsNeedingSync(channel: string): Promise<number[]> {
  // Get products that have been updated recently and need sync
  const products = await prisma.product.findMany({
    where: {
      stock_status: {
        not: STOCK_STATUS.OUT_OF_STOCK,
      },
      updated_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Updated in last 24 hours
      },
    },
    select: {
      id: true,
    },
  });

  return products.map(p => p.id);
}

