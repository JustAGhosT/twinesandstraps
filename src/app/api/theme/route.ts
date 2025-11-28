import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Default brand colors (TASSA Red theme)
const defaultColors = {
  primary: '#E31E24',
  primaryLight: '#ef4444',
  primaryDark: '#b91c1c',
  secondary: '#1A1A1A',
  secondaryLight: '#404040',
  secondaryDark: '#0a0a0a',
  accent: '#6B6B6B',
};

// GET /api/theme - Public endpoint to get theme colors
export async function GET() {
  try {
    // Try to get theme from database
    const settings = await prisma.siteSetting.findFirst({
      select: {
        // We'll store theme colors in a JSON column or as individual fields
        // For now, return default colors (can be extended later)
      },
    });

    // For now, return default colors
    // TODO: Once theme_colors column is added, read from database
    return NextResponse.json({
      colors: defaultColors,
      source: 'default',
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    // Return defaults on error
    return NextResponse.json({
      colors: defaultColors,
      source: 'fallback',
    });
  }
}
