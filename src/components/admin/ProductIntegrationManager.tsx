'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

interface ProductIntegration {
  id?: number;
  integrationType: 'supplier' | 'marketplace';
  integrationId: number;
  integrationName: string;
  isEnabled: boolean;
  isActive: boolean;
  priceOverride?: number | null;
  marginPercentage?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  quantityOverride?: number | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  reserveQuantity: number;
  leadTimeDays?: number | null;
  syncSchedule?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual' | null;
  autoSync: boolean;
  syncOnPriceChange: boolean;
  syncOnStockChange: boolean;
  customConfig?: Record<string, any> | null;
  errorMessage?: string | null;
  lastSyncedAt?: string | null;
}

interface ProductIntegrationManagerProps {
  productId: number;
  productPrice: number;
  productStockStatus: string;
}

// Smart defaults based on integration type
const getDefaultIntegration = (
  type: 'supplier' | 'marketplace',
  productPrice: number
): Partial<ProductIntegration> => {
  if (type === 'supplier') {
    return {
      marginPercentage: 30, // 30% default margin
      autoSync: true,
      syncOnPriceChange: true,
      syncOnStockChange: true,
      syncSchedule: 'daily',
      reserveQuantity: 0,
    };
  } else {
    // Marketplace
    return {
      marginPercentage: null, // Use product price
      minPrice: productPrice * 0.9, // 10% below product price
      maxPrice: productPrice * 1.1, // 10% above product price
      autoSync: true,
      syncOnPriceChange: true,
      syncOnStockChange: true,
      syncSchedule: 'hourly',
      reserveQuantity: 0,
    };
  }
};

