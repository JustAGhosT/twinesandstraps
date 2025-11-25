import React from 'react';
import prisma from '@/lib/prisma';
import ProductsClient from '@/components/ProductsClient';

// Force dynamic rendering - data is fetched at request time
export const dynamic = 'force-dynamic';

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return products;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: {
      parent_id: null,
    },
  });
  return categories;
}

export default async function ProductListPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return <ProductsClient products={products} categories={categories} />;
}
