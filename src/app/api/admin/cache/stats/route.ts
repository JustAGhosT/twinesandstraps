/**
 * API endpoint for cache statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getCacheStats, getCacheInstance } from '@/lib/cache';
import { isRedisConnected } from '@/lib/cache/redis';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const stats = await getCacheStats();
    const cache = await getCacheInstance();
    const isRedis = isRedisConnected();

    return NextResponse.json({
      success: true,
      cacheType: isRedis ? 'redis' : 'memory',
      stats,
      redisConnected: isRedis,
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
      { status: 500 }
    );
  }
}

