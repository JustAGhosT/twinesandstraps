'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { logError } from '@/lib/logging/logger';

interface HealthStats {
  total: number;
  enabled: number;
  active: number;
  withErrors: number;
  lastSyncWithin24h: number;
  neverSynced: number;
  byType: {
    supplier: number;
    marketplace: number;
  };
  byStatus: {
    healthy: number;
    warning: number;
    error: number;
  };
}

interface IntegrationHealth {
  id: number;
  productName: string;
  integrationType: 'supplier' | 'marketplace';
  integrationName: string;
  isEnabled: boolean;
  isActive: boolean;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  errorMessage: string | null;
  syncSchedule: string | null;
  health: 'healthy' | 'warning' | 'error';
}

export default function IntegrationHealthDashboardPage() {
  const { error } = useToast();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'warning' | 'error'>('all');

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [filter]);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('health', filter);

      const res = await fetch(`/api/admin/integrations/health?${params}`);
      if (!res.ok) throw new Error('Failed to load health data');
      
      const data = await res.json();
      setStats(data.stats);
      setIntegrations(data.integrations || []);
    } catch (err) {
      logError('Error loading health data:', err);
      error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Integration Health Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor the health and status of all product integrations
          </p>
        </div>
        <button
          onClick={loadHealthData}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Health Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Integrations</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active & Healthy</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.byStatus.healthy}</div>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Warnings</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.byStatus.warning}</div>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Errors</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.byStatus.error}</div>
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">By Type</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Suppliers</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.byType.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Marketplaces</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.byType.marketplace}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sync Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Synced (24h)</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.lastSyncWithin24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Never Synced</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.neverSynced}</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Enabled</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.enabled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.active}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Integrations</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warnings</option>
          <option value="error">Errors</option>
        </select>
      </div>

      {/* Integrations Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : integrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No integrations found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-secondary-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Integration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Next Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {integrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                  <td className="px-6 py-4">
                    <div className={`w-3 h-3 rounded-full ${getHealthColor(integration.health)}`} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {integration.productName}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {integration.integrationName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {integration.integrationType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      integration.isEnabled && integration.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {integration.isEnabled && integration.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {integration.lastSyncedAt 
                      ? new Date(integration.lastSyncedAt).toLocaleString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {integration.nextSyncAt 
                      ? new Date(integration.nextSyncAt).toLocaleString()
                      : '—'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {integration.errorMessage ? (
                      <span className="text-red-600 dark:text-red-400" title={integration.errorMessage}>
                        ⚠️ {integration.errorMessage.substring(0, 50)}...
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

