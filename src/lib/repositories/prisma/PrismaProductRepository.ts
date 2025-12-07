import prisma from '../../prisma';
import { IProductRepository, ProductWithCategory } from '../interfaces/IProductRepository';
import { STOCK_STATUS } from '@/constants';

export class PrismaProductRepository implements IProductRepository {
  async getProduct(id: number): Promise<ProductWithCategory | null> {
    if (isNaN(id) || id <= 0 || !Number.isFinite(id)) {
      return null;
    }

    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });
      return product;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  async getRelatedProducts(productId: number, categoryId?: number): Promise<ProductWithCategory[]> {
    try {
      let finalCategoryId = categoryId;

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
          id: { not: productId },
          stock_status: { not: STOCK_STATUS.OUT_OF_STOCK },
        },
        include: { category: true },
        take: 4,
        orderBy: { created_at: 'desc' },
      });
      return relatedProducts;
    } catch (error) {
      console.error('Failed to fetch related products:', error);
      return [];
    }
  }

  async getFeaturedProducts(count: number = 4): Promise<ProductWithCategory[]> {
    try {
      const featuredProducts = await prisma.product.findMany({
        where: {
          stock_status: { not: STOCK_STATUS.OUT_OF_STOCK },
        },
        include: { category: true },
        take: count,
        orderBy: { created_at: 'desc' },
      });
      return featuredProducts;
    } catch (error) {
      console.error('Failed to fetch featured products:', error);
      return [];
    }
  }
}
