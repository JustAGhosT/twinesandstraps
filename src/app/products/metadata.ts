import { Metadata } from 'next';
import { getSiteUrl } from '@/lib/env';

export function generateProductsMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  
  return {
    title: 'Products',
    description: 'Browse our complete catalog of high-quality industrial twines, ropes, and straps. Find the perfect solution for your needs with detailed specifications and competitive pricing.',
    alternates: {
      canonical: `${siteUrl}/products`,
    },
    openGraph: {
      title: 'Products | TASSA - Twines and Straps SA',
      description: 'Browse our complete catalog of high-quality industrial twines, ropes, and straps.',
      url: `${siteUrl}/products`,
      siteName: 'TASSA - Twines and Straps SA',
      locale: 'en_ZA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Products | TASSA',
      description: 'Browse our complete catalog of high-quality industrial twines, ropes, and straps.',
    },
  };
}

