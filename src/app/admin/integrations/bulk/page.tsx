'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { logInfo, logError } from '@/lib/logging/logger';

interface ProductIntegration {
  id: number;
  productId: number;
  productName: string;
  integrationType: 'supplier' | 'marketplace';
  integrationName: string;
  isEnabled: boolean;
  isActive: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

interface BulkAction {
  type: 'enable' | 'disable' | 'sync';
  integrationType?: 'supplier' | 'marketplace';
  integrationIds?: number[];
}

export default function BulkIntegrationManagementPage() {
  const { success, error } = useToast();
  const [integrations, setIntegrations] = useState<ProductIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    integrationType: '' as '' | 'supplier' | 'marketplace',
    status: '' as '' | 'enabled' | 'disabled' | 'error',
  });

  useEffect(() => {
    loadIntegrations();
  }, [filters]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.integrationType) params.set('type', filters.integrationType);
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/admin/integrations/bulk?${params}`);
      if (!res.ok) throw new Error('Failed to load integrations');
      
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      logError('Error loading integrations:', err);
      error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedIds.size === 0) {
      error('Please select at least one integration');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/integrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...action,
          integrationIds: Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to perform bulk action');
      }

      const data = await res.json();
      success(`Successfully ${action.type}d ${data.affected} integration(s)`);
      setSelectedIds(new Set());
      await loadIntegrations();
    } catch (err) {
      logError('Error performing bulk action:', err);
      error(err instanceof Error ? err.message : 'Failed to perform bulk action');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === integrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(integrations.map(i => i.id)));
    }
  };

  const filteredIntegrations = integrations.filter(i => {
    if (filters.integrationType && i.integrationType !== filters.integrationType) return false;
    if (filters.status === 'enabled' && !i.isEnabled) return false;
    if (filters.status === 'disabled' && i.isEnabled) return false;
    if (filters.status === 'error' && !i.errorMessage) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Bulk Integration Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage multiple product integrations at once
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Integration Type
            </label>
            <select
              value={filters.integrationType}
              onChange={(e) => setFilters(prev => ({ ...prev, integrationType: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="supplier">Suppliers</option>
              <option value="marketplace">Marketplaces</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
              <option value="error">With Errors</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ integrationType: '', status: '' })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-primary-700 dark:text-primary-300 font-medium">
              {selectedIds.size} integration(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction({ type: 'enable' })}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                Enable Selected
              </button>
              <button
                onClick={() => handleBulkAction({ type: 'disable' })}
                disabled={processing}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
              >
                Disable Selected
              </button>
              <button
                onClick={() => handleBulkAction({ type: 'sync' })}
                disabled={processing}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
              >
                Sync Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No integrations found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-secondary-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredIntegrations.length && filteredIntegrations.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
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
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIntegrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(integration.id)}
                      onChange={() => toggleSelect(integration.id)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {integration.productName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      integration.integrationType === 'supplier'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}>
                      {integration.integrationType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {integration.integrationName}
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
                      ? new Date(integration.lastSyncedAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {integration.errorMessage ? (
                      <span className="text-red-600 dark:text-red-400" title={integration.errorMessage}>
                        ⚠️ Error
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

