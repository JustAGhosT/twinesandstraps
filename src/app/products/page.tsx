import React from 'react';
import prisma from '@/lib/prisma';
import ProductsClient from '@/components/ProductsClient';
import { generateProductsMetadata } from './metadata';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Generate metadata for products page
export const metadata = generateProductsMetadata();

// Use ISR for better performance - revalidate every hour
export const revalidate = 3600;

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return products;
  } catch (error) {
    logError('Failed to fetch products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parent_id: null,
      },
    });
    return categories;
  } catch (error) {
    logError('Failed to fetch categories:', error);
    return [];
  }
}

export default async function ProductListPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return <ProductsClient products={products} categories={categories} />;
}
