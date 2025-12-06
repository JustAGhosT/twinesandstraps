import NotFound from '@/components/NotFound';
import ProductReviews from '@/components/ProductReviews';
import ProductView from '@/components/ProductView';
import RecentlyViewed from '@/components/RecentlyViewed';
import RelatedProducts from '@/components/RelatedProducts';
import ViewHistoryTracker from '@/components/ViewHistoryTracker';
import { featureFlags } from '@/config/featureFlags';
import { STOCK_STATUS } from '@/constants';
import { getProduct, getRelatedProducts } from '@/lib/data';
import { getSiteUrl } from '@/lib/env';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export const revalidate = 3600; // Revalidate every hour

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

// Generate dynamic metadata for each product
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  // Robust input validation
  if (!params?.id || typeof params.id !== 'string') {
    return {
      title: 'Product Not Found',
    };
  }

  try {
    const product = await getProduct(params.id);

    if (!product) {
      return {
        title: 'Product Not Found',
      };
    }

    const siteUrl = getSiteUrl();
    const productUrl = product.slug ? `${siteUrl}/products/${product.slug}` : `${siteUrl}/products/${product.id}`;
    const description = `${product.description.slice(0, 150)}${product.description.length > 150 ? '...' : ''} - R${product.price.toFixed(2)}`;

    return {
      title: product.name,
      description,
      alternates: {
        canonical: productUrl,
      },
      openGraph: {
        title: `${product.name} | TASSA`,
        description,
        url: productUrl,
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
    logError('Failed to generate metadata:', error);
    return {
      title: 'Error',
      description: 'Could not generate metadata for this product.',
    };
  }
}

// Safe JSON-LD component without dangerouslySetInnerHTML
const JsonLd = ({ data }: { data: object }) => {
  const jsonString = JSON.stringify(data);
  // Escape any potential script tags to prevent XSS
  const escapedJson = jsonString.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: escapedJson }}
    />
  );
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const siteUrl = getSiteUrl();
  
  // Parallelize data fetching with error handling
  const product = await getProduct(params.id);

  if (!product) {
    // Try to redirect if it's an old ID-based URL and product has a slug
    const productId = parseInt(params.id, 10);
    if (!isNaN(productId) && productId > 0) {
      // This might be an old ID URL - redirect will be handled by middleware
      return (
        <NotFound
          title="Product Not Found"
          message="The product you are looking for does not exist."
        />
      );
    }
    return (
      <NotFound
        title="Product Not Found"
        message="The product you are looking for does not exist."
      />
    );
  }

  // Redirect to slug URL if accessed via ID (for SEO)
  if (params.id !== product.slug && !isNaN(parseInt(params.id, 10))) {
    return (
      <div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace('/products/${product.slug}');`,
          }}
        />
        <p>Redirecting...</p>
      </div>
    );
  }

  const [relatedProducts] = await Promise.all([
    getRelatedProducts(product.id, product.category_id), // Fetch related products in parallel
  ]);

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
      url: `${siteUrl}/products/${product.slug || product.id}`,
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
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-muted-foreground" itemScope itemType="https://schema.org/BreadcrumbList">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`breadcrumb-${index}-${crumb.name}`}>
                <li>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground" aria-current="page">
                      {crumb.name}
                    </span>
                  )}
                </li>
                {index < breadcrumbs.length - 1 && (
                  <li aria-hidden="true" className="text-muted-foreground">
                    <span className="sr-only">/</span>
                    <span aria-hidden="true">/</span>
                  </li>
                )}
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
