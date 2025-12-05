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
 * In production, you might want to use a service like Cloudinary or Imgix
 * that provides blur placeholders automatically
 */
export async function generateBlurFromImage(imageUrl: string): Promise<string> {
  // For now, return a generic blur placeholder
  // In production, you could:
  // 1. Fetch the image
  // 2. Resize it to 10x10px
  // 3. Convert to base64
  // 4. Return as data URL
  
  return getProductImageBlur();
}

/**
 * Extract dominant color from image (for better blur placeholder)
 * This is a placeholder - in production, use a library like 'colorthief' or an API
 */
export async function getImageDominantColor(imageUrl: string): Promise<string> {
  // Placeholder - in production, analyze the image to get dominant color
  return '#e5e7eb';
}

