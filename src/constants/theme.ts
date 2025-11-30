/**
 * Theme-related constants
 * Brand colors and theme configuration
 */

// Brand colors
export const BRAND_COLORS = {
  // Primary - TASSA Red
  PRIMARY: '#E31E24',
  PRIMARY_LIGHT: '#ef4444',
  PRIMARY_DARK: '#b91c1c',

  // Secondary - Industrial Black
  SECONDARY: '#1A1A1A',
  SECONDARY_LIGHT: '#2d2d2d',
  SECONDARY_DARK: '#0d0d0d',

  // Accent - Steel Gray
  ACCENT: '#6B6B6B',
  ACCENT_LIGHT: '#8a8a8a',
  ACCENT_DARK: '#4a4a4a',

  // Warm - Rope Beige
  WARM: '#C4B8A5',

  // Product accents
  SAFETY_ORANGE: '#E87722',
  MARINE_BLUE: '#2B5C9E',
} as const;

// Theme presets
export const THEME_PRESETS = {
  TASSA_RED: {
    name: 'TASSA Red',
    primary: '#E31E24',
    secondary: '#1A1A1A',
    accent: '#6B6B6B',
  },
  BLUE_PROFESSIONAL: {
    name: 'Blue Professional',
    primary: '#2563eb',
    secondary: '#1e293b',
    accent: '#64748b',
  },
  GREEN_NATURE: {
    name: 'Green Nature',
    primary: '#16a34a',
    secondary: '#1a2e1a',
    accent: '#4b5563',
  },
  PURPLE_PREMIUM: {
    name: 'Purple Premium',
    primary: '#9333ea',
    secondary: '#1e1b2e',
    accent: '#6b7280',
  },
} as const;

// Theme modes
export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type ThemeMode = typeof THEME_MODE[keyof typeof THEME_MODE];

// Default theme configuration
export const DEFAULT_THEME = {
  mode: THEME_MODE.LIGHT,
  colors: THEME_PRESETS.TASSA_RED,
} as const;
