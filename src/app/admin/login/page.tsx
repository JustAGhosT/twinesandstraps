'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import Link from 'next/link';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error: authError } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    const success = await login(password);
    if (success) {
      // Redirect to original page or dashboard
      const from = searchParams.get('from') || '/admin';
      router.push(from);
    } else {
      setError(authError || 'Invalid password');
    }
  };

  return (
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-primary-600 flex items-center justify-center bg-white mx-auto mb-4">
            <span className="text-primary-600 font-bold text-xl">TS</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Admin Login</h1>
          <p className="text-gray-500 mt-2">Enter your password to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter admin password"
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {(error || authError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-primary-600">
            Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminLoginFallback() {
  return (
    <div className="max-w-md w-full mx-4">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-4 border-primary-600 flex items-center justify-center bg-white mx-auto mb-4">
            <span className="text-primary-600 font-bold text-xl">TS</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Admin Login</h1>
          <p className="text-gray-500 mt-2">Enter your password to access the admin panel</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Suspense fallback={<AdminLoginFallback />}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
