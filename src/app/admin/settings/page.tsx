'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface SiteSettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  businessHours: string;
  vatRate: string;
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
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedIn: '',
};

const SETTINGS_KEY = 'tassa_site_settings';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load settings from localStorage (or API in production)
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
    
    // Check if a custom logo exists
    checkLogoStatus();
  }, []);
  
  const checkLogoStatus = async () => {
    try {
      const res = await fetch('/api/admin/logo');
      if (res.ok) {
        const data = await res.json();
        if (data.hasLogo && data.url) {
          setLogoUrl(data.url + '?t=' + Date.now()); // Cache bust
        }
      }
    } catch (error) {
      console.error('Error checking logo status:', error);
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
      
      setLogoUrl(data.url + '?t=' + Date.now()); // Cache bust
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
    if (!confirm('Are you sure you want to remove the custom logo? The default logo will be used instead.')) {
      return;
    }
    
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
      
      setLogoUrl(null);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Save to localStorage for demo (use API in production)
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      // Also try to save via API
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        console.warn('API save failed, settings saved locally only');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      // Still show success since localStorage save succeeded
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Site Settings</h1>
        <p className="text-gray-500 mt-1">Manage your website configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Site Logo</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a custom logo for your site. Only SVG format is accepted (recommended for crisp display at all sizes).
          </p>
          
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Current logo"
                    width={80}
                    height={80}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="text-center text-gray-400">
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
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${logoLoading ? 'opacity-50 pointer-events-none' : ''}`}
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
                
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={logoLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Maximum file size: 512KB. SVG format ensures your logo looks crisp on all devices.
              </p>
              
              {logoError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {logoError}
                </div>
              )}
              
              {logoSuccess && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                  {logoSuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                name="address"
                value={settings.address}
                onChange={handleChange}
                rows={2}
                placeholder="Enter your business address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleChange}
                placeholder="e.g. 27821234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code without + sign</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
              <input
                type="text"
                name="businessHours"
                value={settings.businessHours}
                onChange={handleChange}
                placeholder="e.g. Mon-Fri 8:00-17:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Business Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
              <input
                type="number"
                name="vatRate"
                value={settings.vatRate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Social Media Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input
                type="url"
                name="socialFacebook"
                value={settings.socialFacebook}
                onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input
                type="url"
                name="socialInstagram"
                value={settings.socialInstagram}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                name="socialLinkedIn"
                value={settings.socialLinkedIn}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-green-600 flex items-center gap-2">
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
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Note</h3>
        <p className="text-sm text-blue-700">
          Some settings like WhatsApp number also require updating environment variables.
          Contact your developer to update <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_WHATSAPP_NUMBER</code> in your deployment settings.
        </p>
      </div>
    </div>
  );
}
