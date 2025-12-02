'use client';

import Image, { ImageProps } from 'next/image';
import { getCachedImageUrl, isExternalImageUrl } from '@/lib/image-cache';

interface CachedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  /**
   * Whether to use the image cache for external URLs
   * @default true
   */
  useCache?: boolean;
  /**
   * Fallback content to display when image is not available
   */
  fallback?: React.ReactNode;
}

/**
 * CachedImage component that wraps Next.js Image with automatic caching
 * for external URLs. External images are fetched once and cached locally.
 */
export default function CachedImage({
  src,
  useCache = true,
  fallback,
  alt,
  ...props
}: CachedImageProps) {
  // Handle null/undefined src
  if (!src) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  // Determine the final image URL
  let imageSrc = src;
  
  if (useCache && isExternalImageUrl(src)) {
    const cachedUrl = getCachedImageUrl(src);
    if (cachedUrl) {
      imageSrc = cachedUrl;
    }
  }

  return <Image src={imageSrc} alt={alt} {...props} />;
}
