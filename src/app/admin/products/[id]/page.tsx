'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AIAssistantPanel from '@/components/AIAssistantPanel';
import UseAIButton from '@/components/UseAIButton';

interface Category {
  id: number;
  name: string;
}

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  material: string;
  diameter: string;
  length: string;
  strength_rating: string;
  price: string;
  vat_applicable: boolean;
  stock_status: string;
  image_url: string;
  category_id: string;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<ProductForm>({
    name: '',
    sku: '',
    description: '',
    material: '',
    diameter: '',
    length: '',
    strength_rating: '',
    price: '',
    vat_applicable: true,
    stock_status: 'IN_STOCK',
    image_url: '',
    category_id: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${params.id}`);
      if (res.ok) {
        const product = await res.json();
        setForm({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          material: product.material || '',
          diameter: product.diameter?.toString() || '',
          length: product.length?.toString() || '',
          strength_rating: product.strength_rating || '',
          price: product.price?.toString() || '',
          vat_applicable: product.vat_applicable ?? true,
          stock_status: product.stock_status || 'IN_STOCK',
          image_url: product.image_url || '',
          category_id: product.category_id?.toString() || '',
        });
        if (product.image_url) {
          setImagePreview(product.image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCategories();
    if (!isNew) {
      fetchProduct();
    }
  }, [isNew, fetchCategories, fetchProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setForm(prev => ({ ...prev, image_url: url }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      material: form.material || null,
      diameter: form.diameter ? parseFloat(form.diameter) : null,
      length: form.length ? parseFloat(form.length) : null,
      strength_rating: form.strength_rating || null,
      price: parseFloat(form.price),
      vat_applicable: form.vat_applicable,
      stock_status: form.stock_status,
      image_url: form.image_url || null,
      category_id: parseInt(form.category_id),
    };

    try {
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/admin/products');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Prepare product data for AI assistant
  const productDataForAI = useMemo(() => {
    const selectedCategory = categories.find(c => c.id.toString() === form.category_id);
    return {
      name: form.name,
      description: form.description,
      material: form.material || null,
      category: selectedCategory?.name,
      price: parseFloat(form.price) || 0,
    };
  }, [form.name, form.description, form.material, form.category_id, form.price, categories]);

  // Handle AI description suggestions
  const handleApplyDescription = useCallback((description: string) => {
    setForm(prev => ({ ...prev, description }));
  }, []);

  // Handle AI price suggestions
  const handleApplyPrice = useCallback((price: number) => {
    setForm(prev => ({ ...prev, price: price.toFixed(2) }));
  }, []);

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
          href="/admin/products"
          className="p-2 text-gray-600 hover:text-secondary-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isNew ? 'Create a new product listing' : 'Update product details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <UseAIButton
                      action="enhance-description"
                      label="Enhance"
                      contextData={{
                        description: form.description,
                        name: form.name,
                        material: form.material,
                      }}
                      onApply={(value) => setForm(prev => ({ ...prev, description: String(value) }))}
                      disabled={!form.name || !form.description}
                    />
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <input
                    type="text"
                    name="material"
                    value={form.material}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. SISAL, Polypropylene"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strength Rating</label>
                  <input
                    type="text"
                    name="strength_rating"
                    value={form.strength_rating}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. 500kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diameter (mm)</label>
                  <input
                    type="number"
                    name="diameter"
                    value={form.diameter}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length (m)</label>
                  <input
                    type="number"
                    name="length"
                    value={form.length}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Product Image</h2>
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Choose image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="Or enter image URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Pricing & Stock</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Price (ZAR) *</label>
                    <UseAIButton
                      action="suggest-pricing"
                      label="Suggest"
                      contextData={{
                        name: form.name,
                        material: form.material,
                      }}
                      onApply={(value) => {
                        const numValue = Number(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          setForm(prev => ({ ...prev, price: numValue.toFixed(2) }));
                        }
                      }}
                      disabled={!form.name}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vat_applicable"
                    name="vat_applicable"
                    checked={form.vat_applicable}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="vat_applicable" className="text-sm text-gray-700">VAT Applicable (15%)</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status *</label>
                  <select
                    name="stock_status"
                    value={form.stock_status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Assistant Panel */}
            <AIAssistantPanel
              productData={productDataForAI}
              onApplyDescription={handleApplyDescription}
              onApplyPrice={handleApplyPrice}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : (isNew ? 'Create Product' : 'Save Changes')}
          </button>
        </div>
      </form>
    </div>
  );
}
