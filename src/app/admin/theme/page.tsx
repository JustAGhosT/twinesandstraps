'use client';

import React from 'react';
import { useTheme, presetThemes, defaultBrandColors, type BrandColors } from '@/contexts/ThemeContext';
import { useToast } from '@/components/Toast';
import ThemeToggle from '@/components/ThemeToggle';

const colorFields: { key: keyof BrandColors; label: string; description: string }[] = [
  { key: 'primary', label: 'Primary Color', description: 'Main brand color for buttons, links, and accents' },
  { key: 'primaryLight', label: 'Primary Light', description: 'Lighter shade for hover states' },
  { key: 'primaryDark', label: 'Primary Dark', description: 'Darker shade for active states' },
  { key: 'secondary', label: 'Secondary Color', description: 'Dark color for text and headers' },
  { key: 'secondaryLight', label: 'Secondary Light', description: 'Lighter shade for secondary elements' },
  { key: 'secondaryDark', label: 'Secondary Dark', description: 'Darkest shade for backgrounds' },
  { key: 'accent', label: 'Accent Color', description: 'Highlight color for special elements' },
];

export default function ThemePage() {
  const { mode, colors, setColor, applyPreset, resetColors, saveToServer, isSaving } = useTheme();
  const { success, error } = useToast();

  const handleSave = async () => {
    const saved = await saveToServer();
    if (saved) {
      success('Theme colors saved successfully!');
    } else {
      error('Failed to save theme colors. Please try again.');
    }
  };

  const handleColorChange = (key: keyof BrandColors, value: string) => {
    setColor(key, value);
  };

  const handlePresetClick = (preset: typeof presetThemes[0]) => {
    applyPreset(preset);
  };

  const handleReset = () => {
    resetColors();
  };

  // Check if current colors match default
  const isDefault = JSON.stringify(colors) === JSON.stringify(defaultBrandColors);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Theme & Colors</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Customize your website appearance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isDefault}
            className="px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Mode and Colors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dark/Light Mode */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Display Mode</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose how the site appears to you. Users can select their own preference.
            </p>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="buttons" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Current: <span className="font-medium capitalize">{mode}</span>
              </span>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorFields.map(field => (
                <div key={field.key} className="p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-secondary-900 dark:text-white">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-secondary-600 rounded font-mono bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{field.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Preset Themes */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Preset Themes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Quick-apply a preset color scheme
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {presetThemes.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetClick(preset)}
                  className="p-3 border border-gray-200 dark:border-secondary-600 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-center bg-white dark:bg-secondary-700"
                >
                  <div className="flex gap-1 justify-center mb-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-secondary-500"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-secondary-500"
                      style={{ backgroundColor: preset.colors.secondary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-secondary-500"
                      style={{ backgroundColor: preset.colors.accent }}
                    />
                  </div>
                  <span className="text-sm font-medium text-secondary-900 dark:text-white">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Live Preview</h2>

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
              <h3 style={{ color: colors.secondary }} className="text-xl font-bold dark:hidden">
                Heading Text
              </h3>
              <h3 className="text-xl font-bold hidden dark:block text-white">
                Heading Text
              </h3>
              <p style={{ color: colors.secondaryLight }} className="text-sm dark:text-gray-400">
                This is secondary text color for descriptions.
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
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Export Colors</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Copy these values to update your Tailwind config:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`// tailwind.config.ts
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

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">About Theme Settings</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• <strong>Display Mode:</strong> Controls light/dark appearance. Each user can set their own preference.</li>
          <li>• <strong>Brand Colors:</strong> Changes are previewed instantly. Click &quot;Save Changes&quot; to persist.</li>
          <li>• <strong>Preset Themes:</strong> Quick-apply common color schemes as a starting point.</li>
        </ul>
      </div>
    </div>
  );
}
