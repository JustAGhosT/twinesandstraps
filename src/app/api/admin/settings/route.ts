import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { siteSettingsSchema, validateBody, formatZodErrors } from '@/lib/validations';

// Singleton ID for site settings - there's only one settings record
const SITE_SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  companyName: 'Twines and Straps SA (Pty) Ltd',
  tagline: 'Boundless Strength, Endless Solutions!',
  email: 'info@twinesandstraps.co.za',
  phone: '+27 (0) 11 234 5678',
  whatsappNumber: '27XXXXXXXXX',
  address: '',
  businessHours: 'Mon-Fri 8:00-17:00',
  vatRate: '15',
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedIn: '',
};

// Type for database format fields
interface DbSettingsUpdate {
  company_name?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  address?: string;
  business_hours?: string;
  vat_rate?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
}

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
  social_facebook: string;
  social_instagram: string;
  social_linkedin: string;
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
    socialFacebook: dbSettings.social_facebook,
    socialInstagram: dbSettings.social_instagram,
    socialLinkedIn: dbSettings.social_linkedin,
  };
}

// Helper to convert API format to database fields
function apiToDbFormat(apiSettings: {
  companyName?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  businessHours?: string;
  vatRate?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialLinkedIn?: string;
}): DbSettingsUpdate {
  const dbData: DbSettingsUpdate = {};
  if (apiSettings.companyName !== undefined) dbData.company_name = apiSettings.companyName;
  if (apiSettings.tagline !== undefined) dbData.tagline = apiSettings.tagline;
  if (apiSettings.email !== undefined) dbData.email = apiSettings.email;
  if (apiSettings.phone !== undefined) dbData.phone = apiSettings.phone;
  if (apiSettings.whatsappNumber !== undefined) dbData.whatsapp_number = apiSettings.whatsappNumber;
  if (apiSettings.address !== undefined) dbData.address = apiSettings.address;
  if (apiSettings.businessHours !== undefined) dbData.business_hours = apiSettings.businessHours;
  if (apiSettings.vatRate !== undefined) dbData.vat_rate = apiSettings.vatRate;
  if (apiSettings.socialFacebook !== undefined) dbData.social_facebook = apiSettings.socialFacebook;
  if (apiSettings.socialInstagram !== undefined) dbData.social_instagram = apiSettings.socialInstagram;
  if (apiSettings.socialLinkedIn !== undefined) dbData.social_linkedin = apiSettings.socialLinkedIn;
  return dbData;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

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
    console.error('Error fetching settings:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

// Field labels for human-readable change messages
const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  tagline: 'Tagline',
  email: 'Email Address',
  phone: 'Phone Number',
  whatsappNumber: 'WhatsApp Number',
  address: 'Address',
  businessHours: 'Business Hours',
  vatRate: 'VAT Rate',
  socialFacebook: 'Facebook URL',
  socialInstagram: 'Instagram URL',
  socialLinkedIn: 'LinkedIn URL',
};

// Helper to detect which fields changed
function getChangedFields(
  oldSettings: Record<string, string>,
  newSettings: Record<string, string>
): string[] {
  const changedFields: string[] = [];
  for (const key of Object.keys(newSettings)) {
    if (oldSettings[key] !== newSettings[key]) {
      changedFields.push(key);
    }
  }
  return changedFields;
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input
    const validation = validateBody(siteSettingsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    // Get current settings to compare for changes
    const currentSettings = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });

    const currentApiFormat = currentSettings 
      ? dbToApiFormat(currentSettings)
      : DEFAULT_SETTINGS;

    // Determine which fields changed
    const changedFields = getChangedFields(
      currentApiFormat as unknown as Record<string, string>,
      validation.data as unknown as Record<string, string>
    );

    // Convert to database format
    const dbData = apiToDbFormat(validation.data);

    // Upsert settings (create if doesn't exist, update if exists)
    const updatedSettings = await prisma.siteSetting.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        ...dbData,
      },
      update: dbData,
    });

    // Build human-readable change summary
    const changedFieldLabels = changedFields.map(field => FIELD_LABELS[field] || field);

    return NextResponse.json({ 
      success: true, 
      settings: dbToApiFormat(updatedSettings),
      changedFields,
      changedFieldLabels,
      changeCount: changedFields.length,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings. Please try again.' },
      { status: 500 }
    );
  }
}
