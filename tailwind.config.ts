import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // TASSA Brand Colors
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#E31E24', // TASSA Red - Primary brand color
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Industrial Black
        secondary: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#303030',
          800: '#262626',
          900: '#1A1A1A', // Industrial Black
          950: '#0a0a0a',
        },
        // Steel Gray accent colors
        accent: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6B6B6B', // Steel Gray
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Rope Beige
        warm: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#ebe3d4',
          300: '#ddd2bc',
          400: '#C4B8A5', // Rope Beige
          500: '#a89a82',
          600: '#8f7f65',
          700: '#756752',
          800: '#5f5444',
          900: '#4d453a',
        },
        // Safety Orange (product accent)
        safety: {
          500: '#E87722', // Safety Orange
        },
        // Marine Blue (product accent)
        marine: {
          500: '#2B5C9E', // Marine Blue
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
