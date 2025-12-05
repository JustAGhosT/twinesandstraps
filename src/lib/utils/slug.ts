/**
 * Slug generation and validation utilities
 */

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 100 characters
    .substring(0, 100);
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkUnique: (slug: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const isUnique = await checkUnique(slug);
    
    if (isUnique) {
      return slug;
    }

    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // Fallback: append timestamp if max attempts reached
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  // Slug should be lowercase, alphanumeric with hyphens, 1-100 chars
  return /^[a-z0-9-]{1,100}$/.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
}

