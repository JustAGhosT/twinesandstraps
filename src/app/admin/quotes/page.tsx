/**
 * Admin Quote Management Dashboard
 * View, create, edit, and manage B2B quotes
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';

interface Quote {
  id: number;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  status: string;
  total: number;
  created_at: string;
  expires_at?: string;
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/admin/quotes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      VIEWED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.DRAFT}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quote Management</h1>
        <Link href="/admin/quotes/new">
          <Button>Create New Quote</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['all', 'DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Quotes Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No quotes found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
            <thead className="bg-gray-50 dark:bg-secondary-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quote #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {quote.quote_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {quote.customer_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {quote.customer_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {quote.customer_company || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    R{quote.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(quote.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/quotes/${quote.id}/pdf`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                    >
                      PDF
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

