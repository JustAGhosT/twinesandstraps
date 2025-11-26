import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAdminAuth } from '@/lib/admin-auth';
import { siteSettingsSchema, validateBody, formatZodErrors } from '@/lib/validations';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

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

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  await mkdir(dataDir, { recursive: true });
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    await ensureDataDir();
    const data = await readFile(SETTINGS_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    // Return default settings if file doesn't exist
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
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

    await ensureDataDir();

    // Merge with existing settings
    let existingSettings = DEFAULT_SETTINGS;
    try {
      const data = await readFile(SETTINGS_FILE, 'utf-8');
      existingSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      // Use defaults if file doesn't exist
    }

    const updatedSettings = { ...existingSettings, ...validation.data };
    await writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2));

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings. Please try again.' },
      { status: 500 }
    );
  }
}
