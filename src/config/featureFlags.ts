/**
 * Feature Flags Configuration
 *
 * Toggle features on/off without code changes.
 * Set via environment variables or defaults below.
 *
 * Environment variables should be prefixed with NEXT_PUBLIC_ to be available client-side.
 */

export interface FeatureFlags {
  // Marketing & Engagement
  testimonials: boolean;
  newsletterSignup: boolean;
  whatsappButton: boolean;
  trustBadges: boolean;

  // E-commerce Features
  relatedProducts: boolean;
  recommendedProducts: boolean;
  quickAddToCart: boolean;
  productZoom: boolean;

  // UI/UX Features
  backToTop: boolean;
  searchBar: boolean;

  // Future Features (disabled by default)
  productReviews: boolean;
  wishlist: boolean;
  compareProducts: boolean;
}

/**
 * Parse boolean from environment variable
 */
function envBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Feature flags with environment variable overrides
 *
 * To disable a feature, set the environment variable to 'false' or '0'
 * Example: NEXT_PUBLIC_FEATURE_TESTIMONIALS=false
 */
export const featureFlags: FeatureFlags = {
  // Marketing & Engagement - enabled by default
  testimonials: envBool(process.env.NEXT_PUBLIC_FEATURE_TESTIMONIALS, true),
  newsletterSignup: envBool(process.env.NEXT_PUBLIC_FEATURE_NEWSLETTER, true),
  whatsappButton: envBool(process.env.NEXT_PUBLIC_FEATURE_WHATSAPP, true),
  trustBadges: envBool(process.env.NEXT_PUBLIC_FEATURE_TRUST_BADGES, true),

  // E-commerce Features - enabled by default
  relatedProducts: envBool(process.env.NEXT_PUBLIC_FEATURE_RELATED_PRODUCTS, true),
  recommendedProducts: envBool(process.env.NEXT_PUBLIC_FEATURE_RECOMMENDED_PRODUCTS, true),
  quickAddToCart: envBool(process.env.NEXT_PUBLIC_FEATURE_QUICK_ADD_CART, true),
  productZoom: envBool(process.env.NEXT_PUBLIC_FEATURE_PRODUCT_ZOOM, true),

  // UI/UX Features - enabled by default
  backToTop: envBool(process.env.NEXT_PUBLIC_FEATURE_BACK_TO_TOP, true),
  searchBar: envBool(process.env.NEXT_PUBLIC_FEATURE_SEARCH_BAR, true),

  // Future Features - disabled by default
  productReviews: envBool(process.env.NEXT_PUBLIC_FEATURE_PRODUCT_REVIEWS, false),
  wishlist: envBool(process.env.NEXT_PUBLIC_FEATURE_WISHLIST, false),
  compareProducts: envBool(process.env.NEXT_PUBLIC_FEATURE_COMPARE_PRODUCTS, false),
};

/**
 * Helper to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Get all disabled features (useful for debugging)
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature);
}
