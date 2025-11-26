'use client';

import React, { useState, useEffect } from 'react';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
}

const defaultColors: ThemeColors = {
  primary: '#ea580c', // orange-600
  primaryLight: '#f97316', // orange-500
  primaryDark: '#c2410c', // orange-700
  secondary: '#1c1917', // stone-900
  secondaryLight: '#44403c', // stone-700
  secondaryDark: '#0c0a09', // stone-950
  accent: '#16a34a', // green-600
};

const presetThemes = [
  { name: 'Default Orange', colors: defaultColors },
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
    name: 'Red Bold',
    colors: {
      primary: '#dc2626',
      primaryLight: '#ef4444',
      primaryDark: '#b91c1c',
      secondary: '#1c1917',
      secondaryLight: '#44403c',
      secondaryDark: '#0c0a09',
      accent: '#0891b2',
    },
  },
];

const THEME_KEY = 'tassa_theme_colors';

export default function ThemePage() {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      try {
        setColors({ ...defaultColors, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Error loading theme:', e);
      }
    }
  }, []);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
    setSaved(false);

    // Live preview
    document.documentElement.style.setProperty(`--color-${key}`, value);
  };

  const applyPreset = (preset: typeof presetThemes[0]) => {
    setColors(preset.colors);
    setSaved(false);

    // Live preview
    Object.entries(preset.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
  };

  const handleSave = () => {
    localStorage.setItem(THEME_KEY, JSON.stringify(colors));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setColors(defaultColors);
    localStorage.removeItem(THEME_KEY);

    // Reset CSS variables
    Object.entries(defaultColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });

    setSaved(false);
  };

  const colorFields: { key: keyof ThemeColors; label: string; description: string }[] = [
    { key: 'primary', label: 'Primary Color', description: 'Main brand color for buttons, links, and accents' },
    { key: 'primaryLight', label: 'Primary Light', description: 'Lighter shade for hover states' },
    { key: 'primaryDark', label: 'Primary Dark', description: 'Darker shade for active states' },
    { key: 'secondary', label: 'Secondary Color', description: 'Dark color for text and headers' },
    { key: 'secondaryLight', label: 'Secondary Light', description: 'Lighter shade for secondary elements' },
    { key: 'secondaryDark', label: 'Secondary Dark', description: 'Darkest shade for backgrounds' },
    { key: 'accent', label: 'Accent Color', description: 'Highlight color for special elements' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Theme & Colors</h1>
          <p className="text-gray-500 mt-1">Customize your website colors</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved!
            </span>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color Pickers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorFields.map(field => (
                <div key={field.key} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-secondary-900">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{field.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Preset Themes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Preset Themes</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {presetThemes.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-center"
                >
                  <div className="flex gap-1 justify-center mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.colors.secondary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.colors.accent }}
                    />
                  </div>
                  <span className="text-sm font-medium text-secondary-900">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Preview</h2>

            {/* Button Preview */}
            <div className="space-y-3 mb-6">
              <button
                style={{ backgroundColor: colors.primary }}
                className="w-full py-2 px-4 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Primary Button
              </button>
              <button
                style={{ backgroundColor: colors.secondary }}
                className="w-full py-2 px-4 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Secondary Button
              </button>
              <button
                style={{ backgroundColor: colors.accent }}
                className="w-full py-2 px-4 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Accent Button
              </button>
            </div>

            {/* Text Preview */}
            <div className="space-y-2 mb-6">
              <h3 style={{ color: colors.secondary }} className="text-xl font-bold">
                Heading Text
              </h3>
              <p style={{ color: colors.secondaryLight }} className="text-sm">
                This is secondary text color for descriptions and captions.
              </p>
              <a style={{ color: colors.primary }} className="text-sm font-medium cursor-pointer hover:underline">
                This is a link
              </a>
            </div>

            {/* Card Preview */}
            <div
              style={{ backgroundColor: colors.secondaryDark }}
              className="p-4 rounded-lg text-white"
            >
              <h4 className="font-semibold mb-1">Dark Card</h4>
              <p className="text-sm opacity-80">Preview of dark backgrounds</p>
              <span style={{ color: colors.primary }} className="text-sm font-medium">
                Accent link color
              </span>
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Export</h2>
            <p className="text-sm text-gray-500 mb-3">
              Copy these values to update your Tailwind config:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// tailwind.config.js
colors: {
  primary: {
    500: '${colors.primaryLight}',
    600: '${colors.primary}',
    700: '${colors.primaryDark}',
  },
  secondary: {
    700: '${colors.secondaryLight}',
    900: '${colors.secondary}',
    950: '${colors.secondaryDark}',
  },
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How to Apply Changes Permanently</h3>
        <p className="text-sm text-blue-700">
          Changes made here are previewed locally. To apply them permanently across your website:
        </p>
        <ol className="text-sm text-blue-700 list-decimal list-inside mt-2 space-y-1">
          <li>Copy the exported Tailwind config values above</li>
          <li>Update your <code className="bg-blue-100 px-1 rounded">tailwind.config.ts</code> file</li>
          <li>Rebuild and deploy your website</li>
        </ol>
      </div>
    </div>
  );
}
