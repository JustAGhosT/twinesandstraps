import React from 'react';
import prisma from '@/lib/prisma';
import ProductView from '@/components/ProductView';
import Link from 'next/link';

// Force dynamic rendering - data is fetched at request time
export const dynamic = 'force-dynamic';

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
    include: {
      category: true,
    },
  });
  return product;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you are looking for does not exist.</p>
          <Link href="/products" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" className="hover:text-gray-900">Home</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-gray-900">Products</Link></li>
            <li>/</li>
            <li><Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-900">{product.category.name}</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-semibold">{product.name}</li>
          </ol>
        </nav>

        {/* Product View */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <ProductView product={product} />
        </div>

        {/* Back to Products Link */}
        <div className="mt-8">
          <Link href="/products" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
        </div>
      </div>
    </div>
  );
}
