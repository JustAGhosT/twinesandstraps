'use client';

import React, { useState, useEffect } from 'react';
import { featureFlags, type FeatureFlags } from '@/config/featureFlags';

interface FeatureConfig {
  key: keyof FeatureFlags;
  name: string;
  description: string;
  category: string;
  envVar: string;
}

const featureConfigs: FeatureConfig[] = [
  // Marketing & Engagement
  {
    key: 'testimonials',
    name: 'Testimonials',
    description: 'Show customer testimonials on the homepage',
    category: 'Marketing & Engagement',
    envVar: 'NEXT_PUBLIC_FEATURE_TESTIMONIALS',
  },
  {
    key: 'newsletterSignup',
    name: 'Newsletter Signup',
    description: 'Display newsletter signup form in footer',
    category: 'Marketing & Engagement',
    envVar: 'NEXT_PUBLIC_FEATURE_NEWSLETTER',
  },
  {
    key: 'whatsappButton',
    name: 'WhatsApp Button',
    description: 'Floating WhatsApp chat button',
    category: 'Marketing & Engagement',
    envVar: 'NEXT_PUBLIC_FEATURE_WHATSAPP',
  },
  {
    key: 'trustBadges',
    name: 'Trust Badges',
    description: 'Display trust badges (local manufacturing, SA made, etc.)',
    category: 'Marketing & Engagement',
    envVar: 'NEXT_PUBLIC_FEATURE_TRUST_BADGES',
  },

  // E-commerce Features
  {
    key: 'relatedProducts',
    name: 'Related Products',
    description: 'Show related products on product pages',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_RELATED_PRODUCTS',
  },
  {
    key: 'recommendedProducts',
    name: 'Recommended Products',
    description: 'Display recommended products section',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_RECOMMENDED_PRODUCTS',
  },
  {
    key: 'quickAddToCart',
    name: 'Quick Add to Cart',
    description: 'Add to cart button on product cards',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_QUICK_ADD_CART',
  },
  {
    key: 'productZoom',
    name: 'Product Image Zoom',
    description: 'Enable zoom on product images',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_PRODUCT_ZOOM',
  },
  {
    key: 'productReviews',
    name: 'Product Reviews',
    description: 'Allow customers to leave product reviews',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_PRODUCT_REVIEWS',
  },
  {
    key: 'wishlist',
    name: 'Wishlist',
    description: 'Enable product wishlist functionality',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_WISHLIST',
  },
  {
    key: 'compareProducts',
    name: 'Compare Products',
    description: 'Allow customers to compare products',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_COMPARE_PRODUCTS',
  },
  {
    key: 'showPrices',
    name: 'Show Prices',
    description: 'Display product prices on the website (disable for quote-only mode)',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_SHOW_PRICES',
  },
  {
    key: 'checkout',
    name: 'Checkout',
    description: 'Enable full checkout flow (disabled = WhatsApp quote only)',
    category: 'E-commerce Features',
    envVar: 'NEXT_PUBLIC_FEATURE_CHECKOUT',
  },

  // User Features
  {
    key: 'userAuth',
    name: 'User Authentication',
    description: 'Enable user registration and login',
    category: 'User Features',
    envVar: 'NEXT_PUBLIC_FEATURE_USER_AUTH',
  },
  {
    key: 'viewHistory',
    name: 'View History',
    description: 'Track product view history for logged-in users',
    category: 'User Features',
    envVar: 'NEXT_PUBLIC_FEATURE_VIEW_HISTORY',
  },
  {
    key: 'recentlyViewed',
    name: 'Recently Viewed',
    description: 'Show recently viewed products on product pages',
    category: 'User Features',
    envVar: 'NEXT_PUBLIC_FEATURE_RECENTLY_VIEWED',
  },

  // UI/UX Features
  {
    key: 'backToTop',
    name: 'Back to Top',
    description: 'Floating back to top button',
    category: 'UI/UX Features',
    envVar: 'NEXT_PUBLIC_FEATURE_BACK_TO_TOP',
  },
  {
    key: 'searchBar',
    name: 'Search Bar',
    description: 'Product search functionality',
    category: 'UI/UX Features',
    envVar: 'NEXT_PUBLIC_FEATURE_SEARCH_BAR',
  },
];

const FEATURE_OVERRIDES_KEY = 'tassa_feature_overrides';

export default function FeaturesPage() {
  const [overrides, setOverrides] = useState<Partial<FeatureFlags>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FEATURE_OVERRIDES_KEY);
    if (stored) {
      try {
        setOverrides(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading feature overrides:', e);
      }
    }
  }, []);

  const getEffectiveValue = (key: keyof FeatureFlags) => {
    return key in overrides ? overrides[key] : featureFlags[key];
  };

  const handleToggle = (key: keyof FeatureFlags) => {
    const currentValue = getEffectiveValue(key);
    setOverrides(prev => ({ ...prev, [key]: !currentValue }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(FEATURE_OVERRIDES_KEY, JSON.stringify(overrides));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setOverrides({});
    localStorage.removeItem(FEATURE_OVERRIDES_KEY);
    setSaved(false);
  };

  // Group by category
  const categories = Array.from(new Set(featureConfigs.map(f => f.category)));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Feature Flags</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enable or disable website features</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved!
            </span>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map(category => (
          <div key={category} className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">{category}</h2>
            <div className="space-y-4">
              {featureConfigs
                .filter(f => f.category === category)
                .map(feature => {
                  const isEnabled = getEffectiveValue(feature.key);
                  const isOverridden = feature.key in overrides;
                  return (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-secondary-900 dark:text-white">{feature.name}</h3>
                          {isOverridden && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                              Modified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.description}</p>
                        <code className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{feature.envVar}</code>
                      </div>
                      <button
                        onClick={() => handleToggle(feature.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Important Note</h3>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Changes made here are saved to browser storage for preview purposes.
          For permanent changes that affect all visitors, you need to update the environment variables
          in your deployment settings. See the <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">docs/FEATURE_FLAGS.md</code> file for details.
        </p>
      </div>
    </div>
  );
}
