// Refactored to use Repository Pattern

import { PrismaProductRepository } from './repositories/prisma/PrismaProductRepository';

const productRepository = new PrismaProductRepository();

export async function getProduct(id: string) {
  return productRepository.getProduct(parseInt(id, 10));
}

export async function getRelatedProducts(productId: number, categoryId?: number) {
  return productRepository.getRelatedProducts(productId, categoryId);
}

export async function getFeaturedProducts(count: number = 4) {
  return productRepository.getFeaturedProducts(count);
}
