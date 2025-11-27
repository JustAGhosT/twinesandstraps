'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';

interface SiteSettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  vatRate: string;
  logoUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedIn: string;
}

const defaultSettings: SiteSettings = {
  companyName: 'Twines and Straps SA (Pty) Ltd',
  tagline: 'Boundless Strength, Endless Solutions!',
  email: 'info@twinesandstraps.co.za',
  phone: '+27 (0) 11 234 5678',
  whatsappNumber: '27XXXXXXXXX',
  address: '',
  businessHours: 'Mon-Fri 8:00-17:00',
  vatRate: '15',
  logoUrl: '',
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedIn: '',
};

// Save result interface for detailed feedback
interface SaveResult {
  changedFieldLabels: string[];
  changeCount: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { error: showError, success: showSuccess } = useToast();
  const confirm = useConfirm();

  // Logo state - now derived from settings.logoUrl
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track which fields have been modified - memoized to avoid recalculation on every render
  const modifiedFields = useMemo(() => {
    const modified: string[] = [];
    for (const key of Object.keys(settings) as Array<keyof SiteSettings>) {
      if (settings[key] !== originalSettings[key]) {
        modified.push(key);
      }
    }
    return modified;
  }, [settings, originalSettings]);
  
  const hasUnsavedChanges = modifiedFields.length > 0;
  
  // Helper to check if a specific field is modified
  const isFieldModified = (fieldName: keyof SiteSettings): boolean => {
    return modifiedFields.includes(fieldName);
  };
  
  // Helper to get input class with modified state indicator
  const getInputClassName = (fieldName: keyof SiteSettings): string => {
    const baseClass = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white';
    if (isFieldModified(fieldName)) {
      return `${baseClass} border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20`;
    }
    return `${baseClass} border-gray-300 dark:border-secondary-600`;
  };

