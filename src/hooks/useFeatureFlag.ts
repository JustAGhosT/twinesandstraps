import { featureFlags, type FeatureFlags } from '@/config/featureFlags';

/**
 * Hook to check if a feature is enabled
 *
 * @example
 * const showTestimonials = useFeatureFlag('testimonials');
 * if (showTestimonials) { ... }
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Hook to get multiple feature flags at once
 *
 * @example
 * const { testimonials, newsletter } = useFeatureFlags(['testimonials', 'newsletterSignup']);
 */
export function useFeatureFlags<K extends keyof FeatureFlags>(
  features: K[]
): Pick<FeatureFlags, K> {
  return features.reduce((acc, feature) => {
    acc[feature] = featureFlags[feature];
    return acc;
  }, {} as Pick<FeatureFlags, K>);
}

/**
 * Get all feature flags (useful for debugging)
 */
export function useAllFeatureFlags(): FeatureFlags {
  return featureFlags;
}
