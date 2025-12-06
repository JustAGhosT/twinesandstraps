'use client';

import React, { useEffect, useState, useCallback } from 'react';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

interface Supplier {
  id: number;
  name: string;
  code: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  default_markup: number;
  is_active: boolean;
  payment_terms: string | null;
  lead_time_days: number | null;
  _count?: { products: number };
}

interface FormData {
  name: string;
  code: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  default_markup: string;
  is_active: boolean;
  payment_terms: string;
  lead_time_days: string;
  min_order_value: string;
}

const initialFormData: FormData = {
  name: '',
  code: '',
  contact_name: '',
  email: '',
  phone: '',
  website: '',
  notes: '',
  default_markup: '30',
  is_active: true,
  payment_terms: '',
  lead_time_days: '',
  min_order_value: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/admin/suppliers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      logError('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const generateCode = (name: string) => {
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({
      ...prev,
      name,
      code: editingId ? prev.code : generateCode(name),
    }));
  };

  const startEdit = async (supplier: Supplier) => {
    setEditingId(supplier.id);
    setShowNew(false);

    // Fetch full supplier details
    try {
      const res = await fetch(`/api/admin/suppliers/${supplier.id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name,
          code: data.code,
          contact_name: data.contact_name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          notes: data.notes || '',
          default_markup: data.default_markup?.toString() || '30',
          is_active: data.is_active,
          payment_terms: data.payment_terms || '',
          lead_time_days: data.lead_time_days?.toString() || '',
          min_order_value: data.min_order_value?.toString() || '',
        });
      }
    } catch (error) {
      logError('Error fetching supplier details:', error);
    }
  };

  const startNew = () => {
    setShowNew(true);
    setEditingId(null);
    setForm(initialFormData);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNew(false);
    setForm(initialFormData);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      notes: form.notes || null,
      default_markup: parseFloat(form.default_markup) || 30,
      is_active: form.is_active,
      payment_terms: form.payment_terms || null,
      lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : null,
    };

    try {
      const url = editingId
        ? `/api/admin/suppliers/${editingId}`
        : '/api/admin/suppliers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSuppliers();
        cancelEdit();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save supplier');
      }
    } catch (error) {
      logError('Error saving supplier:', error);
      setError('Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchSuppliers();
        setDeleteConfirm(null);
      }
    } catch (error) {
      logError('Error deleting supplier:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Suppliers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your 3rd party product suppliers</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* New/Edit Supplier Form */}
      {(showNew || editingId) && (
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
            {editingId ? 'Edit Supplier' : 'New Supplier'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                  maxLength={10}
                  placeholder="e.g., SUP1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white uppercase"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used as SKU prefix for products</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Markup %</label>
                <input
                  type="number"
                  value={form.default_markup}
                  onChange={(e) => setForm(prev => ({ ...prev, default_markup: e.target.value }))}
                  min="0"
                  max="500"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => setForm(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                <select
                  value={form.payment_terms}
                  onChange={(e) => setForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="COD">COD (Cash on Delivery)</option>
                  <option value="NET7">NET 7 Days</option>
                  <option value="NET14">NET 14 Days</option>
                  <option value="NET30">NET 30 Days</option>
                  <option value="NET60">NET 60 Days</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead Time (days)</label>
                <input
                  type="number"
                  value={form.lead_time_days}
                  onChange={(e) => setForm(prev => ({ ...prev, lead_time_days: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Create Supplier'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No suppliers found. Add your first supplier to start importing products.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-secondary-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Markup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                  <td className="px-6 py-4">
                    <div className="font-medium text-secondary-900 dark:text-white">{supplier.name}</div>
                    {supplier.email && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-secondary-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {supplier.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{supplier._count?.products || 0}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{supplier.default_markup}%</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      supplier.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(supplier)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-secondary-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {deleteConfirm === supplier.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            title="Confirm Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-secondary-600 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(supplier.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-secondary-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
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
