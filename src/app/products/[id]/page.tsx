import NotFound from '@/components/NotFound';
import ProductReviews from '@/components/ProductReviews';
import ProductView from '@/components/ProductView';
import RecentlyViewed from '@/components/RecentlyViewed';
import RelatedProducts from '@/components/RelatedProducts';
import ViewHistoryTracker from '@/components/ViewHistoryTracker';
import { featureFlags } from '@/config/featureFlags';
import { STOCK_STATUS } from '@/constants';
import { getProduct, getRelatedProducts } from '@/lib/data';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const revalidate = 3600; // Revalidate every hour

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

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

  try {
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
            alt: product.name || 'Product image',
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
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Error',
      description: 'Could not generate metadata for this product.',
    };
  }
}

const JsonLd = ({ data }: { data: object }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const productId = parseInt(params.id, 10);

  if (isNaN(productId) || productId <= 0) {
    return (
      <NotFound
        title="Invalid Product ID"
        message="The product ID is not valid."
      />
    );
  }

  const [product, relatedProducts] = await Promise.all([
    getProduct(params.id),
    getRelatedProducts(productId, undefined), // Fetch related products in parallel
  ]);

  if (!product) {
    return (
      <NotFound
        title="Product Not Found"
        message="The product you are looking for does not exist."
      />
    );
  }

  // JSON-LD structured data for product
  const jsonLdData = {
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
      availability: product.stock_status === STOCK_STATUS.OUT_OF_STOCK
        ? 'https://schema.org/OutOfStock'
        : product.stock_status === STOCK_STATUS.LOW_STOCK
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

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: product.category.name, href: `/products?category=${product.category.slug}` },
    { name: product.name },
  ];

  return (
    <>
      <JsonLd data={jsonLdData} />

      {featureFlags.viewHistory && (
        <ViewHistoryTracker productId={product.id} />
      )}

      <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.name}>
                <li>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground">{crumb.name}</span>
                  )}
                </li>
                {index < breadcrumbs.length - 1 && <li aria-hidden="true">/</li>}
              </React.Fragment>
            ))}
          </ol>
        </nav>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 md:p-8">
          <ProductView product={product} />

          {featureFlags.productReviews && (
            <ProductReviews productId={product.id} productName={product.name} />
          )}
        </div>

        {featureFlags.relatedProducts && relatedProducts.length > 0 && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 md:p-8 mt-6">
            <RelatedProducts products={relatedProducts} title="You May Also Like" />
          </div>
        )}

        <div className="mt-8">
          <Link href="/products" className="inline-flex items-center text-primary hover:text-primary/90 font-semibold">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
        </div>
      </div>
    </div>

      {featureFlags.recentlyViewed && (
        <RecentlyViewed excludeProductId={product.id} />
      )}
    </>
  );
}
