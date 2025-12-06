/**
 * Cache warming utilities
 * Pre-fetches frequently accessed data to improve performance
 */

import { getOrSetCache, CacheKeys } from '../cache';
import prisma from '../prisma';
import { STOCK_STATUS } from '@/constants';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

/**
 * Warm cache with commonly accessed data
 */
export async function warmCache(): Promise<void> {
  try {
    logInfo('Starting cache warm-up...');

    // Warm featured products
    await getOrSetCache(
      CacheKeys.featuredProducts(4),
      async () => {
        return await prisma.product.findMany({
          where: {
            stock_status: {
              not: STOCK_STATUS.OUT_OF_STOCK,
            },
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 4,
          orderBy: {
            created_at: 'desc',
          },
        });
      },
      1800 * 1000 // 30 minutes
    );

    // Warm categories
    await getOrSetCache(
      CacheKeys.categories(),
      async () => {
        return await prisma.category.findMany({
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });
      },
      3600 * 1000 // 1 hour
    );

    logInfo('✅ Cache warm-up completed');
  } catch (error) {
    logError('Cache warm-up error:', error);
  }
}

/**
 * Warm cache for specific product
 */
export async function warmProductCache(productId: number): Promise<void> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (product) {
      await getOrSetCache(
        CacheKeys.product(productId),
        async () => product,
        3600 * 1000
      );

      // Also warm related products
      await getOrSetCache(
        CacheKeys.relatedProducts(productId),
        async () => {
          return await prisma.product.findMany({
            where: {
              category_id: product.category_id,
              id: {
                not: productId,
              },
              stock_status: {
                not: STOCK_STATUS.OUT_OF_STOCK,
              },
            },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            take: 4,
            orderBy: {
              created_at: 'desc',
            },
          });
        },
        3600 * 1000
      );
    }
  } catch (error) {
    logError('Error warming product cache:', error);
  }
}

