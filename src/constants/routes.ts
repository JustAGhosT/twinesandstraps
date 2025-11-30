/**
 * Centralized route constants
 * Use these instead of hardcoded route strings
 */

// Public Routes
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string | number) => `/products/${id}`,
  CART: '/cart',
  WISHLIST: '/wishlist',
  COMPARE: '/compare',
  QUOTE: '/quote',
  ABOUT: '/about',
  CONTACT: '/contact',
  TESTIMONIALS: '/testimonials',

  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // User Profile Routes
  PROFILE: '/profile',
  PROFILE_ORDERS: '/profile/orders',
  PROFILE_ORDER_DETAIL: (id: string | number) => `/profile/orders/${id}`,
  PROFILE_ADDRESSES: '/profile/addresses',
  PROFILE_SETTINGS: '/profile/settings',
} as const;

// Admin Routes
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  LOGIN: '/admin/login',
  ORDERS: '/admin/orders',
  ORDER_DETAIL: (id: string | number) => `/admin/orders/${id}`,
  CUSTOMERS: '/admin/customers',
  CUSTOMER_DETAIL: (id: string | number) => `/admin/customers/${id}`,
  PRODUCTS: '/admin/products',
  PRODUCT_DETAIL: (id: string | number) => `/admin/products/${id}`,
  CATEGORIES: '/admin/categories',
  SUPPLIERS: '/admin/suppliers',
  SUPPLIER_DETAIL: (id: string | number) => `/admin/suppliers/${id}`,
  REVIEWS: '/admin/reviews',
  TESTIMONIALS: '/admin/testimonials',
  ACTIVITY: '/admin/activity',
  SETTINGS: '/admin/settings',
  FEATURES: '/admin/features',
  THEME: '/admin/theme',
} as const;
