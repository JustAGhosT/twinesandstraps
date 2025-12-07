import { Product, Category } from '@prisma/client';

export type ProductWithCategory = Product & { category: Category };

export interface IProductRepository {
  getProduct(id: number): Promise<ProductWithCategory | null>;
  getRelatedProducts(productId: number, categoryId?: number): Promise<ProductWithCategory[]>;
  getFeaturedProducts(count?: number): Promise<ProductWithCategory[]>;
}
