/**
 * Marketplace Management Dashboard
 * Manage product feeds, inventory sync, and channel pricing
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function MarketplacePage() {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const handleSyncInventory = async (channel: string) => {
    setSyncing(true);
    setSyncStatus(`Syncing inventory to ${channel}...`);

    try {
      const response = await fetch('/api/marketplace/sync', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus(`Found ${data.count} products needing sync to ${channel}`);
      } else {
        setSyncStatus('Error syncing inventory');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('Error syncing inventory');
    } finally {
      setSyncing(false);
    }
  };

  const feedLinks = [
    {
      name: 'Google Shopping Feed',
      url: '/api/feeds/google',
      description: 'XML feed for Google Merchant Center',
      format: 'XML',
    },
    {
      name: 'Facebook Catalog Feed',
      url: '/api/feeds/facebook',
      description: 'JSON feed for Facebook Commerce',
      format: 'JSON',
    },
    {
      name: 'CSV Feed',
      url: '/api/feeds/csv',
      description: 'CSV feed for Takealot and other marketplaces',
      format: 'CSV',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Marketplace Management</h1>

      {/* Product Feeds */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Product Feeds</h2>
        <p className="text-muted-foreground mb-4">
          Use these feed URLs to connect your products to marketplaces and shopping platforms.
        </p>

        <div className="space-y-4">
          {feedLinks.map((feed) => (
            <div
              key={feed.name}
              className="border border-gray-200 dark:border-secondary-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feed.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{feed.description}</p>
                  <code className="text-xs bg-gray-100 dark:bg-secondary-900 px-2 py-1 rounded">
                    {feed.url}
                  </code>
                </div>
                <div className="flex gap-2">
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    View Feed
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}${feed.url}`)}
                    className="px-4 py-2 bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-secondary-600 transition-colors text-sm"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Sync */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Inventory Sync</h2>
        <p className="text-muted-foreground mb-4">
          Sync your inventory to external marketplaces to keep stock levels up to date.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleSyncInventory('TAKEALOT')}
            disabled={syncing}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync to Takealot'}
          </button>

          {syncStatus && (
            <p className="text-sm text-muted-foreground">{syncStatus}</p>
          )}
        </div>
      </div>

      {/* Channel Pricing */}
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Channel-Specific Pricing</h2>
        <p className="text-muted-foreground mb-4">
          Manage pricing for different sales channels. Each channel can have its own pricing strategy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['WEBSITE', 'TAKEALOT', 'FACEBOOK', 'GOOGLE_SHOPPING', 'BOB_SHOP'].map((channel) => (
            <div
              key={channel}
              className="border border-gray-200 dark:border-secondary-700 rounded-lg p-4"
            >
              <h3 className="font-semibold mb-2">{channel}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {channel === 'TAKEALOT' && '5% discount applied'}
                {channel === 'BOB_SHOP' && '3% discount applied'}
                {channel === 'WEBSITE' && 'Base pricing'}
                {!['TAKEALOT', 'BOB_SHOP', 'WEBSITE'].includes(channel) && 'Same as website'}
              </p>
              <Link href={`/admin/marketplace/pricing?channel=${channel}`}>
                <Button className="text-sm">
                  Manage Pricing
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