export default function ProductIntegrationManager({
  productId,
  productPrice,
  productStockStatus,
}: ProductIntegrationManagerProps) {
  const { success, error } = useToast();
  const [integrations, setIntegrations] = useState<ProductIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIntegration, setEditingIntegration] = useState<ProductIntegration | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIntegrationType, setNewIntegrationType] = useState<'supplier' | 'marketplace'>('supplier');
  const [availableIntegrations, setAvailableIntegrations] = useState<{
    suppliers: Array<{ id: number; name: string }>;
    marketplaces: Array<{ id: number; name: string }>;
  }>({ suppliers: [], marketplaces: [] });

  useEffect(() => {
    loadIntegrations();
    loadAvailableIntegrations();
  }, [productId]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/integrations`);
      if (!response.ok) throw new Error('Failed to load integrations');
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      console.error('Error loading integrations:', err);
      error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableIntegrations = async () => {
    try {
      // Load suppliers
      const suppliersRes = await fetch('/api/admin/suppliers');
      const suppliersData = await suppliersRes.ok ? await suppliersRes.json() : { data: [] };
      
      // Load marketplace providers (from provider config)
      const providersRes = await fetch('/api/admin/providers');
      const providersData = await providersRes.ok ? await providersRes.json() : { providers: {} };
      
      setAvailableIntegrations({
        suppliers: (suppliersData.data || suppliersData.suppliers || []).map((s: any) => ({
          id: s.id,
          name: s.name,
        })),
        marketplaces: (providersData.providers?.marketplace || []).map((p: any, index: number) => ({
          id: p.id || (index + 1), // Use ID from API or fallback to index
          name: p.displayName || p.name,
        })),
      });
    } catch (err) {
      console.error('Error loading available integrations:', err);
    }
  };

  const handleSaveIntegration = async (integration: ProductIntegration) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save integration');
      }

      success('Integration saved successfully');
      setEditingIntegration(null);
      loadIntegrations();
    } catch (err) {
      console.error('Error saving integration:', err);
      error(err instanceof Error ? err.message : 'Failed to save integration');
    }
  };

  const handleAddIntegration = (integrationId: number | string, integrationName: string) => {
    const defaults = getDefaultIntegration(newIntegrationType, productPrice);
    const newIntegration: ProductIntegration = {
      integrationType: newIntegrationType,
      integrationId: typeof integrationId === 'string' ? parseInt(integrationId) || 0 : integrationId,
      integrationName,
      isEnabled: false,
      isActive: false,
      reserveQuantity: 0,
      autoSync: true,
      syncOnPriceChange: true,
      syncOnStockChange: true,
      ...defaults,
    };
    setEditingIntegration(newIntegration);
    setShowAddModal(false);
  };

  const calculateEffectivePrice = (integration: ProductIntegration): number => {
    if (integration.priceOverride !== null && integration.priceOverride !== undefined) {
      return integration.priceOverride;
    }
    
    if (integration.marginPercentage !== null && integration.marginPercentage !== undefined) {
      // Calculate from supplier cost (would need supplier price)
      // For now, use product price with margin
      return productPrice * (1 + integration.marginPercentage / 100);
    }
    
    return productPrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Product Integrations
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          + Add Integration
        </button>
      </div>

      {/* Integration List */}
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.id || `${integration.integrationType}-${integration.integrationId}`}
            className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    {integration.integrationName}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    integration.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : integration.isEnabled
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {integration.isActive ? 'Active' : integration.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                    {integration.integrationType}
                  </span>
                </div>
                {integration.errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {integration.errorMessage}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingIntegration(integration)}
                className="px-3 py-1 text-sm text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600"
              >
                Edit
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Price:</span>
                <span className="ml-2 font-medium text-secondary-900 dark:text-white">
                  R{calculateEffectivePrice(integration).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Sync:</span>
                <span className="ml-2 font-medium text-secondary-900 dark:text-white">
                  {integration.syncSchedule || 'manual'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Lead Time:</span>
                <span className="ml-2 font-medium text-secondary-900 dark:text-white">
                  {integration.leadTimeDays || '-'} days
                </span>
              </div>
            </div>
          </div>
        ))}

        {integrations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No integrations configured. Click "Add Integration" to get started.
          </div>
        )}
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
              Add Integration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Integration Type
                </label>
                <select
                  value={newIntegrationType}
                  onChange={(e) => setNewIntegrationType(e.target.value as 'supplier' | 'marketplace')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                >
                  <option value="supplier">Supplier</option>
                  <option value="marketplace">Marketplace</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Select {newIntegrationType === 'supplier' ? 'Supplier' : 'Marketplace'}
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(newIntegrationType === 'supplier'
                    ? availableIntegrations.suppliers
                    : availableIntegrations.marketplaces
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddIntegration(item.id, item.name)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg border border-gray-200 dark:border-secondary-700"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Integration Modal */}
      {editingIntegration && (
        <IntegrationEditModal
          integration={editingIntegration}
          productPrice={productPrice}
          onSave={handleSaveIntegration}
          onClose={() => setEditingIntegration(null)}
        />
      )}
    </div>
  );
}

// Integration Edit Modal Component
function IntegrationEditModal({
  integration,
  productPrice,
  onSave,
  onClose,
}: {
  integration: ProductIntegration;
  productPrice: number;
  onSave: (integration: ProductIntegration) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductIntegration>(integration);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const effectivePrice = form.priceOverride !== null && form.priceOverride !== undefined
    ? form.priceOverride
    : form.marginPercentage !== null && form.marginPercentage !== undefined
    ? productPrice * (1 + form.marginPercentage / 100)
    : productPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-secondary-700">
          <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
            Configure {integration.integrationName}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {integration.integrationType} integration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Enable Integration
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When enabled, product will sync with this {integration.integrationType}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEnabled}
                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Pricing Section */}
          <div className="border-t border-gray-200 dark:border-secondary-700 pt-4">
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-4">Pricing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Price Override (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.priceOverride || ''}
                  onChange={(e) => setForm({ ...form, priceOverride: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Leave empty to use calculated price"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Margin (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.marginPercentage || ''}
                  onChange={(e) => setForm({ ...form, marginPercentage: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="30"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Min Price (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minPrice || ''}
                  onChange={(e) => setForm({ ...form, minPrice: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Max Price (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.maxPrice || ''}
                  onChange={(e) => setForm({ ...form, maxPrice: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Effective Price:</strong> R{effectivePrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Quantity Section */}
          <div className="border-t border-gray-200 dark:border-secondary-700 pt-4">
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-4">Quantity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Quantity Override
                </label>
                <input
                  type="number"
                  value={form.quantityOverride || ''}
                  onChange={(e) => setForm({ ...form, quantityOverride: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Leave empty to use product stock"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Reserve Quantity
                </label>
                <input
                  type="number"
                  value={form.reserveQuantity}
                  onChange={(e) => setForm({ ...form, reserveQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Quantity to keep in reserve (not listed)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Min Quantity
                </label>
                <input
                  type="number"
                  value={form.minQuantity || ''}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Max Quantity
                </label>
                <input
                  type="number"
                  value={form.maxQuantity || ''}
                  onChange={(e) => setForm({ ...form, maxQuantity: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="border-t border-gray-200 dark:border-secondary-700 pt-4">
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-4">Sync Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Sync Schedule
                </label>
                <select
                  value={form.syncSchedule || 'manual'}
                  onChange={(e) => setForm({ ...form, syncSchedule: e.target.value as any || null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                >
                  <option value="manual">Manual</option>
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Lead Time (days)
                </label>
                <input
                  type="number"
                  value={form.leadTimeDays || ''}
                  onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="e.g., 7"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.autoSync}
                    onChange={(e) => setForm({ ...form, autoSync: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Auto-sync when product changes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.syncOnPriceChange}
                    onChange={(e) => setForm({ ...form, syncOnPriceChange: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Sync on price change</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.syncOnStockChange}
                    onChange={(e) => setForm({ ...form, syncOnStockChange: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Sync on stock change</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-secondary-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Save Integration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

