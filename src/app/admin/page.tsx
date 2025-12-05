'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LowStockWidget from '@/components/admin/LowStockWidget';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

interface SetupTask {
  id: number;
  task_key: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  is_required: boolean;
  completed: boolean;
  completed_at: string | null;
  link_url: string | null;
  link_text: string | null;
}

interface SetupTasksData {
  tasks: SetupTask[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    requiredPending: number;
    completionPercentage: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupTasks, setSetupTasks] = useState<SetupTasksData | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setStats)
      .catch(() => setStats({ totalProducts: 0, totalCategories: 0, lowStockProducts: 0, outOfStockProducts: 0 }))
      .finally(() => setLoading(false));

    fetch('/api/admin/setup-tasks')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setSetupTasks)
      .catch(() => setSetupTasks(null))
      .finally(() => setSetupLoading(false));
  }, []);

  const toggleTask = async (taskKey: string, currentCompleted: boolean) => {
    try {
      const res = await fetch('/api/admin/setup-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_key: taskKey, completed: !currentCompleted }),
      });
      if (res.ok) {
        // Refresh the tasks
        const data = await fetch('/api/admin/setup-tasks').then(r => r.json());
        setSetupTasks(data);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const quickActions = [
    { href: '/admin/products/new', label: 'Add New Product', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', color: 'bg-green-500' },
    { href: '/admin/categories/new', label: 'Add Category', icon: 'M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z', color: 'bg-blue-500' },
    { href: '/admin/settings', label: 'Site Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: 'bg-purple-500' },
    { href: '/admin/theme', label: 'Customize Theme', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', color: 'bg-pink-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome to the TASSA admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white">
                {loading ? '...' : stats?.totalProducts}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
              <p className="text-3xl font-bold text-secondary-900 dark:text-white">
                {loading ? '...' : stats?.totalCategories}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {loading ? '...' : stats?.lowStockProducts}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {loading ? '...' : stats?.outOfStockProducts}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <span className="font-medium text-secondary-900 dark:text-white">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Low Stock Widget */}
      <div className="mb-8">
        <LowStockWidget />
      </div>

      {/* Setup Checklist */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Store Setup Checklist</h2>
            {setupTasks && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {setupTasks.stats.completed} of {setupTasks.stats.total} tasks completed
              </p>
            )}
          </div>
          {setupTasks && setupTasks.stats.requiredPending > 0 && (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
              {setupTasks.stats.requiredPending} required
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {setupTasks && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-secondary-700 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${setupTasks.stats.completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {setupTasks.stats.completionPercentage}% complete
            </p>
          </div>
        )}

        {/* Task List */}
        {setupLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading tasks...</p>
          </div>
        ) : setupTasks ? (
          <div className="space-y-3">
            {setupTasks.tasks.map((task) => (
              <div
                key={task.task_key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  task.completed
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
                    : task.is_required
                    ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                    : 'bg-gray-50 dark:bg-secondary-700/50 border-gray-200 dark:border-secondary-600'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.task_key, task.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-500 hover:border-primary-500'
                  }`}
                  aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.completed && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${
                      task.completed
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-secondary-900 dark:text-white'
                    }`}>
                      {task.title}
                    </h3>
                    {task.is_required && !task.completed && (
                      <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-xs font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-0.5 ${
                    task.completed
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {task.description}
                  </p>
                  {!task.completed && task.link_url && (
                    <Link
                      href={task.link_url}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      {task.link_text || 'Get Started'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
                <span className={`flex-shrink-0 text-xs px-2 py-1 rounded ${
                  task.category === 'BRANDING' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                  task.category === 'PRODUCTS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                  task.category === 'SETTINGS' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                }`}>
                  {task.category}
                </span>
              </div>
            ))}

            {/* Celebration Message */}
            {setupTasks.stats.completionPercentage === 100 && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  Congratulations! You&apos;ve completed all setup tasks!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Unable to load setup tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
