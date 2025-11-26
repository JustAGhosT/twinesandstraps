import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  await mkdir(dataDir, { recursive: true });
}

export async function GET() {
  try {
    await ensureDataDir();
    const data = await readFile(SETTINGS_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    // Return default settings if file doesn't exist
    return NextResponse.json({
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
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    const settings = await request.json();
    await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
