/**
 * Centralized API endpoint constants
 * Use these instead of hardcoded API paths
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // Admin Auth
  ADMIN_AUTH: '/api/admin/auth',

  // Products
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string | number) => `/api/products/${id}`,
    FEATURED: '/api/products/featured',
  },

  // Categories
  CATEGORIES: {
    LIST: '/api/categories',
    DETAIL: (id: string | number) => `/api/categories/${id}`,
  },

  // Reviews
  REVIEWS: {
    LIST: '/api/reviews',
    PRODUCT: (productId: string | number) => `/api/reviews?productId=${productId}`,
  },

  // User
  USER: {
    PROFILE: '/api/user/profile',
    ADDRESSES: '/api/user/addresses',
    ADDRESS_DETAIL: (id: string | number) => `/api/user/addresses/${id}`,
    ORDERS: '/api/user/orders',
    ORDER_DETAIL: (id: string | number) => `/api/user/orders/${id}`,
    VIEW_HISTORY: '/api/user/view-history',
  },

  // Settings
  SETTINGS: '/api/settings',
  THEME: '/api/theme',

  // Admin APIs
  ADMIN: {
    AI: '/api/admin/ai',
    THEME: '/api/admin/theme',
    LOGO: '/api/admin/logo',
    UPLOAD: '/api/admin/upload',
    STATS: '/api/admin/stats',
    SETUP_TASKS: '/api/admin/setup-tasks',
    ACTIVITY: '/api/admin/activity',

    // Admin CRUD endpoints
    ORDERS: {
      LIST: '/api/admin/orders',
      DETAIL: (id: string | number) => `/api/admin/orders/${id}`,
    },
    CUSTOMERS: {
      LIST: '/api/admin/customers',
      DETAIL: (id: string | number) => `/api/admin/customers/${id}`,
    },
    PRODUCTS: {
      LIST: '/api/admin/products',
      DETAIL: (id: string | number) => `/api/admin/products/${id}`,
    },
    CATEGORIES: {
      LIST: '/api/admin/categories',
      DETAIL: (id: string | number) => `/api/admin/categories/${id}`,
    },
    SUPPLIERS: {
      LIST: '/api/admin/suppliers',
      DETAIL: (id: string | number) => `/api/admin/suppliers/${id}`,
      IMPORT: (id: string | number) => `/api/admin/suppliers/${id}/import`,
    },
    REVIEWS: {
      LIST: '/api/admin/reviews',
      DETAIL: (id: string | number) => `/api/admin/reviews/${id}`,
    },
    TESTIMONIALS: {
      LIST: '/api/admin/testimonials',
      DETAIL: (id: string | number) => `/api/admin/testimonials/${id}`,
    },
  },
} as const;