  useEffect(() => {
    // Load settings from API (database)
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const loadedSettings = { ...defaultSettings, ...data };
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } else if (res.status === 401) {
        setLoadError('Session expired. Please log in again.');
      } else {
        console.warn('Failed to load settings, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoadError('Failed to load settings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setLogoError(null);
    setLogoSuccess(null);
    setLogoLoading(true);
    
    // Validate file type
    if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
      setLogoError('Only SVG files are allowed. SVG format is recommended for logos as it scales perfectly at any size.');
      setLogoLoading(false);
      return;
    }
    
    // Validate file size (512KB max)
    if (file.size > 512 * 1024) {
      setLogoError('File is too large. Maximum size is 512KB.');
      setLogoLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/admin/logo', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setLogoError(data.error || 'Failed to upload logo');
        return;
      }
      
      // Update settings with new logo URL
      setSettings(prev => ({ ...prev, logoUrl: data.url }));
      setOriginalSettings(prev => ({ ...prev, logoUrl: data.url }));
      setLogoSuccess('Logo uploaded successfully! It will appear in the header after refreshing.');
      setTimeout(() => setLogoSuccess(null), 5000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoError('Failed to upload logo. Please try again.');
    } finally {
      setLogoLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleLogoRemove = async () => {
    const confirmed = await confirm({
      title: 'Remove Logo',
      message: 'Are you sure you want to remove the custom logo? The default logo will be used instead.',
      confirmText: 'Remove Logo',
      variant: 'warning',
    });
    if (!confirmed) return;

    setLogoLoading(true);
    setLogoError(null);
    setLogoSuccess(null);
    
    try {
      const res = await fetch('/api/admin/logo', {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        setLogoError(data.error || 'Failed to remove logo');
        return;
      }
      
      // Update settings with empty logo URL
      setSettings(prev => ({ ...prev, logoUrl: '' }));
      setOriginalSettings(prev => ({ ...prev, logoUrl: '' }));
      setLogoSuccess('Logo removed successfully! The default logo will be used.');
      setTimeout(() => setLogoSuccess(null), 5000);
    } catch (error) {
      console.error('Error removing logo:', error);
      setLogoError('Failed to remove logo. Please try again.');
    } finally {
      setLogoLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setSaved(false);
    setSaveResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveResult(null);

    try {
      // Save settings to database via API
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setLoadError('Session expired. Please log in again.');
          return;
        }
        throw new Error(data.error || 'Failed to save settings');
      }

      // Update original settings to match saved state
      setOriginalSettings(settings);
      
      // Set save result with change details
      setSaveResult({
        changedFieldLabels: data.changedFieldLabels || [],
        changeCount: data.changeCount || 0,
      });
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSaveResult(null);
      }, 5000);
    } catch (error) {
      console.error('Error saving settings:', error);
      showError(error instanceof Error ? error.message : 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Site Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your website configuration</p>
        </div>
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Site Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your website configuration</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-700 dark:text-red-400 font-medium mb-4">{loadError}</p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Site Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your website configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Site Logo</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload a custom logo for your site. Only SVG format is accepted (recommended for crisp display at all sizes).
          </p>
          
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-secondary-700 overflow-hidden">
                {settings.logoUrl ? (
                  <Image
                    src={settings.logoUrl}
                    alt="Current logo"
                    width={80}
                    height={80}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">No logo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <div className="flex flex-wrap gap-2">
                <label
                  htmlFor="logo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600 cursor-pointer transition-colors ${logoLoading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {logoLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload SVG Logo
                    </>
                  )}
                </label>
                
                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={logoLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-secondary-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Maximum file size: 512KB. SVG format ensures your logo looks crisp on all devices.
              </p>

              {logoError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {logoError}
                </div>
              )}

              {logoSuccess && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
                  {logoSuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
                {isFieldModified('companyName') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className={getInputClassName('companyName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tagline
                {isFieldModified('tagline') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline}
                onChange={handleChange}
                className={getInputClassName('tagline')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
                {isFieldModified('address') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                rows={2}
                placeholder="Enter your business address"
                className={getInputClassName('address')}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
                {isFieldModified('email') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className={getInputClassName('email')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
                {isFieldModified('phone') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className={getInputClassName('phone')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp Number
                {isFieldModified('whatsappNumber') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="text"
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleChange}
                placeholder="e.g. 27821234567"
                className={getInputClassName('whatsappNumber')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Include country code without + sign</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Hours
                {isFieldModified('businessHours') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="text"
                name="businessHours"
                value={settings.businessHours}
                onChange={handleChange}
                placeholder="e.g. Mon-Fri 8:00-17:00"
                className={getInputClassName('businessHours')}
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Business Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                VAT Rate (%)
                {isFieldModified('vatRate') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="number"
                name="vatRate"
                value={settings.vatRate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className={getInputClassName('vatRate')}
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Facebook
                {isFieldModified('socialFacebook') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="url"
                name="socialFacebook"
                value={settings.socialFacebook}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className={getInputClassName('socialFacebook')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instagram
                {isFieldModified('socialInstagram') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="url"
                name="socialInstagram"
                value={settings.socialInstagram}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                className={getInputClassName('socialInstagram')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LinkedIn
                {isFieldModified('socialLinkedIn') && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">(modified)</span>}
              </label>
              <input
                type="url"
                name="socialLinkedIn"
                value={settings.socialLinkedIn}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/..."
                className={getInputClassName('socialLinkedIn')}
              />
            </div>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && !saved && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-400">You have unsaved changes</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {modifiedFields.length} field{modifiedFields.length !== 1 ? 's' : ''} modified. Click &quot;Save Settings&quot; to apply your changes.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            {saved && saveResult && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-400">Settings saved successfully!</h3>
                    {saveResult.changeCount > 0 ? (
                      <div className="mt-1">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Updated {saveResult.changeCount} field{saveResult.changeCount !== 1 ? 's' : ''}:
                        </p>
                        <ul className="mt-1 text-sm text-green-600 dark:text-green-400 list-disc list-inside">
                          {saveResult.changedFieldLabels.map((label, index) => (
                            <li key={index}>{label}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">No changes detected.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {saved && !saveResult && (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Settings saved successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 ml-4"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">Settings Storage</h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          All settings are saved to the database and will persist across deployments.
          Changes to contact information like WhatsApp number, email, and phone will be immediately available to website visitors.
        </p>
      </div>
    </div>
  );
}
