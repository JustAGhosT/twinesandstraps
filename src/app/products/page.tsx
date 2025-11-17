import React from 'react';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

async function getProducts() {
  const products = await prisma.product.findMany();
  return products;
}

export default async function ProductListPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <Link href={`/products/${product.id}`} key={product.id}>
            <ProductCard product={product} />
          </Link>
        ))}
      </div>
    </div>
  );
}
