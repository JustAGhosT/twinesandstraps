import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { ALLOWED_IMAGE_CACHE_DOMAINS, SUPPORTED_IMAGE_CONTENT_TYPES } from '@/constants';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Cache directory path
const CACHE_DIR = path.join(process.cwd(), 'public', 'images', 'cache');

/**
 * Generate a hash-based filename for the cached image
 */
function generateCacheFilename(url: string): string {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  return hash;
}

/**
 * Check if the URL is from an allowed domain
 */
function isAllowedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_IMAGE_CACHE_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Get the file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  // Handle content type with charset or other parameters
  const baseType = contentType.split(';')[0].trim();
  return SUPPORTED_IMAGE_CONTENT_TYPES[baseType] || '.jpg';
}

/**
 * Check if a cached file exists and return its path with extension
 */
async function findCachedFile(basePath: string): Promise<string | null> {
  const extensions = Object.values(SUPPORTED_IMAGE_CONTENT_TYPES);
  for (const ext of extensions) {
    const filePath = `${basePath}${ext}`;
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // File doesn't exist with this extension
    }
  }
  return null;
}

/**
 * GET handler for image caching
 * Usage: /api/images/cache?url=<encoded-url>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Validate URL format
  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(imageUrl);
    new URL(decodedUrl); // Validate it's a proper URL
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  // Security: Only allow images from whitelisted domains
  if (!isAllowedDomain(decodedUrl)) {
    return NextResponse.json(
      { error: 'Domain not allowed for caching' },
      { status: 403 }
    );
  }

  const cacheFilename = generateCacheFilename(decodedUrl);
  const cacheBasePath = path.join(CACHE_DIR, cacheFilename);

  try {
    // Ensure cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Check if file is already cached
    const existingCachedFile = await findCachedFile(cacheBasePath);
    if (existingCachedFile) {
      const cachedData = await fs.readFile(existingCachedFile);
      const ext = path.extname(existingCachedFile);
      const contentType =
        Object.entries(SUPPORTED_IMAGE_CONTENT_TYPES).find(
          ([, e]) => e === ext
        )?.[0] || 'image/jpeg';

      return new NextResponse(cachedData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch image from external source
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'ImageCache/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const baseContentType = contentType.split(';')[0].trim();

    // Validate content type is an image
    if (!baseContentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);

    // Determine file extension and save to cache
    const extension = getExtensionFromContentType(contentType);
    const cacheFilePath = `${cacheBasePath}${extension}`;

    // Save image to cache directory
    await fs.writeFile(cacheFilePath, imageData);

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': baseContentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    logError('Image caching error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to cache image', details: errorMessage },
      { status: 500 }
    );
  }
}
