'use client';

import React from 'react';
import { featureFlags, type FeatureFlags } from '@/config/featureFlags';

interface FeatureFlagProps {
  /** The feature flag to check */
  feature: keyof FeatureFlags;
  /** Content to render when feature is enabled */
  children: React.ReactNode;
  /** Optional fallback content when feature is disabled */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render content based on feature flag
 *
 * @example
 * <FeatureFlag feature="testimonials">
 *   <Testimonials />
 * </FeatureFlag>
 *
 * @example with fallback
 * <FeatureFlag feature="whatsappButton" fallback={<EmailButton />}>
 *   <WhatsAppButton />
 * </FeatureFlag>
 */
export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const isEnabled = featureFlags[feature];

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Server-side feature flag check (for Server Components)
 * Returns children only if feature is enabled
 */
export function withFeatureFlag(
  feature: keyof FeatureFlags,
  content: React.ReactNode,
  fallback: React.ReactNode = null
): React.ReactNode {
  return featureFlags[feature] ? content : fallback;
}

export default FeatureFlag;
