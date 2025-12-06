/**
 * Product Integration Sync Cron Job
 * Processes scheduled product integrations (suppliers and marketplaces)
 * 
 * Runs: Every hour (configurable via Azure Functions cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logInfo, logError, logWarn } from '@/lib/logging/logger';
import { getMarketplaceProvider } from '@/lib/marketplace/provider.factory';
import { getSupplierProvider } from '@/lib/suppliers/provider.factory';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const secret = authHeader?.replace('Bearer ', '') || request.headers.get('X-Cron-Secret');
  return secret === CRON_SECRET;
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  if (!CRON_SECRET || !verifyCronSecret(request)) {
    logWarn('Unauthorized cron request - invalid secret', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Get integrations that need syncing
    const integrations = await prisma.productIntegration.findMany({
      where: {
        is_enabled: true,
        is_active: true,
        OR: [
          { next_sync_at: { lte: now } },
          { sync_schedule: 'realtime', last_synced_at: null },
        ],
      },
      include: {
        product: {
          include: {
            category: true,
            supplier: true,
          },
        },
      },
      take: 50, // Process in batches
    });

    logInfo('Product integration sync started', {
      integrationCount: integrations.length,
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const integration of integrations) {
      try {
        await syncIntegration(integration);
        results.succeeded++;
        results.processed++;

        // Update last_synced_at and next_sync_at
        const nextSyncAt = calculateNextSyncTime(integration.sync_schedule);
        await prisma.productIntegration.update({
          where: { id: integration.id },
          data: {
            last_synced_at: new Date(),
            next_sync_at: nextSyncAt,
            error_message: null,
          },
        });
      } catch (error) {
        results.failed++;
        results.processed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${integration.integration_name}: ${errorMessage}`);

        // Update error message
        await prisma.productIntegration.update({
          where: { id: integration.id },
          data: {
            error_message: errorMessage,
          },
        });

        logError('Product integration sync failed', error, {
          integrationId: integration.id,
          integrationName: integration.integration_name,
          type: integration.integration_type,
        });
      }
    }

    logInfo('Product integration sync completed', results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError('Product integration sync cron job failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sync a single integration
 */
async function syncIntegration(integration: any): Promise<void> {
  const { integration_type, integration_id, integration_name, product } = integration;

  if (integration_type === 'marketplace') {
    // Sync to marketplace
    const marketplaceProvider = getMarketplaceProvider(integration_name);
    if (!marketplaceProvider || !marketplaceProvider.isConfigured()) {
      throw new Error(`Marketplace provider ${integration_name} not configured`);
    }

    // Calculate effective price
    const effectivePrice = integration.price_override !== null && integration.price_override !== undefined
      ? integration.price_override
      : integration.margin_percentage !== null && integration.margin_percentage !== undefined
      ? product.price * (1 + integration.margin_percentage / 100)
      : product.price;

    // Calculate available quantity
    const availableQuantity = integration.quantity_override !== null && integration.quantity_override !== undefined
      ? integration.quantity_override
      : getProductQuantity(product);

    const availableQty = Math.max(0, availableQuantity - (integration.reserve_quantity || 0));

    // Create/update product listing
    await marketplaceProvider.createOrUpdateProduct({
      id: product.id.toString(),
      sellerSku: product.sku,
      title: product.name,
      description: product.description,
      price: effectivePrice,
      currency: 'ZAR',
      quantity: availableQty,
      categoryId: product.category?.name,
      images: product.image_url ? [product.image_url] : [],
      condition: 'new',
    });

    logInfo('Marketplace integration synced', {
      integrationId: integration.id,
      marketplace: integration_name,
      productId: product.id,
      price: effectivePrice,
      quantity: availableQty,
    });
  } else if (integration_type === 'supplier') {
    // Sync from supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: integration_id },
    });

    if (!supplier) {
      throw new Error(`Supplier ${integration_id} not found`);
    }

    const supplierProvider = getSupplierProvider(
      supplier.provider_type || 'manual',
      supplier.provider_config ? JSON.parse(supplier.provider_config as string) : {}
    );

    if (!supplierProvider || !supplierProvider.isConfigured()) {
      throw new Error(`Supplier provider ${supplier.provider_type} not configured`);
    }

    // Fetch product from supplier
    const supplierProduct = await supplierProvider.getProduct(product.supplier_sku || product.sku);
    
    if (supplierProduct) {
      // Update product with supplier data
      await prisma.product.update({
        where: { id: product.id },
        data: {
          supplier_price: supplierProduct.price,
          last_synced_at: new Date(),
        },
      });

      logInfo('Supplier integration synced', {
        integrationId: integration.id,
        supplierId: supplier.id,
        productId: product.id,
        supplierPrice: supplierProduct.price,
      });
    }
  }
}

/**
 * Calculate next sync time based on schedule
 */
function calculateNextSyncTime(schedule: string | null): Date | null {
  if (!schedule || schedule === 'manual') {
    return null;
  }

  const now = new Date();
  switch (schedule) {
    case 'realtime':
      return now; // Sync immediately next time
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * Get product available quantity (simplified - would check actual inventory)
 */
function getProductQuantity(product: any): number {
  // Simplified - would check InventoryMovement, stock levels, etc.
  if (product.stock_status === 'OUT_OF_STOCK') return 0;
  if (product.stock_status === 'LOW_STOCK') return 10;
  return 100; // IN_STOCK
}

