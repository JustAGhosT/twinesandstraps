import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Singleton ID for site settings - there's only one settings record
const SITE_SETTINGS_ID = 1;

// Default settings to use if database doesn't have settings yet
const DEFAULT_SETTINGS = {
  companyName: 'Twines and Straps SA (Pty) Ltd',
  tagline: 'Boundless Strength, Endless Solutions!',
  email: 'admin@tassa.co.za',
  phone: '+27 (0)63 969 0773',
  whatsappNumber: '27XXXXXXXXX',
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

// Helper to convert database fields to API format
function dbToApiFormat(dbSettings: {
  company_name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  business_hours: string;
  vat_rate: string;
  logo_url: string;
  social_facebook: string;
  social_instagram: string;
  social_linkedin: string;
  social_twitter: string;
  social_youtube: string;
}) {
  return {
    companyName: dbSettings.company_name,
    tagline: dbSettings.tagline,
    email: dbSettings.email,
    phone: dbSettings.phone,
    whatsappNumber: dbSettings.whatsapp_number,
    address: dbSettings.address,
    businessHours: dbSettings.business_hours,
    vatRate: dbSettings.vat_rate,
    logoUrl: dbSettings.logo_url,
    socialFacebook: dbSettings.social_facebook,
    socialInstagram: dbSettings.social_instagram,
    socialLinkedIn: dbSettings.social_linkedin,
    socialTwitter: dbSettings.social_twitter,
    socialYoutube: dbSettings.social_youtube,
  };
}

/**
 * GET /api/settings - Public endpoint to fetch site settings
 * This endpoint is intentionally public so frontend components can load settings
 */
export async function GET() {
  try {
    // Try to get settings from database (singleton pattern)
    const settings = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });

    if (settings) {
      return NextResponse.json(dbToApiFormat(settings));
    }

    // Return default settings if not found in database
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    // Return default settings on error to ensure frontend doesn't break
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}
