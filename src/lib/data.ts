import { STOCK_STATUS } from '@/constants';
import prisma from './prisma';
import { getOrSetCache, CacheKeys } from './cache';

export async function getProduct(idOrSlug: string) {
  // Try to parse as ID first (for backward compatibility)
  const productId = parseInt(idOrSlug, 10);
  const isNumericId = !isNaN(productId) && productId > 0 && Number.isFinite(productId);

  try {
    return await getOrSetCache(
      CacheKeys.product(idOrSlug),
      async () => {
        // Try to find by slug first (SEO-friendly), then fall back to ID
        const product = await prisma.product.findFirst({
          where: isNumericId
            ? {
                OR: [
                  { id: productId },
                  { slug: idOrSlug },
                ],
              }
            : { slug: idOrSlug },
          include: {
            category: true,
          },
        });
        return product;
      },
      3600 * 1000 // 1 hour cache
    );
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

export async function getRelatedProducts(productId: number, categoryId?: number) {
  try {
    return await getOrSetCache(
      CacheKeys.relatedProducts(productId),
      async () => {
        let finalCategoryId = categoryId;

        // If categoryId is not provided, fetch it from the product
        if (finalCategoryId === undefined) {
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { category_id: true },
          });

          if (product) {
            finalCategoryId = product.category_id;
          } else {
            return [];
          }
        }

        const relatedProducts = await prisma.product.findMany({
          where: {
            category_id: finalCategoryId,
            id: {
              not: productId,
            },
            stock_status: {
              not: STOCK_STATUS.OUT_OF_STOCK,
            },
          },
          include: {
            category: true,
          },
          take: 4,
          orderBy: {
            created_at: 'desc',
          },
        });
        return relatedProducts;
      },
      3600 * 1000 // 1 hour cache
    );
  } catch (error) {
    console.error('Failed to fetch related products:', error);
    return [];
  }
}

export async function getFeaturedProducts(count: number = 4) {
  try {
    return await getOrSetCache(
      CacheKeys.featuredProducts(count),
      async () => {
        const featuredProducts = await prisma.product.findMany({
          where: {
            stock_status: {
              not: STOCK_STATUS.OUT_OF_STOCK,
            },
          },
          include: {
            category: true,
          },
          take: count,
          orderBy: {
            created_at: 'desc',
          },
        });
        return featuredProducts;
      },
      1800 * 1000 // 30 minutes cache
    );
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
}
