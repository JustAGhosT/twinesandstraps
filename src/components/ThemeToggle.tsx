'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'buttons';
  className?: string;
}

export default function ThemeToggle({ variant = 'dropdown', className = '' }: ThemeToggleProps) {
  const { mode, setMode, resolvedMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SunIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const MoonIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );

  const SystemIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const getCurrentIcon = () => {
    if (mode === 'system') return <SystemIcon />;
    return resolvedMode === 'dark' ? <MoonIcon /> : <SunIcon />;
  };

  // Simple icon button that cycles through themes
  if (variant === 'icon') {
    return (
      <button
        onClick={() => {
          const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
          setMode(next);
        }}
        className={`p-2 rounded-lg transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-300 ${className}`}
        aria-label={`Current theme: ${mode}. Click to change.`}
        title={`Theme: ${mode}`}
      >
        {getCurrentIcon()}
      </button>
    );
  }

  // Segmented button group
  if (variant === 'buttons') {
    return (
      <div className={`inline-flex rounded-lg border border-secondary-200 dark:border-secondary-700 p-1 bg-secondary-100 dark:bg-secondary-800 ${className}`}>
        <button
          onClick={() => setMode('light')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === 'light'
              ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
              : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
          }`}
          aria-pressed={mode === 'light'}
        >
          <SunIcon />
          <span>Light</span>
        </button>
        <button
          onClick={() => setMode('dark')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === 'dark'
              ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
              : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
          }`}
          aria-pressed={mode === 'dark'}
        >
          <MoonIcon />
          <span>Dark</span>
        </button>
        <button
          onClick={() => setMode('system')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === 'system'
              ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
              : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
          }`}
          aria-pressed={mode === 'system'}
        >
          <SystemIcon />
          <span>System</span>
        </button>
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-300"
        aria-label="Theme settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {getCurrentIcon()}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white dark:bg-secondary-800 shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-50 animate-fade-in">
          <button
            onClick={() => { setMode('light'); setIsOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${
              mode === 'light'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <SunIcon />
            <span>Light</span>
            {mode === 'light' && (
              <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => { setMode('dark'); setIsOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${
              mode === 'dark'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <MoonIcon />
            <span>Dark</span>
            {mode === 'dark' && (
              <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={() => { setMode('system'); setIsOpen(false); }}
            className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${
              mode === 'system'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <SystemIcon />
            <span>System</span>
            {mode === 'system' && (
              <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
