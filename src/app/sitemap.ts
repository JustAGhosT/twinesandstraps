import prisma from '@/lib/prisma';
import { MetadataRoute } from 'next';

import { getSiteUrl } from '@/lib/env';

const siteUrl = getSiteUrl();

// Force dynamic generation at runtime (not build time)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all products for dynamic sitemap entries
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      updated_at: true,
    },
  });

  // Get all categories
  const categories = await prisma.category.findMany({
    select: {
      slug: true,
    },
  });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/quote`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category: { slug: string }) => ({
    url: `${siteUrl}/products?category=${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product: { id: number; slug: string | null; updated_at: Date }) => ({
    url: `${siteUrl}/products/${product.slug || product.id}`,
    lastModified: product.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
