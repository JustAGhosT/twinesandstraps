'use client';

import { useState, useEffect } from 'react';

const LOGO_PATH = '/logo.svg';

/**
 * Custom hook to check if a custom logo exists and provide its URL.
 * Used by Header and AdminSidebar components to display the logo.
 */
export function useCustomLogo(): string | null {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkLogo = async () => {
      try {
        // Try to fetch the logo file to check if it exists
        const response = await fetch(LOGO_PATH, { method: 'HEAD' });
        if (response.ok) {
          setLogoUrl(LOGO_PATH);
        }
      } catch {
        // Logo doesn't exist, use default
      }
    };
    checkLogo();
  }, []);

  return logoUrl;
}
