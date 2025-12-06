/**
 * Bulk Integration Management API
 * Handles bulk operations on product integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logging/logger';

// GET - List integrations with filters
async function handleGET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'supplier' | 'marketplace' | null;
    const status = searchParams.get('status') as 'enabled' | 'disabled' | 'error' | null;

    const where: any = {};
    
    if (type) {
      where.integration_type = type;
    }

    if (status === 'enabled') {
      where.is_enabled = true;
    } else if (status === 'disabled') {
      where.is_enabled = false;
    } else if (status === 'error') {
      where.error_message = { not: null };
    }

    const integrations = await prisma.productIntegration.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { product: { name: 'asc' } },
        { integration_type: 'asc' },
      ],
    });

    const formatted = integrations.map(i => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product.name,
      integrationType: i.integration_type as 'supplier' | 'marketplace',
      integrationName: i.integration_name,
      isEnabled: i.is_enabled,
      isActive: i.is_active,
      lastSyncedAt: i.last_synced_at?.toISOString() || null,
      errorMessage: i.error_message,
    }));

    return NextResponse.json({
      success: true,
      integrations: formatted,
      count: formatted.length,
    });
  } catch (error) {
    logError('Error fetching bulk integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST - Bulk actions
async function handlePOST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { type, integrationIds } = body;

    if (!type || !['enable', 'disable', 'sync'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }

    if (!integrationIds || !Array.isArray(integrationIds) || integrationIds.length === 0) {
      return NextResponse.json(
        { error: 'No integration IDs provided' },
        { status: 400 }
      );
    }

    let affected = 0;

    if (type === 'enable') {
      const result = await prisma.productIntegration.updateMany({
        where: {
          id: { in: integrationIds.map((id: any) => parseInt(id)) },
        },
        data: {
          is_enabled: true,
        },
      });
      affected = result.count;
    } else if (type === 'disable') {
      const result = await prisma.productIntegration.updateMany({
        where: {
          id: { in: integrationIds.map((id: any) => parseInt(id)) },
        },
        data: {
          is_enabled: false,
          is_active: false,
        },
      });
      affected = result.count;
    } else if (type === 'sync') {
      // Trigger sync by setting next_sync_at to now
      const result = await prisma.productIntegration.updateMany({
        where: {
          id: { in: integrationIds.map((id: any) => parseInt(id)) },
          is_enabled: true,
        },
        data: {
          next_sync_at: new Date(),
          error_message: null,
        },
      });
      affected = result.count;
    }

    logInfo('Bulk integration action performed', { type, affected });

    return NextResponse.json({
      success: true,
      action: type,
      affected,
    });
  } catch (error) {
    logError('Error performing bulk integration action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));
export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

