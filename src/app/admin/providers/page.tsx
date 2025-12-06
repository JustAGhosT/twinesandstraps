'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

type ProviderType = 'shipping' | 'payment' | 'email' | 'accounting' | 'marketplace';

interface Provider {
  name: string;
  displayName: string;
  isConfigured: boolean;
  isEnabled: boolean;
  isActive: boolean;
  config: {
    id: number;
    featureFlags?: Record<string, boolean>;
    lastSyncedAt?: string;
    errorMessage?: string;
  } | null;
}

interface ProvidersData {
  shipping: Provider[];
  payment: Provider[];
  email: Provider[];
  accounting: Provider[];
}

const PROVIDER_REQUIREMENTS: Record<string, Record<string, string[]>> = {
  shipping: {
    'courier-guy': ['API Key'],
    'pargo': ['API Key', 'Client ID'],
    'fastway': ['API Key', 'Account Number'],
  },
  payment: {
    'payfast': ['Merchant ID', 'Merchant Key', 'Passphrase'],
    'paystack': ['Public Key', 'Secret Key'],
  },
  email: {
    'brevo': ['API Key'],
    'sendgrid': ['API Key'],
  },
  accounting: {
    'xero': ['Client ID', 'Client Secret', 'Tenant ID'],
    'quickbooks': ['Client ID', 'Client Secret', 'Realm ID'],
  },
  marketplace: {
    'takealot': ['API Key', 'Seller ID'],
    'google-shopping': ['Merchant ID'],
    'facebook': ['Catalog ID', 'Access Token'],
  },
};

export default function ProvidersPage() {
  const { success, error } = useToast();
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<{
    type: ProviderType;
    name: string;
  } | null>(null);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers');
      if (!response.ok) throw new Error('Failed to load providers');
      const data = await response.json();
      setProviders(data.providers);
    } catch (err) {
      console.error('Error loading providers:', err);
      error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProvider = async (type: ProviderType, name: string) => {
    try {
      const response = await fetch(`/api/admin/providers/${type}/${name}`);
      if (!response.ok) throw new Error('Failed to load provider config');
      const data = await response.json();
      
      setEditingProvider({ type, name });
      setConfigData(data.config?.configData || {});
      setCredentials({}); // Don't load credentials for security
    } catch (err) {
      console.error('Error loading provider config:', err);
      error('Failed to load provider configuration');
    }
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/providers/${editingProvider.type}/${editingProvider.name}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configData,
            credentials,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.missingFields) {
          error(
            `Missing required fields: ${error.missingFields.join(', ')}`
          );
          return;
        }
        throw new Error(error.error || 'Failed to save');
      }

      success('Provider configuration saved');
      setEditingProvider(null);
      setConfigData({});
      setCredentials({});
      loadProviders();
    } catch (err) {
      console.error('Error saving provider:', err);
      error('Failed to save provider configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProvider = async (
    type: ProviderType,
    name: string,
    enabled: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/admin/providers/${type}/${name}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: enabled }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.missingFields) {
          error(
            `Cannot enable: Missing ${error.missingFields.join(', ')}`
          );
          return;
        }
        throw new Error(error.error || 'Failed to toggle provider');
      }

      success(
        `${enabled ? 'Enabled' : 'Disabled'} ${name}`
      );
      loadProviders();
    } catch (err) {
      console.error('Error toggling provider:', err);
      error('Failed to toggle provider');
    }
  };

  const getRequiredFields = (type: ProviderType, name: string): string[] => {
    return PROVIDER_REQUIREMENTS[type]?.[name] || [];
  };

  const renderProviderCard = (
    provider: Provider,
    type: ProviderType
  ) => {
    const requiredFields = getRequiredFields(type, provider.name);
    const isMock = provider.name === 'mock';
    const canEnable = isMock || provider.isConfigured;

    return (
      <div
        key={provider.name}
        className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              {provider.displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {provider.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                provider.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : provider.isEnabled
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {provider.isActive
                ? 'Active'
                : provider.isEnabled
                ? 'Enabled'
                : 'Disabled'}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400 w-24">
              Status:
            </span>
            <span
              className={
                provider.isConfigured
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400'
              }
            >
              {provider.isConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>

          {provider.config?.errorMessage && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {provider.config.errorMessage}
            </div>
          )}

          {!isMock && requiredFields.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Required:
              </span>
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                {requiredFields.join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleEditProvider(type, provider.name)}
            className="flex-1 px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            Configure
          </button>
          <button
            onClick={() =>
              handleToggleProvider(type, provider.name, !provider.isEnabled)
            }
            disabled={!canEnable && !provider.isEnabled}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              provider.isEnabled
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
                : canEnable
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            {provider.isEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    );
  };

  const renderConfigModal = () => {
    if (!editingProvider) return null;

    const requiredFields = getRequiredFields(editingProvider.type, editingProvider.name);
    const isMock = editingProvider.name === 'mock';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Configure {editingProvider.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {editingProvider.type} provider
            </p>
          </div>

          <div className="p-6 space-y-6">
            {!isMock && requiredFields.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Required Fields
                </h3>
                <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-400">
                  {requiredFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Configuration (JSON)
              </label>
              <textarea
                value={JSON.stringify(configData, null, 2)}
                onChange={(e) => {
                  try {
                    setConfigData(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white font-mono text-sm"
                placeholder='{"apiKey": "...", "apiUrl": "..."}'
              />
            </div>

            {!isMock && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Credentials (Sensitive - will be encrypted)
                </label>
                <textarea
                  value={JSON.stringify(credentials, null, 2)}
                  onChange={(e) => {
                    try {
                      setCredentials(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white font-mono text-sm"
                  placeholder='{"apiKey": "...", "secretKey": "..."}'
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingProvider(null);
                  setConfigData({});
                  setCredentials({});
                }}
                className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProvider}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const providerTypes: Array<{ type: ProviderType; label: string; icon: string }> = [
    { type: 'shipping', label: 'Shipping Providers', icon: '🚚' },
    { type: 'payment', label: 'Payment Providers', icon: '💳' },
    { type: 'email', label: 'Email Providers', icon: '📧' },
    { type: 'accounting', label: 'Accounting Providers', icon: '📊' },
    { type: 'marketplace', label: 'Marketplace Providers', icon: '🛒' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
          Provider Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure and manage integration providers
        </p>
      </div>

      {providerTypes.map(({ type, label, icon }) => (
        <div key={type} className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
            <span>{icon}</span>
            {label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers?.[type]?.map((provider) =>
              renderProviderCard(provider, type)
            )}
          </div>
        </div>
      ))}

      {renderConfigModal()}
    </div>
  );
}

