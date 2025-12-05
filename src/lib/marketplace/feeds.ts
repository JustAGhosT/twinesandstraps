/**
 * Product Feed Generation for Marketplaces
 * Generates CSV/XML feeds for Google Shopping, Facebook, Takealot, etc.
 */

import prisma from '../prisma';
import { getSiteUrl } from '../env';
import { STOCK_STATUS } from '@/constants';

export interface FeedProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  price: string;
  availability: string;
  brand?: string;
  gtin?: string;
  mpn?: string;
  condition?: string;
  category?: string;
}

/**
 * Get products formatted for marketplace feeds
 */
export async function getFeedProducts(): Promise<FeedProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      stock_status: {
        not: STOCK_STATUS.OUT_OF_STOCK,
      },
    },
    include: {
      category: true,
    },
  });

  const siteUrl = getSiteUrl();

  return products.map((product) => ({
    id: product.id.toString(),
    title: product.name,
    description: product.description.substring(0, 5000), // Limit description length
    link: `${siteUrl}/products/${product.id}`,
    image_link: product.image_url || `${siteUrl}/images/placeholder.jpg`,
    price: `${product.price.toFixed(2)} ZAR`,
    availability: product.stock_status === STOCK_STATUS.OUT_OF_STOCK
      ? 'out of stock'
      : product.stock_status === STOCK_STATUS.LOW_STOCK
      ? 'in stock'
      : 'in stock',
    brand: 'TASSA',
    gtin: product.sku, // Using SKU as GTIN placeholder
    mpn: product.sku,
    condition: 'new',
    category: product.category?.name || 'General',
  }));
}

/**
 * Generate Google Shopping XML feed
 */
export async function generateGoogleShoppingFeed(): Promise<string> {
  const products = await getFeedProducts();
  const siteUrl = getSiteUrl();

  const items = products.map((product) => `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.description)}</g:description>
      <g:link>${escapeXml(product.link)}</g:link>
      <g:image_link>${escapeXml(product.image_link)}</g:image_link>
      <g:price>${escapeXml(product.price)}</g:price>
      <g:availability>${escapeXml(product.availability)}</g:availability>
      <g:brand>${escapeXml(product.brand || 'TASSA')}</g:brand>
      <g:condition>${escapeXml(product.condition || 'new')}</g:condition>
      ${product.gtin ? `<g:gtin>${escapeXml(product.gtin)}</g:gtin>` : ''}
      ${product.mpn ? `<g:mpn>${escapeXml(product.mpn)}</g:mpn>` : ''}
      <g:google_product_category>${escapeXml(product.category || 'General')}</g:google_product_category>
    </item>
  `).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>TASSA - Twines and Straps SA</title>
    <link>${siteUrl}</link>
    <description>Product feed for TASSA - Twines and Straps SA</description>
    ${items}
  </channel>
</rss>`;
}

/**
 * Generate CSV feed (for Takealot, etc.)
 */
export async function generateCSVFeed(): Promise<string> {
  const products = await getFeedProducts();

  // CSV headers
  const headers = [
    'ID',
    'Title',
    'Description',
    'Link',
    'Image Link',
    'Price',
    'Availability',
    'Brand',
    'GTIN',
    'MPN',
    'Condition',
    'Category',
  ];

  // CSV rows
  const rows = products.map((product) => [
    product.id,
    product.title,
    product.description.replace(/"/g, '""'), // Escape quotes
    product.link,
    product.image_link,
    product.price,
    product.availability,
    product.brand || 'TASSA',
    product.gtin || '',
    product.mpn || '',
    product.condition || 'new',
    product.category || 'General',
  ].map(field => `"${field}"`).join(','));

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

/**
 * Generate Facebook Catalog feed (JSON)
 */
export async function generateFacebookCatalogFeed(): Promise<any> {
  const products = await getFeedProducts();

  return {
    data: products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      image_url: product.image_link,
      availability: product.availability === 'in stock' ? 'in stock' : 'out of stock',
      condition: product.condition || 'new',
      price: product.price.replace(' ZAR', ''),
      currency: 'ZAR',
      brand: product.brand || 'TASSA',
      url: product.link,
      category: product.category || 'General',
      retailer_id: product.id,
    })),
  };
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

