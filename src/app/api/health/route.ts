import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Version is read from package.json at build time via next.config.js
// or from APP_VERSION environment variable set during deployment
const APP_VERSION = process.env.APP_VERSION || '0.1.0';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    server: {
      status: 'ok';
      uptime: number;
    };
    database: {
      status: 'ok' | 'error' | 'checking';
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
 * 
 * This endpoint is designed to be resilient and always return 200 OK
 * even if some components are unhealthy, to allow Azure App Service to start.
 * The actual health status is in the response body.
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    checks: {
      server: {
        status: 'ok',
        uptime: process.uptime(),
      },
      database: {
        status: 'checking',
      },
    },
  };

  // Check database connectivity with timeout protection
  // Import prisma dynamically to avoid blocking server startup if there's an issue
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const dbStart = Date.now();
    
    // Add a timeout to prevent hanging connections
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database check timeout after 5s')), 5000)
    );
    const dbQuery = prisma.$queryRaw`SELECT 1`;
    
    await Promise.race([dbQuery, timeoutPromise]);
    healthStatus.checks.database.status = 'ok';
    healthStatus.checks.database.latency = Date.now() - dbStart;
  } catch (error) {
    // Mark database as unhealthy but don't fail the entire health check
    // This allows the application to start even if database is temporarily unavailable
    healthStatus.status = 'degraded';
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

  // Always return 200 OK to allow Azure to successfully start the application
  // The actual health status is in the response body
  // Azure App Service will consider the app healthy if it gets any 2xx response
  return NextResponse.json(healthStatus, { status: 200 });
}
