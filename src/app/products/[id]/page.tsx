import React from 'react';
import prisma from '@/lib/prisma';
import ProductView from '@/components/ProductView';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

async function getProduct(id: string) {
  const productId = parseInt(id, 10);
  
  // Validate that the ID is a valid positive number
  if (isNaN(productId) || productId <= 0 || !Number.isFinite(productId)) {
    return null;
  }
  
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
  return product;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you are looking for does not exist.</p>
          <a href="/products" className="text-blue-600 hover:underline">
            Browse all products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductView product={product} />
    </div>
  );
}
