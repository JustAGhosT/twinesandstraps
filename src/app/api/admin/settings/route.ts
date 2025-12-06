import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { siteSettingsSchema, validateBody, formatZodErrors } from '@/lib/validations';

// Singleton ID for site settings - there's only one settings record
const SITE_SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
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
  logo_url?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_linkedin?: string;
  social_twitter?: string;
  social_youtube?: string;
  // Company registration and legal details
  company_registration_number?: string;
  tax_number?: string;
  vat_number?: string;
  bbbee_level?: string;
  physical_address?: string;
  postal_address?: string;
  postal_code?: string;
  city?: string;
  province?: string;
  country?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  branch_code?: string;
}

// Helper to convert database fields to API format
function dbToApiFormat(dbSettings: any) {
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
    // Company registration and legal details
    companyRegistrationNumber: dbSettings.company_registration_number || '',
    taxNumber: dbSettings.tax_number || '',
    vatNumber: dbSettings.vat_number || '',
    bbbeeLevel: dbSettings.bbbee_level || '',
    physicalAddress: dbSettings.physical_address || '',
    postalAddress: dbSettings.postal_address || '',
    postalCode: dbSettings.postal_code || '',
    city: dbSettings.city || '',
    province: dbSettings.province || '',
    country: dbSettings.country || 'South Africa',
    bankName: dbSettings.bank_name || '',
    bankAccountNumber: dbSettings.bank_account_number || '',
    bankAccountType: dbSettings.bank_account_type || '',
    branchCode: dbSettings.branch_code || '',
  };
}

// Helper to convert API format to database fields
function apiToDbFormat(apiSettings: any): DbSettingsUpdate {
  const dbData: DbSettingsUpdate = {};
  if (apiSettings.companyName !== undefined) dbData.company_name = apiSettings.companyName;
  if (apiSettings.tagline !== undefined) dbData.tagline = apiSettings.tagline;
  if (apiSettings.email !== undefined) dbData.email = apiSettings.email;
  if (apiSettings.phone !== undefined) dbData.phone = apiSettings.phone;
  if (apiSettings.whatsappNumber !== undefined) dbData.whatsapp_number = apiSettings.whatsappNumber;
  if (apiSettings.address !== undefined) dbData.address = apiSettings.address;
  if (apiSettings.businessHours !== undefined) dbData.business_hours = apiSettings.businessHours;
  if (apiSettings.vatRate !== undefined) dbData.vat_rate = apiSettings.vatRate;
  if (apiSettings.logoUrl !== undefined) dbData.logo_url = apiSettings.logoUrl;
  if (apiSettings.socialFacebook !== undefined) dbData.social_facebook = apiSettings.socialFacebook;
  if (apiSettings.socialInstagram !== undefined) dbData.social_instagram = apiSettings.socialInstagram;
  if (apiSettings.socialLinkedIn !== undefined) dbData.social_linkedin = apiSettings.socialLinkedIn;
  if (apiSettings.socialTwitter !== undefined) dbData.social_twitter = apiSettings.socialTwitter;
  if (apiSettings.socialYoutube !== undefined) dbData.social_youtube = apiSettings.socialYoutube;
  // Company registration and legal details
  if (apiSettings.companyRegistrationNumber !== undefined) dbData.company_registration_number = apiSettings.companyRegistrationNumber;
  if (apiSettings.taxNumber !== undefined) dbData.tax_number = apiSettings.taxNumber;
  if (apiSettings.vatNumber !== undefined) dbData.vat_number = apiSettings.vatNumber;
  if (apiSettings.bbbeeLevel !== undefined) dbData.bbbee_level = apiSettings.bbbeeLevel;
  if (apiSettings.physicalAddress !== undefined) dbData.physical_address = apiSettings.physicalAddress;
  if (apiSettings.postalAddress !== undefined) dbData.postal_address = apiSettings.postalAddress;
  if (apiSettings.postalCode !== undefined) dbData.postal_code = apiSettings.postalCode;
  if (apiSettings.city !== undefined) dbData.city = apiSettings.city;
  if (apiSettings.province !== undefined) dbData.province = apiSettings.province;
  if (apiSettings.country !== undefined) dbData.country = apiSettings.country;
  if (apiSettings.bankName !== undefined) dbData.bank_name = apiSettings.bankName;
  if (apiSettings.bankAccountNumber !== undefined) dbData.bank_account_number = apiSettings.bankAccountNumber;
  if (apiSettings.bankAccountType !== undefined) dbData.bank_account_type = apiSettings.bankAccountType;
  if (apiSettings.branchCode !== undefined) dbData.branch_code = apiSettings.branchCode;
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

// Type for API settings format
interface ApiSettings {
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

// Field labels for human-readable change messages
const FIELD_LABELS: Record<keyof ApiSettings, string> = {
  companyName: 'Company Name',
  tagline: 'Tagline',
  email: 'Email Address',
  phone: 'Phone Number',
  whatsappNumber: 'WhatsApp Number',
  address: 'Address',
  businessHours: 'Business Hours',
  vatRate: 'VAT Rate',
  logoUrl: 'Logo URL',
  socialFacebook: 'Facebook URL',
  socialInstagram: 'Instagram URL',
  socialLinkedIn: 'LinkedIn URL',
  socialTwitter: 'X (Twitter) URL',
  socialYoutube: 'YouTube URL',
};

// Helper to detect which fields changed (type-safe version)
function getChangedFields(
  oldSettings: ApiSettings,
  newSettings: Partial<ApiSettings>
): Array<keyof ApiSettings> {
  const changedFields: Array<keyof ApiSettings> = [];
  const keys = Object.keys(FIELD_LABELS) as Array<keyof ApiSettings>;
  for (const key of keys) {
    if (newSettings[key] !== undefined && oldSettings[key] !== newSettings[key]) {
      changedFields.push(key);
    }
  }
  return changedFields;
}

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

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

    const currentApiFormat: ApiSettings = currentSettings 
      ? dbToApiFormat(currentSettings)
      : DEFAULT_SETTINGS;

    // Determine which fields changed
    const changedFields = getChangedFields(currentApiFormat, validation.data);

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

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));
