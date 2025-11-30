'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

interface DiscountCode {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  min_order_value: number | null;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
}

interface MarketingStats {
  total_discounts_active: number;
  total_discount_usage: number;
  total_discount_savings: number;
  email_subscribers: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'discounts' | 'email' | 'analytics'>('discounts');
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const { showToast } = useToast();

  const [discountForm, setDiscountForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
    value: 0,
    min_order_value: '',
    max_uses: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setDiscounts([
        {
          id: 1,
          code: 'WELCOME10',
          type: 'PERCENTAGE',
          value: 10,
          min_order_value: 500,
          max_uses: null,
          current_uses: 45,
          starts_at: null,
          expires_at: '2025-12-31',
          is_active: true,
          created_at: '2025-01-01',
        },
        {
          id: 2,
          code: 'FREESHIP',
          type: 'FREE_SHIPPING',
          value: 0,
          min_order_value: 1000,
          max_uses: 100,
          current_uses: 23,
          starts_at: null,
          expires_at: null,
          is_active: true,
          created_at: '2025-02-15',
        },
        {
          id: 3,
          code: 'BULK50',
          type: 'FIXED_AMOUNT',
          value: 500,
          min_order_value: 5000,
          max_uses: null,
          current_uses: 12,
          starts_at: null,
          expires_at: null,
          is_active: true,
          created_at: '2025-03-01',
        },
      ]);

      setCampaigns([
        {
          id: 1,
          name: 'November Newsletter',
          subject: 'New Products + Special Offer Inside!',
          status: 'SENT',
          sent_count: 1250,
          open_count: 312,
          click_count: 89,
          scheduled_at: null,
          sent_at: '2025-11-15',
        },
        {
          id: 2,
          name: 'Black Friday Promo',
          subject: 'Black Friday Deals - Up to 30% Off!',
          status: 'SCHEDULED',
          sent_count: 0,
          open_count: 0,
          click_count: 0,
          scheduled_at: '2025-11-29T06:00:00',
          sent_at: null,
        },
        {
          id: 3,
          name: 'December Newsletter',
          subject: '',
          status: 'DRAFT',
          sent_count: 0,
          open_count: 0,
          click_count: 0,
          scheduled_at: null,
          sent_at: null,
        },
      ]);

      setStats({
        total_discounts_active: 3,
        total_discount_usage: 80,
        total_discount_savings: 12500,
        email_subscribers: 1450,
        avg_open_rate: 24.9,
        avg_click_rate: 7.1,
      });

      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSaveDiscount = () => {
    // TODO: Implement API call
    showToast('Discount code saved successfully', 'success');
    setShowDiscountForm(false);
    setEditingDiscount(null);
    setDiscountForm({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      min_order_value: '',
      max_uses: '',
      starts_at: '',
      expires_at: '',
      is_active: true,
    });
  };

  const handleEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setDiscountForm({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      min_order_value: discount.min_order_value?.toString() || '',
      max_uses: discount.max_uses?.toString() || '',
      starts_at: discount.starts_at || '',
      expires_at: discount.expires_at || '',
      is_active: discount.is_active,
    });
    setShowDiscountForm(true);
  };

