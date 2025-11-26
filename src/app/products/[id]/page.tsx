import React from 'react';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ProductView from '@/components/ProductView';
import RelatedProducts from '@/components/RelatedProducts';
import ProductReviews from '@/components/ProductReviews';
import Link from 'next/link';
import { featureFlags } from '@/config/featureFlags';

// Force dynamic rendering - data is fetched at request time
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://twinesandstraps.netlify.app';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

// Generate dynamic metadata for each product
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId) || productId <= 0) {
    return {
      title: 'Product Not Found',
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const description = `${product.description.slice(0, 150)}${product.description.length > 150 ? '...' : ''} - R${product.price.toFixed(2)}`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | TASSA`,
      description,
      url: `${siteUrl}/products/${product.id}`,
      siteName: 'TASSA - Twines and Straps SA',
      images: product.image_url ? [
        {
          url: product.image_url,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ] : [],
      locale: 'en_ZA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | TASSA`,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
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

async function getRelatedProducts(productId: number, categoryId: number) {
  const relatedProducts = await prisma.product.findMany({
    where: {
      category_id: categoryId,
      id: {
        not: productId
      },
      stock_status: {
        not: 'OUT_OF_STOCK'
      }
    },
    include: {
      category: true,
    },
    take: 4,
    orderBy: {
      created_at: 'desc'
    }
  });
  return relatedProducts;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you are looking for does not exist.</p>
          <Link href="/products" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  // Fetch related products from the same category
  const relatedProducts = await getRelatedProducts(product.id, product.category_id);

  // JSON-LD structured data for product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.image_url || undefined,
    brand: {
      '@type': 'Brand',
      name: 'TASSA',
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Twines and Straps SA',
      url: siteUrl,
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: 'ZAR',
      price: product.price,
      availability: product.stock_status === 'OUT_OF_STOCK'
        ? 'https://schema.org/OutOfStock'
        : product.stock_status === 'LOW_STOCK'
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Twines and Straps SA',
      },
    },
    category: product.category.name,
    ...(product.material && { material: product.material }),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

          {/* Product Reviews */}
          {featureFlags.productReviews && (
            <ProductReviews productId={product.id} productName={product.name} />
          )}
        </div>

        {/* Related Products */}
        {featureFlags.relatedProducts && relatedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mt-6">
            <RelatedProducts products={relatedProducts} title="You May Also Like" />
          </div>
        )}

        {/* Back to Products Link */}
        <div className="mt-8">
          <Link href="/products" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
