/**
 * Integration Health Dashboard API
 * Provides health statistics and status for all integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import prisma from '@/lib/prisma';
import { logError } from '@/lib/logging/logger';

async function handleGET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const healthFilter = searchParams.get('health') as 'healthy' | 'warning' | 'error' | null;

    // Get all integrations
    const allIntegrations = await prisma.productIntegration.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate health for each integration
    const integrationsWithHealth = allIntegrations.map(integration => {
      let health: 'healthy' | 'warning' | 'error' = 'healthy';

      if (integration.error_message) {
        health = 'error';
      } else if (!integration.is_enabled || !integration.is_active) {
        health = 'warning';
      } else if (!integration.last_synced_at) {
        // Never synced
        health = 'warning';
      } else {
        const lastSync = new Date(integration.last_synced_at);
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        
        // Warning if sync is overdue based on schedule
        if (integration.sync_schedule) {
          let expectedInterval = 24; // Default to 24 hours
          if (integration.sync_schedule === 'hourly') expectedInterval = 1;
          else if (integration.sync_schedule === 'daily') expectedInterval = 24;
          else if (integration.sync_schedule === 'weekly') expectedInterval = 168;
          
          if (hoursSinceSync > expectedInterval * 2) {
            health = 'warning';
          }
        } else if (hoursSinceSync > 48) {
          health = 'warning';
        }
      }

      return {
        id: integration.id,
        productName: integration.product.name,
        integrationType: integration.integration_type as 'supplier' | 'marketplace',
        integrationName: integration.integration_name,
        isEnabled: integration.is_enabled,
        isActive: integration.is_active,
        lastSyncedAt: integration.last_synced_at?.toISOString() || null,
        nextSyncAt: integration.next_sync_at?.toISOString() || null,
        errorMessage: integration.error_message,
        syncSchedule: integration.sync_schedule,
        health,
      };
    });

    // Filter by health if requested
    const filtered = healthFilter 
      ? integrationsWithHealth.filter(i => i.health === healthFilter)
      : integrationsWithHealth;

    // Calculate statistics
    const stats = {
      total: allIntegrations.length,
      enabled: allIntegrations.filter(i => i.is_enabled).length,
      active: allIntegrations.filter(i => i.is_enabled && i.is_active).length,
      withErrors: allIntegrations.filter(i => i.error_message).length,
      lastSyncWithin24h: allIntegrations.filter(i => 
        i.last_synced_at && new Date(i.last_synced_at) >= twentyFourHoursAgo
      ).length,
      neverSynced: allIntegrations.filter(i => !i.last_synced_at).length,
      byType: {
        supplier: allIntegrations.filter(i => i.integration_type === 'supplier').length,
        marketplace: allIntegrations.filter(i => i.integration_type === 'marketplace').length,
      },
      byStatus: {
        healthy: integrationsWithHealth.filter(i => i.health === 'healthy').length,
        warning: integrationsWithHealth.filter(i => i.health === 'warning').length,
        error: integrationsWithHealth.filter(i => i.health === 'error').length,
      },
    };

    return NextResponse.json({
      success: true,
      stats,
      integrations: filtered,
    });
  } catch (error) {
    logError('Error fetching integration health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));

