/**
 * Product Integration Management API
 * GET: Get all integrations for a product
 * POST: Create/update product integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const integrationSchema = z.object({
  integrationType: z.enum(['supplier', 'marketplace']),
  integrationId: z.number(),
  integrationName: z.string(),
  isEnabled: z.boolean().optional(),
  priceOverride: z.number().optional().nullable(),
  marginPercentage: z.number().optional().nullable(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  quantityOverride: z.number().int().optional().nullable(),
  minQuantity: z.number().int().optional().nullable(),
  maxQuantity: z.number().int().optional().nullable(),
  reserveQuantity: z.number().int().default(0),
  leadTimeDays: z.number().int().optional().nullable(),
  syncSchedule: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'manual']).optional().nullable(),
  autoSync: z.boolean().default(true),
  syncOnPriceChange: z.boolean().default(true),
  syncOnStockChange: z.boolean().default(true),
  customConfig: z.record(z.any()).optional().nullable(),
});

async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const integrations = await prisma.productIntegration.findMany({
      where: { product_id: productId },
      orderBy: [
        { integration_type: 'asc' },
        { integration_name: 'asc' },
      ],
    });

    // Convert to API format
    const formattedIntegrations = integrations.map(integration => ({
      id: integration.id,
      integrationType: integration.integration_type,
      integrationId: integration.integration_id,
      integrationName: integration.integration_name,
      isEnabled: integration.is_enabled,
      isActive: integration.is_active,
      priceOverride: integration.price_override,
      marginPercentage: integration.margin_percentage,
      minPrice: integration.min_price,
      maxPrice: integration.max_price,
      quantityOverride: integration.quantity_override,
      minQuantity: integration.min_quantity,
      maxQuantity: integration.max_quantity,
      reserveQuantity: integration.reserve_quantity,
      leadTimeDays: integration.lead_time_days,
      syncSchedule: integration.sync_schedule,
      autoSync: integration.auto_sync,
      syncOnPriceChange: integration.sync_on_price_change,
      syncOnStockChange: integration.sync_on_stock_change,
      customConfig: integration.custom_config,
      errorMessage: integration.error_message,
      lastSyncedAt: integration.last_synced_at?.toISOString(),
      nextSyncAt: integration.next_sync_at?.toISOString(),
    }));

    return NextResponse.json({ integrations: formattedIntegrations });
  } catch (error) {
    console.error('Error fetching product integrations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePOST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = integrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Calculate next sync time based on schedule
    let nextSyncAt: Date | null = null;
    if (data.syncSchedule && data.syncSchedule !== 'manual' && data.isEnabled) {
      const now = new Date();
      switch (data.syncSchedule) {
        case 'realtime':
          nextSyncAt = now;
          break;
        case 'hourly':
          nextSyncAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case 'daily':
          nextSyncAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextSyncAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const integration = await prisma.productIntegration.upsert({
      where: {
        product_id_integration_type_integration_id: {
          product_id: productId,
          integration_type: data.integrationType,
          integration_id: data.integrationId,
        },
      },
      create: {
        product_id: productId,
        integration_type: data.integrationType,
        integration_id: data.integrationId,
        integration_name: data.integrationName,
        is_enabled: data.isEnabled ?? false,
        is_active: data.isEnabled ?? false,
        price_override: data.priceOverride,
        margin_percentage: data.marginPercentage,
        min_price: data.minPrice,
        max_price: data.maxPrice,
        quantity_override: data.quantityOverride,
        min_quantity: data.minQuantity,
        max_quantity: data.maxQuantity,
        reserve_quantity: data.reserveQuantity,
        lead_time_days: data.leadTimeDays,
        sync_schedule: data.syncSchedule,
        next_sync_at: nextSyncAt,
        auto_sync: data.autoSync,
        sync_on_price_change: data.syncOnPriceChange,
        sync_on_stock_change: data.syncOnStockChange,
        custom_config: data.customConfig || null,
      },
      update: {
        integration_name: data.integrationName,
        is_enabled: data.isEnabled ?? false,
        is_active: data.isEnabled ?? false,
        price_override: data.priceOverride,
        margin_percentage: data.marginPercentage,
        min_price: data.minPrice,
        max_price: data.maxPrice,
        quantity_override: data.quantityOverride,
        min_quantity: data.minQuantity,
        max_quantity: data.maxQuantity,
        reserve_quantity: data.reserveQuantity,
        lead_time_days: data.leadTimeDays,
        sync_schedule: data.syncSchedule,
        next_sync_at: nextSyncAt,
        auto_sync: data.autoSync,
        sync_on_price_change: data.syncOnPriceChange,
        sync_on_stock_change: data.syncOnStockChange,
        custom_config: data.customConfig || null,
        error_message: null, // Clear errors on update
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error) {
    console.error('Error saving product integration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));
export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

