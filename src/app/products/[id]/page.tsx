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
  
  // Validate that the ID is a valid number
  if (isNaN(productId)) {
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
    return <div>Product not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductView product={product} />
    </div>
  );
}
