'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export interface SiteSettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  vatRate: string;
  logoUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedIn: string;
  socialTwitter: string;
  socialYoutube: string;
}

const defaultSettings: SiteSettings = {
  companyName: 'Twines and Straps SA (Pty) Ltd',
  tagline: 'Boundless Strength, Endless Solutions!',
  email: 'admin@tassa.co.za',
  phone: '+27 (0)63 969 0773',
  whatsappNumber: '27639690773',
  address: '',
  businessHours: 'Mon-Fri 8:00-17:00',
  vatRate: '15',
  logoUrl: '',
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedIn: '',
  socialTwitter: '',
  socialYoutube: '',
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...defaultSettings, ...(data.data || {}) });
      } else {
        logWarn('Failed to fetch settings, using defaults');
      }
    } catch (err) {
      logError('Error fetching settings:', err);
      setError('Failed to load site settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextType {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}
