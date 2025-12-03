import type {
  Product as PrismaProduct,
  Category as PrismaCategory,
  Supplier as PrismaSupplier,
} from '@prisma/client';

export type Category = PrismaCategory;
export type Product = PrismaProduct;
export type Supplier = PrismaSupplier;

export type ProductWithCategory = Product & {
  category?: Category;
  supplier?: Supplier;
};
