/**
 * UI-related constants
 * Timeouts, storage keys, and other UI configuration
 */

// Timeout durations in milliseconds
export const TIMEOUTS = {
  TOAST_DURATION: 5000,
  STATUS_MESSAGE_DURATION: 3000,
  QUICK_ACTION_FEEDBACK: 1500,
  ANIMATION_DURATION: 300,
  DEBOUNCE_SEARCH: 300,
  API_POLLING_INTERVAL: 30000,
  SESSION_WARNING: 60000, // 1 minute before session expires
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME_MODE: 'tassa_theme_mode',
  THEME_COLORS: 'tassa_theme_colors',
  CART: 'tassa_cart',
  WISHLIST: 'tassa_wishlist',
  COMPARE: 'tassa_compare',
  RECENTLY_VIEWED: 'tassa_recently_viewed',
  USER_PREFERENCES: 'tassa_user_preferences',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  VIEW_HISTORY_LIMIT: 50,
  RECENTLY_VIEWED_DISPLAY: 4,
  ADMIN_TABLE_LIMIT: 25,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CSV_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_IMPORT_TYPES: ['text/csv', 'application/json'],
} as const;

// Rate limiting
export const RATE_LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
  MAX_API_REQUESTS_PER_MINUTE: 60,
} as const;

// Animation classes (commonly used Tailwind patterns)
export const ANIMATIONS = {
  FADE_IN: 'animate-fade-in',
  SLIDE_IN: 'animate-slide-in',
  SCALE_IN: 'animate-scale-in',
  SPIN: 'animate-spin',
} as const;

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;
