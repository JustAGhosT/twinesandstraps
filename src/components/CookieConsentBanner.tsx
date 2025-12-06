/**
 * Cookie Consent Banner Component
 * POPIA compliant cookie consent management
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
}

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    marketing: false,
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Check if consent has been given
    const consentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('consent-preferences='));

    if (!consentCookie) {
      // No consent cookie found, show banner
      setShowBanner(true);
    } else {
      // Consent exists, parse it
      try {
        const consentData = JSON.parse(consentCookie.split('=')[1]);
        setPreferences({
          marketing: consentData.marketing || false,
          analytics: consentData.analytics || false,
          functional: consentData.functional || false,
        });
      } catch {
        // Invalid cookie, show banner
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = async (prefs: ConsentPreferences) => {
    const consentData = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString(),
    };

    // Set cookie
    document.cookie = `consent-preferences=${JSON.stringify(consentData)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    // If user is logged in, save to database
    try {
      await fetch('/api/user/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf-token='))
            ?.split('=')[1] || '',
        },
        body: JSON.stringify(prefs),
      });
    } catch (error) {
      console.error('Failed to save consent to database:', error);
    }

    setShowBanner(false);
    setShowSettings(false);

    // Reload page to apply consent changes
    window.location.reload();
  };

  const acceptAll = () => {
    saveConsent({
      marketing: true,
      analytics: true,
      functional: true,
    });
  };

  const acceptNecessary = () => {
    saveConsent({
      marketing: false,
      analytics: false,
      functional: false,
    });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-secondary-800 border-t border-gray-200 dark:border-secondary-700 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        {!showSettings ? (
          // Main banner
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                Cookie Consent
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
                <Link href="/privacy-policy" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-600 transition-colors"
              >
                Customize
              </button>
              <button
                onClick={acceptNecessary}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-600 transition-colors"
              >
                Necessary Only
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Settings panel
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                Cookie Preferences
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Manage your cookie preferences. You can enable or disable different types of cookies below.
              </p>
            </div>

            <div className="space-y-4">
              {/* Necessary Cookies - Always enabled */}
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-1">
                    Necessary Cookies
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Essential for the website to function properly. These cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    Always Active
                  </span>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-start justify-between p-4 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-1">
                    Functional Cookies
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable enhanced functionality and personalization.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-4 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-1">
                    Analytics Cookies
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-4 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-1">
                    Marketing Cookies
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Used to deliver personalized advertisements and track campaign performance.
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-secondary-700">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustom}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

