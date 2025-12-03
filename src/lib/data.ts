// TODO: This file is a starting point for centralizing data fetching.
// A production-ready implementation would include more robust error handling,
// caching, and potentially a more structured approach with a dedicated
// services directory.

import prisma from './prisma';
import { STOCK_STATUS } from '@/constants';

export async function getProduct(id: string) {
  const productId = parseInt(id, 10);

  // Validate that the ID is a valid positive number
  if (isNaN(productId) || productId <= 0 || !Number.isFinite(productId)) {
    return null;
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        category: true,
      },
    });
    return product;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    // In a real app, you'd want to handle this more gracefully
    return null;
  }
}

export async function getRelatedProducts(productId: number, categoryId: number) {
  try {
    const relatedProducts = await prisma.product.findMany({
      where: {
        category_id: categoryId,
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
  } catch (error) {
    console.error('Failed to fetch related products:', error);
    return [];
  }
}
