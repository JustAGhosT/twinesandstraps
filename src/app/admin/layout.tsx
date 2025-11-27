'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';
import { useCustomLogo } from '@/hooks/useCustomLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { ToastProvider } from '@/components/Toast';
import { ConfirmProvider } from '@/components/ConfirmModal';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/admin/customers', label: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/categories', label: 'Categories', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/admin/settings', label: 'Site Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { href: '/admin/features', label: 'Feature Flags', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' },
  { href: '/admin/theme', label: 'Theme & Colors', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
];

function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAdminAuth();
  const customLogoUrl = useCustomLogo();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className="w-64 bg-secondary-900 text-white min-h-screen flex flex-col"
      role="navigation"
      aria-label="Admin navigation"
    >
      <div className="p-4 border-b border-secondary-700">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            aria-label="TASSA Admin Dashboard"
          >
            <div className="w-8 h-8 rounded-full border-2 border-primary-500 flex items-center justify-center bg-white overflow-hidden">
              {customLogoUrl ? (
                <Image
                  src={customLogoUrl}
                  alt="TASSA Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-primary-600 font-bold text-xs" aria-hidden="true">TS</span>
              )}
            </div>
            <span className="font-bold">TASSA Admin</span>
          </Link>
          <ThemeToggle variant="icon" className="text-gray-300 hover:text-white hover:bg-secondary-800" />
        </div>
      </div>

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      <nav className="flex-1 p-4 space-y-1" aria-label="Admin menu">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-secondary-800 hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-secondary-700 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-secondary-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900"
          aria-label="View public website"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>View Site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-secondary-900"
          aria-label="Logout from admin panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  // Login page doesn't need the admin layout wrapper
  const isLoginPage = pathname === '/admin/login';

  // Redirect to login if not authenticated (must be in useEffect to avoid calling during render)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push(`/admin/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-gray-100 dark:bg-secondary-900 flex items-center justify-center"
        role="status"
        aria-label={isLoading ? "Loading admin panel" : "Redirecting to login"}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">{isLoading ? "Loading..." : "Redirecting..."}</span>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex min-h-screen bg-gray-100 dark:bg-secondary-900">
          <AdminSidebar />
          <main id="main-content" className="flex-1 p-8 overflow-auto" role="main">
            {children}
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
