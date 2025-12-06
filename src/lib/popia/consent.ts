/**
 * POPIA (Protection of Personal Information Act) Compliance
 * Consent management utilities
 */

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export type ConsentType = 'MARKETING' | 'ANALYTICS' | 'FUNCTIONAL' | 'NECESSARY';

export interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
  necessary: boolean; // Always true, cannot be disabled
  timestamp: Date;
}

const CONSENT_COOKIE = 'consent-preferences';
const CONSENT_EXPIRY_DAYS = 365;

/**
 * Get user consent preferences from cookie
 */
export async function getConsentPreferences(): Promise<ConsentPreferences> {
  const cookieStore = await cookies();
  const consentCookie = cookieStore.get(CONSENT_COOKIE);

  if (!consentCookie?.value) {
    // Default: only necessary cookies
    return {
      marketing: false,
      analytics: false,
      functional: false,
      necessary: true,
      timestamp: new Date(),
    };
  }

  try {
    const parsed = JSON.parse(consentCookie.value);
    return {
      marketing: parsed.marketing || false,
      analytics: parsed.analytics || false,
      functional: parsed.functional || false,
      necessary: true, // Always true
      timestamp: new Date(parsed.timestamp || Date.now()),
    };
  } catch {
    // Invalid cookie, return defaults
    return {
      marketing: false,
      analytics: false,
      functional: false,
      necessary: true,
      timestamp: new Date(),
    };
  }
}

/**
 * Set consent preferences in cookie
 */
export async function setConsentPreferences(
  preferences: Omit<ConsentPreferences, 'necessary' | 'timestamp'>
): Promise<void> {
  const cookieStore = await cookies();
  const consentData: ConsentPreferences = {
    ...preferences,
    necessary: true,
    timestamp: new Date(),
  };

  cookieStore.set(CONSENT_COOKIE, JSON.stringify(consentData), {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CONSENT_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Check if user has given consent for a specific type
 */
export async function hasConsent(type: ConsentType): Promise<boolean> {
  const preferences = await getConsentPreferences();

  switch (type) {
    case 'NECESSARY':
      return true; // Always allowed
    case 'MARKETING':
      return preferences.marketing;
    case 'ANALYTICS':
      return preferences.analytics;
    case 'FUNCTIONAL':
      return preferences.functional;
    default:
      return false;
  }
}

/**
 * Store user consent in database (for logged-in users)
 */
export async function storeUserConsent(
  userId: number,
  preferences: Omit<ConsentPreferences, 'necessary' | 'timestamp'>
): Promise<void> {
  await prisma.userConsent.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      marketing_consent: preferences.marketing,
      analytics_consent: preferences.analytics,
      functional_consent: preferences.functional,
      consent_date: new Date(),
    },
    update: {
      marketing_consent: preferences.marketing,
      analytics_consent: preferences.analytics,
      functional_consent: preferences.functional,
      consent_date: new Date(),
    },
  });
}

/**
 * Get user consent from database
 */
export async function getUserConsent(userId: number): Promise<ConsentPreferences | null> {
  const consent = await prisma.userConsent.findUnique({
    where: { user_id: userId },
  });

  if (!consent) {
    return null;
  }

  return {
    marketing: consent.marketing_consent,
    analytics: consent.analytics_consent,
    functional: consent.functional_consent,
    necessary: true,
    timestamp: consent.consent_date,
  };
}

