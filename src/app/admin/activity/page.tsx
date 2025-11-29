'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  metadata: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  APPROVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  SHIP: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  DELIVER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  CANCEL: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  VIEW: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  UPLOAD: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  EXPORT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const ENTITY_ICONS: Record<string, string> = {
  PRODUCT: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  ORDER: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  CUSTOMER: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  CATEGORY: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  REVIEW: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  SETTINGS: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  ADMIN: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  THEME: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  FEATURE: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  TESTIMONIAL: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  LOGO: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
};

const ENTITY_TYPES = ['PRODUCT', 'ORDER', 'CUSTOMER', 'CATEGORY', 'REVIEW', 'TESTIMONIAL', 'SETTINGS', 'THEME', 'FEATURE', 'ADMIN', 'LOGO'];
const ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'SHIP', 'DELIVER', 'CANCEL', 'UPLOAD', 'EXPORT'];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      if (entityTypeFilter) params.set('entity_type', entityTypeFilter);
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');

      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Safely parse JSON metadata with fallback
  const safeParseMetadata = (metadata: string): string => {
    try {
      const parsed = JSON.parse(metadata);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Return raw string if JSON parsing fails
      return metadata;
    }
  };

  const clearFilters = () => {
    setEntityTypeFilter('');
    setActionFilter('');
    setPage(1);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Activity Log</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track all admin actions and changes</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              {ENTITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {(entityTypeFilter || actionFilter) && (
            <button
              onClick={clearFilters}
              className="mt-5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto mt-5">
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading activity logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No activity logs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Activity will appear here as you use the admin panel</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-secondary-700">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-secondary-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Entity Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-secondary-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ENTITY_ICONS[log.entity_type] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {log.entity_type}
                        {log.entity_id && ` #${log.entity_id}`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-secondary-900 dark:text-white">{log.description}</p>
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                          View details
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-secondary-700 rounded text-xs overflow-x-auto">
                          {safeParseMetadata(log.metadata)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatTimeAgo(log.created_at)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-secondary-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">About Activity Logs</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>Activity logs track all admin actions including creates, updates, and deletes</li>
          <li>Logs are stored for auditing and troubleshooting purposes</li>
          <li>Use the filters above to find specific activities</li>
        </ul>
      </div>
    </div>
  );
}
