import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Version is read from package.json at build time via next.config.js
// or from APP_VERSION environment variable set during deployment
const APP_VERSION = process.env.APP_VERSION || '0.1.0';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
    storage?: {
      status: 'ok' | 'error' | 'not_configured';
    };
  };
}

/**
 * GET /api/health
 * Health check endpoint for Azure App Service and monitoring
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    checks: {
      database: {
        status: 'ok',
      },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database.latency = Date.now() - dbStart;
  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.checks.database.status = 'error';
    healthStatus.checks.database.error = error instanceof Error ? error.message : 'Unknown database error';
  }

  // Check Azure Storage configuration
  const storageConfigured = Boolean(
    process.env.AZURE_STORAGE_ACCOUNT_NAME &&
    process.env.AZURE_STORAGE_ACCOUNT_KEY &&
    process.env.AZURE_STORAGE_CONTAINER_NAME
  );

  healthStatus.checks.storage = {
    status: storageConfigured ? 'ok' : 'not_configured',
  };

  // If storage is not configured in production, mark as degraded
  if (!storageConfigured && process.env.NODE_ENV === 'production') {
    if (healthStatus.status === 'healthy') {
      healthStatus.status = 'degraded';
    }
  }

  // Return appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                     healthStatus.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
