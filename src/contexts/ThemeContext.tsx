'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

// Brand colors that can be customized
export interface BrandColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
}

// Default TASSA brand colors
export const defaultBrandColors: BrandColors = {
  primary: '#E31E24',      // TASSA Red
  primaryLight: '#ef4444',
  primaryDark: '#b91c1c',
  secondary: '#1A1A1A',    // Industrial Black
  secondaryLight: '#404040',
  secondaryDark: '#0a0a0a',
  accent: '#6B6B6B',       // Steel Gray
};

// Preset themes
export const presetThemes: { name: string; colors: BrandColors }[] = [
  { name: 'TASSA Red', colors: defaultBrandColors },
  {
    name: 'Blue Professional',
    colors: {
      primary: '#2563eb',
      primaryLight: '#3b82f6',
      primaryDark: '#1d4ed8',
      secondary: '#1e293b',
      secondaryLight: '#334155',
      secondaryDark: '#0f172a',
      accent: '#10b981',
    },
  },
  {
    name: 'Green Nature',
    colors: {
      primary: '#16a34a',
      primaryLight: '#22c55e',
      primaryDark: '#15803d',
      secondary: '#1c1917',
      secondaryLight: '#44403c',
      secondaryDark: '#0c0a09',
      accent: '#ea580c',
    },
  },
  {
    name: 'Purple Premium',
    colors: {
      primary: '#7c3aed',
      primaryLight: '#8b5cf6',
      primaryDark: '#6d28d9',
      secondary: '#18181b',
      secondaryLight: '#3f3f46',
      secondaryDark: '#09090b',
      accent: '#f59e0b',
    },
  },
  {
    name: 'Orange Bold',
    colors: {
      primary: '#ea580c',
      primaryLight: '#f97316',
      primaryDark: '#c2410c',
      secondary: '#1c1917',
      secondaryLight: '#44403c',
      secondaryDark: '#0c0a09',
      accent: '#16a34a',
    },
  },
];

interface ThemeContextType {
  // Dark/Light mode
  mode: ThemeMode;
  resolvedMode: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;

  // Brand colors
  colors: BrandColors;
  setColors: (colors: BrandColors) => void;
  setColor: (key: keyof BrandColors, value: string) => void;
  applyPreset: (preset: typeof presetThemes[0]) => void;
  resetColors: () => void;

  // Persistence
  saveToServer: () => Promise<boolean>;
  isSaving: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const MODE_STORAGE_KEY = 'tassa_theme_mode';
const COLORS_STORAGE_KEY = 'tassa_theme_colors';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getStoredColors(): BrandColors {
  if (typeof window === 'undefined') return defaultBrandColors;
  const stored = localStorage.getItem(COLORS_STORAGE_KEY);
  if (stored) {
    try {
      return { ...defaultBrandColors, ...JSON.parse(stored) };
    } catch {
      return defaultBrandColors;
    }
  }
  return defaultBrandColors;
}

function applyColorsToCSS(colors: BrandColors) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Apply as CSS custom properties
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-light', colors.primaryLight);
  root.style.setProperty('--color-primary-dark', colors.primaryDark);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-secondary-light', colors.secondaryLight);
  root.style.setProperty('--color-secondary-dark', colors.secondaryDark);
  root.style.setProperty('--color-accent', colors.accent);

  // Also apply to Tailwind-compatible classes by setting RGB values
  root.style.setProperty('--color-primary-rgb', hexToRgb(colors.primary));
  root.style.setProperty('--color-secondary-rgb', hexToRgb(colors.secondary));
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '0, 0, 0';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedMode, setResolvedMode] = useState<ResolvedTheme>('light');
  const [colors, setColorsState] = useState<BrandColors>(defaultBrandColors);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Resolve the actual theme mode (light or dark)
  const resolveMode = useCallback((modeValue: ThemeMode): ResolvedTheme => {
    if (modeValue === 'system') {
      return getSystemTheme();
    }
    return modeValue;
  }, []);

  // Apply mode to document
  const applyMode = useCallback((resolved: ResolvedTheme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  }, []);

  // Initialize from localStorage and optionally from server
  useEffect(() => {
    const storedMode = getStoredMode();
    const resolved = resolveMode(storedMode);
    const storedColors = getStoredColors();

    setModeState(storedMode);
    setResolvedMode(resolved);
    setColorsState(storedColors);

    applyMode(resolved);
    applyColorsToCSS(storedColors);

    setMounted(true);

    // Try to load from server (for admin-set colors)
    loadFromServer();
  }, [resolveMode, applyMode]);

  // Load theme settings from server
  const loadFromServer = async () => {
    try {
      const res = await fetch('/api/theme');
      if (res.ok) {
        const data = await res.json();
        if (data.colors) {
          const serverColors = { ...defaultBrandColors, ...data.colors };
          setColorsState(serverColors);
          applyColorsToCSS(serverColors);
          localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(serverColors));
        }
      }
    } catch {
      // Server unavailable, use local storage
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (mode === 'system') {
        const resolved = getSystemTheme();
        setResolvedMode(resolved);
        applyMode(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, mounted, applyMode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    const resolved = resolveMode(newMode);
    setModeState(newMode);
    setResolvedMode(resolved);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    applyMode(resolved);
  }, [resolveMode, applyMode]);

  const toggleMode = useCallback(() => {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' :
      mode === 'dark' ? 'system' :
      'light';
    setMode(nextMode);
  }, [mode, setMode]);

  const setColors = useCallback((newColors: BrandColors) => {
    setColorsState(newColors);
    applyColorsToCSS(newColors);
    localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(newColors));
  }, []);

  const setColor = useCallback((key: keyof BrandColors, value: string) => {
    setColorsState(prev => {
      const newColors = { ...prev, [key]: value };
      applyColorsToCSS(newColors);
      localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(newColors));
      return newColors;
    });
  }, []);

  const applyPreset = useCallback((preset: typeof presetThemes[0]) => {
    setColors(preset.colors);
  }, [setColors]);

  const resetColors = useCallback(() => {
    setColors(defaultBrandColors);
  }, [setColors]);

  const saveToServer = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [colors]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        mode: 'system',
        resolvedMode: 'light',
        setMode: () => {},
        toggleMode: () => {},
        colors: defaultBrandColors,
        setColors: () => {},
        setColor: () => {},
        applyPreset: () => {},
        resetColors: () => {},
        saveToServer: async () => false,
        isSaving: false,
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{
      mode,
      resolvedMode,
      setMode,
      toggleMode,
      colors,
      setColors,
      setColor,
      applyPreset,
      resetColors,
      saveToServer,
      isSaving,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Backwards compatibility - keep old names working
export { type ThemeMode as Theme };
