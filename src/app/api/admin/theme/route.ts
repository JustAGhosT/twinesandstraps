import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Verify admin authentication
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) return false;

  // Simple validation - in production use JWT or session validation
  return token.length > 0;
}

// POST /api/admin/theme - Save theme colors (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { colors } = body;

    if (!colors || typeof colors !== 'object') {
      return NextResponse.json(
        { error: 'Invalid colors data' },
        { status: 400 }
      );
    }

    // Validate color format
    const requiredKeys = ['primary', 'primaryLight', 'primaryDark', 'secondary', 'secondaryLight', 'secondaryDark', 'accent'];
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    for (const key of requiredKeys) {
      if (!colors[key] || !hexColorRegex.test(colors[key])) {
        return NextResponse.json(
          { error: `Invalid color value for ${key}` },
          { status: 400 }
        );
      }
    }

    // TODO: Save to database once theme_colors column is added
    // For now, theme colors are stored client-side in localStorage
    // This endpoint exists for future database persistence

    return NextResponse.json({
      success: true,
      message: 'Theme colors saved successfully',
      colors,
    });
  } catch (error) {
    logError('Error saving theme:', error);
    return NextResponse.json(
      { error: 'Failed to save theme colors' },
      { status: 500 }
    );
  }
}

// GET /api/admin/theme - Get current theme colors (admin only)
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Default colors
    const defaultColors = {
      primary: '#E31E24',
      primaryLight: '#ef4444',
      primaryDark: '#b91c1c',
      secondary: '#1A1A1A',
      secondaryLight: '#404040',
      secondaryDark: '#0a0a0a',
      accent: '#6B6B6B',
    };

    // TODO: Fetch from database once theme_colors column is added
    return NextResponse.json({
      colors: defaultColors,
      source: 'default',
    });
  } catch (error) {
    logError('Error fetching admin theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    );
  }
}
