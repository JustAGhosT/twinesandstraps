'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

interface CategoryForm {
  name: string;
  slug: string;
  parent_id: string;
}

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CategoryForm>({
    name: '',
    slug: '',
    parent_id: '',
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchCategory = useCallback(async () => {
    try {
      const res = await fetch(`/api/categories/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const category = data.data;
        setForm({
          name: category.name || '',
          slug: category.slug || '',
          parent_id: category.parent_id?.toString() || '',
        });
      } else {
        setError('Category not found');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCategories();
    if (!isNew) {
      fetchCategory();
    }
  }, [isNew, fetchCategories, fetchCategory]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({
      ...prev,
      name,
      slug: isNew ? generateSlug(name) : prev.slug,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      slug: form.slug,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
    };

    try {
      const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/categories');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/categories"
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-secondary-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            {isNew ? 'Add New Category' : 'Edit Category'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isNew ? 'Create a new product category' : 'Update category details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Category Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleNameChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                placeholder="e.g., Industrial Ropes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                placeholder="e.g., industrial-ropes"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                URL-friendly identifier. Auto-generated from name for new categories.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Category
              </label>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
              >
                <option value="">None (Top-level category)</option>
                {categories
                  .filter(cat => cat.id.toString() !== params.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Optional. Select a parent to create a subcategory.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/categories"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : (isNew ? 'Create Category' : 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
}