  const handleToggleDiscount = (id: number) => {
    setDiscounts(discounts.map(d =>
      d.id === id ? { ...d, is_active: !d.is_active } : d
    ));
    showToast('Discount status updated', 'success');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage discounts, email campaigns, and marketing analytics
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Discounts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_discounts_active}</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Discount Uses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_discount_usage}</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Savings</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">R{stats.total_discount_savings.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Email Subscribers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.email_subscribers.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Open Rate</p>
            <p className="text-2xl font-bold text-green-600">{stats.avg_open_rate}%</p>
          </div>
          <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-gray-200 dark:border-secondary-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Click Rate</p>
            <p className="text-2xl font-bold text-blue-600">{stats.avg_click_rate}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-secondary-700">
        <nav className="flex gap-4">
          {[
            { id: 'discounts', label: 'Discount Codes', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
            { id: 'email', label: 'Email Campaigns', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discount Codes</h2>
            <button
              onClick={() => setShowDiscountForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Discount
            </button>
          </div>

          {/* Discount Form Modal */}
          {showDiscountForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-secondary-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Discount Code
                      </label>
                      <input
                        type="text"
                        value={discountForm.code}
                        onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                        placeholder="e.g., SUMMER20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={discountForm.type}
                        onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as typeof discountForm.type })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                      >
                        <option value="PERCENTAGE">Percentage Off</option>
                        <option value="FIXED_AMOUNT">Fixed Amount Off</option>
                        <option value="FREE_SHIPPING">Free Shipping</option>
                      </select>
                    </div>

                    {discountForm.type !== 'FREE_SHIPPING' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {discountForm.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (R)'}
                        </label>
                        <input
                          type="number"
                          value={discountForm.value}
                          onChange={(e) => setDiscountForm({ ...discountForm, value: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                          min="0"
                          max={discountForm.type === 'PERCENTAGE' ? '100' : undefined}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Order Value (R) <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={discountForm.min_order_value}
                        onChange={(e) => setDiscountForm({ ...discountForm, min_order_value: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                        placeholder="No minimum"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum Uses <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={discountForm.max_uses}
                        onChange={(e) => setDiscountForm({ ...discountForm, max_uses: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                        placeholder="Unlimited"
                        min="1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Date <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="date"
                          value={discountForm.starts_at}
                          onChange={(e) => setDiscountForm({ ...discountForm, starts_at: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Date <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="date"
                          value={discountForm.expires_at}
                          onChange={(e) => setDiscountForm({ ...discountForm, expires_at: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={discountForm.is_active}
                        onChange={(e) => setDiscountForm({ ...discountForm, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                        Active immediately
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowDiscountForm(false);
                        setEditingDiscount(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-secondary-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDiscount}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {editingDiscount ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discounts Table */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Min Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-secondary-700">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700/50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">{discount.code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {discount.type === 'PERCENTAGE' && 'Percentage'}
                      {discount.type === 'FIXED_AMOUNT' && 'Fixed Amount'}
                      {discount.type === 'FREE_SHIPPING' && 'Free Shipping'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {discount.type === 'PERCENTAGE' && `${discount.value}%`}
                      {discount.type === 'FIXED_AMOUNT' && `R${discount.value}`}
                      {discount.type === 'FREE_SHIPPING' && '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {discount.min_order_value ? `R${discount.min_order_value}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {discount.current_uses}{discount.max_uses ? ` / ${discount.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(discount.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleDiscount(discount.id)}
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          discount.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-gray-400'
                        }`}
                      >
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEditDiscount(discount)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Campaigns</h2>
            <button
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Campaign
            </button>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        campaign.status === 'SENT'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : campaign.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-gray-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {campaign.subject || 'No subject set'}
                    </p>
                    {campaign.status === 'SCHEDULED' && campaign.scheduled_at && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        Scheduled for: {new Date(campaign.scheduled_at).toLocaleString('en-ZA')}
                      </p>
                    )}
                  </div>

                  {campaign.status === 'SENT' && (
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Sent</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{campaign.sent_count.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Opens</p>
                        <p className="font-semibold text-green-600">
                          {campaign.open_count.toLocaleString()}
                          <span className="text-xs text-gray-400 ml-1">
                            ({((campaign.open_count / campaign.sent_count) * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Clicks</p>
                        <p className="font-semibold text-blue-600">
                          {campaign.click_count.toLocaleString()}
                          <span className="text-xs text-gray-400 ml-1">
                            ({((campaign.click_count / campaign.sent_count) * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="ml-4">
                    <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm">
                      {campaign.status === 'DRAFT' ? 'Edit' : 'View'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Email Integration Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Connect your email service (Brevo, Mailchimp, etc.) to enable campaign sending.
                  See the <a href="/admin/settings" className="underline">Settings</a> page to configure.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Integration Roadmap */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Integration Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Google Analytics */}
              <div className="p-4 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Google Analytics 4</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Web analytics & e-commerce tracking</p>
                <span className="text-xs text-gray-400">ADR 009</span>
              </div>

              {/* Email Marketing */}
              <div className="p-4 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Email Marketing</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Brevo/Sendinblue integration</p>
                <span className="text-xs text-gray-400">ADR 004</span>
              </div>

              {/* Google Merchant Center */}
              <div className="p-4 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Google Shopping</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Product feed for Google Shopping</p>
                <span className="text-xs text-gray-400">ADR 007</span>
              </div>

              {/* Facebook Catalog */}
              <div className="p-4 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Facebook Shops</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Product catalog for FB/IG</p>
                <span className="text-xs text-gray-400">ADR 007</span>
              </div>

              {/* Product Search */}
              <div className="p-4 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Product Search</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-gray-400">
                    Planned
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Algolia search integration</p>
                <span className="text-xs text-gray-400">ADR 006</span>
              </div>

              {/* Takealot */}
              <div className="p-4 border border-gray-200 dark:border-secondary-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Takealot</span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-gray-400">
                    Planned
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">SA marketplace integration</p>
                <span className="text-xs text-gray-400">ADR 007</span>
              </div>
            </div>
          </div>

          {/* Implementation Roadmap */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Implementation Roadmap</h2>
            <div className="space-y-4">
              {/* Phase 1 */}
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Phase 1: Foundation</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Priority integrations for immediate value</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Google Analytics 4 setup
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Email service configuration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    Discount codes (Active)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    Google Merchant Center
                  </li>
                </ul>
              </div>

              {/* Phase 2 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Phase 2: Growth</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Expand reach and automation</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Facebook Catalog integration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Email automation flows
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Product search (Algolia)
                  </li>
                </ul>
              </div>

              {/* Phase 3 */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Phase 3: Expansion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Scale to new channels</p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Takealot marketplace
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Referral program
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analytics Dashboard Preview</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Once integrations are configured, this dashboard will display:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Traffic sources and trends
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Conversion funnel visualization
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Campaign ROI by channel
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Customer lifetime value
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Product performance metrics
              </li>
            </ul>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Next Step:</strong> Configure Google Analytics in Settings to enable real-time analytics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
