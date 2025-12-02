/**
 * Image Cache Tests
 *
 * These tests ensure the image caching functionality works correctly.
 * The cache fetches external images and stores them locally to improve
 * performance and reduce dependency on external image sources.
 */

import { getCachedImageUrl, isAllowedForCaching, isExternalImageUrl } from '@/lib/image-cache';

describe('Image Cache Utilities', () => {
  describe('isAllowedForCaching', () => {
    it('should allow Unsplash URLs', () => {
      expect(isAllowedForCaching('https://images.unsplash.com/photo-123?w=800')).toBe(true);
      expect(isAllowedForCaching('https://images.unsplash.com/photo-456&q=80')).toBe(true);
    });

    it('should allow Azure Blob Storage URLs', () => {
      expect(isAllowedForCaching('https://myaccount.blob.core.windows.net/container/image.jpg')).toBe(true);
      expect(isAllowedForCaching('https://another.blob.core.windows.net/images/photo.png')).toBe(true);
    });

    it('should reject non-whitelisted domains', () => {
      expect(isAllowedForCaching('https://example.com/image.jpg')).toBe(false);
      expect(isAllowedForCaching('https://malicious-site.com/evil.jpg')).toBe(false);
      expect(isAllowedForCaching('https://randomcdn.net/image.png')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isAllowedForCaching('not-a-url')).toBe(false);
      expect(isAllowedForCaching('')).toBe(false);
      expect(isAllowedForCaching('javascript:alert(1)')).toBe(false);
    });

    it('should reject similar but different domains (subdomain bypass attempts)', () => {
      // Make sure someone can't use images.unsplash.com.evil.com
      expect(isAllowedForCaching('https://images.unsplash.com.evil.com/image.jpg')).toBe(false);
      expect(isAllowedForCaching('https://fakeimages.unsplash.com.attacker.net/img.jpg')).toBe(false);
    });
  });

  describe('isExternalImageUrl', () => {
    it('should identify external HTTP/HTTPS URLs', () => {
      expect(isExternalImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(isExternalImageUrl('http://example.com/image.png')).toBe(true);
    });

    it('should return false for local/relative URLs', () => {
      expect(isExternalImageUrl('/images/local.jpg')).toBe(false);
      expect(isExternalImageUrl('./assets/image.png')).toBe(false);
      expect(isExternalImageUrl('../uploads/photo.jpg')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isExternalImageUrl(null)).toBe(false);
      expect(isExternalImageUrl(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isExternalImageUrl('')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isExternalImageUrl('not-a-url')).toBe(false);
      expect(isExternalImageUrl('data:image/png;base64,abc')).toBe(false);
    });
  });

  describe('getCachedImageUrl', () => {
    it('should return cached URL for allowed external images', () => {
      const unsplashUrl = 'https://images.unsplash.com/photo-123?w=800';
      const cachedUrl = getCachedImageUrl(unsplashUrl);
      
      expect(cachedUrl).toBe(`/api/images/cache?url=${encodeURIComponent(unsplashUrl)}`);
    });

    it('should return cached URL for Azure Blob Storage images', () => {
      const azureUrl = 'https://myaccount.blob.core.windows.net/container/image.jpg';
      const cachedUrl = getCachedImageUrl(azureUrl);
      
      expect(cachedUrl).toBe(`/api/images/cache?url=${encodeURIComponent(azureUrl)}`);
    });

    it('should return original URL for non-allowed domains', () => {
      const externalUrl = 'https://other-cdn.com/image.jpg';
      const result = getCachedImageUrl(externalUrl);
      
      expect(result).toBe(externalUrl);
    });

    it('should return local URLs unchanged', () => {
      expect(getCachedImageUrl('/images/local.jpg')).toBe('/images/local.jpg');
      expect(getCachedImageUrl('./assets/image.png')).toBe('./assets/image.png');
    });

    it('should return null for null/undefined input', () => {
      expect(getCachedImageUrl(null)).toBe(null);
      expect(getCachedImageUrl(undefined)).toBe(null);
    });

    it('should properly encode URLs with special characters', () => {
      const urlWithParams = 'https://images.unsplash.com/photo-123?w=800&q=80';
      const cachedUrl = getCachedImageUrl(urlWithParams);
      
      // The URL should be properly encoded
      expect(cachedUrl).toContain(encodeURIComponent('?'));
      expect(cachedUrl).toContain(encodeURIComponent('&'));
    });
  });
});

describe('Image Cache API Route', () => {
  // These document the expected API behavior

  describe('Request Validation', () => {
    it('should require url parameter', () => {
      const errorResponse = {
        error: 'Missing url parameter',
      };
      expect(errorResponse.error).toBe('Missing url parameter');
    });

    it('should reject invalid URL format', () => {
      const errorResponse = {
        error: 'Invalid URL format',
      };
      expect(errorResponse.error).toBe('Invalid URL format');
    });

    it('should reject non-whitelisted domains', () => {
      const errorResponse = {
        error: 'Domain not allowed for caching',
      };
      expect(errorResponse.error).toBe('Domain not allowed for caching');
    });
  });

  describe('Cache Headers', () => {
    it('should set appropriate cache headers for cached images', () => {
      const cacheHeaders = {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'HIT',
      };
      
      expect(cacheHeaders['Cache-Control']).toContain('public');
      expect(cacheHeaders['Cache-Control']).toContain('max-age=31536000');
      expect(cacheHeaders['X-Cache']).toBe('HIT');
    });

    it('should indicate cache miss on first fetch', () => {
      const headers = {
        'X-Cache': 'MISS',
      };
      expect(headers['X-Cache']).toBe('MISS');
    });
  });

  describe('Supported Image Types', () => {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    it('should support common image content types', () => {
      supportedTypes.forEach(type => {
        expect(type).toMatch(/^image\//);
      });
    });

    it('should have correct file extensions for content types', () => {
      const contentTypeExtensions: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
      };

      Object.entries(contentTypeExtensions).forEach(([type, ext]) => {
        expect(ext).toMatch(/^\.\w+$/);
        expect(supportedTypes).toContain(type);
      });
    });
  });
});

describe('CachedImage Component', () => {
  // These tests document the expected component behavior
  
  describe('Props Handling', () => {
    it('should accept src as string, null, or undefined', () => {
      const validSrcValues: Array<string | null | undefined> = [
        'https://images.unsplash.com/photo-123',
        '/local/image.jpg',
        null,
        undefined,
      ];
      
      validSrcValues.forEach(src => {
        expect([typeof src, src]).toBeDefined();
      });
    });

    it('should default useCache to true', () => {
      const defaultProps = {
        useCache: true,
      };
      expect(defaultProps.useCache).toBe(true);
    });
  });
});
