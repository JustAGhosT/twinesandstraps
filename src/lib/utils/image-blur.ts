import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';
/**
 * Image blur placeholder utilities
 * Generates blur data URLs for progressive image loading
 */

/**
 * Generate a blur data URL for placeholder
 * Creates a tiny 1x1 pixel image encoded as base64
 */
export function generateBlurDataUrl(width: number = 10, height: number = 10, color: string = '#e5e7eb'): string {
  // Create a simple SVG that can be used as a blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `.trim();

  // Convert to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get blur placeholder for product images
 */
export function getProductImageBlur(color?: string): string {
  return generateBlurDataUrl(10, 10, color || '#e5e7eb');
}

/**
 * Generate blur placeholder from an image URL
 * Creates a proper blur data URL from the actual image
 */
export async function generateBlurFromImage(imageUrl: string): Promise<string> {
  try {
    // For server-side: fetch and process image
    if (typeof window === 'undefined') {
      // In production, consider using a service like Cloudinary or Imgix
      // For now, return a generic blur placeholder
      return getProductImageBlur();
    }
    
    // Client-side: create canvas and generate blur
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 10, 10);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
          resolve(dataUrl);
        } else {
          resolve(getProductImageBlur());
        }
      };
      img.onerror = () => resolve(getProductImageBlur());
      img.src = imageUrl;
    });
  } catch (error) {
    logError('Error generating blur from image:', error);
    return getProductImageBlur();
  }
}

/**
 * Extract dominant color from image (for better blur placeholder)
 * This is a placeholder - in production, use a library like 'colorthief' or an API
 */
export async function getImageDominantColor(imageUrl: string): Promise<string> {
  // Placeholder - in production, analyze the image to get dominant color
  return '#e5e7eb';
}

