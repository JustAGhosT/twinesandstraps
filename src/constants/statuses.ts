/**
 * Centralized status constants for the application
 * Use these instead of magic strings throughout the codebase
 */

// Stock Status
export const STOCK_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  [STOCK_STATUS.IN_STOCK]: 'In Stock',
  [STOCK_STATUS.LOW_STOCK]: 'Low Stock',
  [STOCK_STATUS.OUT_OF_STOCK]: 'Out of Stock',
};

export const STOCK_STATUS_COLORS: Record<StockStatus, { text: string; bg: string; darkText: string; darkBg: string }> = {
  [STOCK_STATUS.IN_STOCK]: {
    text: 'text-green-700',
    bg: 'bg-green-100',
    darkText: 'dark:text-green-300',
    darkBg: 'dark:bg-green-900/30',
  },
  [STOCK_STATUS.LOW_STOCK]: {
    text: 'text-amber-700',
    bg: 'bg-amber-100',
    darkText: 'dark:text-amber-300',
    darkBg: 'dark:bg-amber-900/30',
  },
  [STOCK_STATUS.OUT_OF_STOCK]: {
    text: 'text-red-700',
    bg: 'bg-red-100',
    darkText: 'dark:text-red-300',
    darkBg: 'dark:bg-red-900/30',
  },
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, { text: string; bg: string }> = {
  [ORDER_STATUS.PENDING]: { text: 'text-yellow-800', bg: 'bg-yellow-100' },
  [ORDER_STATUS.CONFIRMED]: { text: 'text-blue-800', bg: 'bg-blue-100' },
  [ORDER_STATUS.PROCESSING]: { text: 'text-indigo-800', bg: 'bg-indigo-100' },
  [ORDER_STATUS.SHIPPED]: { text: 'text-purple-800', bg: 'bg-purple-100' },
  [ORDER_STATUS.DELIVERED]: { text: 'text-green-800', bg: 'bg-green-100' },
  [ORDER_STATUS.CANCELLED]: { text: 'text-red-800', bg: 'bg-red-100' },
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
};

// Review Status
export const REVIEW_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  [REVIEW_STATUS.PENDING]: 'Pending',
  [REVIEW_STATUS.APPROVED]: 'Approved',
  [REVIEW_STATUS.REJECTED]: 'Rejected',
};

// Import Batch Status
export const IMPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type ImportStatus = typeof IMPORT_STATUS[keyof typeof IMPORT_STATUS];

// User Roles
export const USER_ROLE = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

// Setup Task Categories
export const SETUP_CATEGORY = {
  BRANDING: 'BRANDING',
  PRODUCTS: 'PRODUCTS',
  SETTINGS: 'SETTINGS',
  CONTENT: 'CONTENT',
} as const;

export type SetupCategory = typeof SETUP_CATEGORY[keyof typeof SETUP_CATEGORY];

// Activity Log Actions
export const ACTIVITY_ACTION = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
} as const;

export type ActivityAction = typeof ACTIVITY_ACTION[keyof typeof ACTIVITY_ACTION];

// Activity Log Entity Types
export const ENTITY_TYPE = {
  PRODUCT: 'PRODUCT',
  ORDER: 'ORDER',
  CUSTOMER: 'CUSTOMER',
  CATEGORY: 'CATEGORY',
  SUPPLIER: 'SUPPLIER',
  REVIEW: 'REVIEW',
  SETTINGS: 'SETTINGS',
  TESTIMONIAL: 'TESTIMONIAL',
} as const;

export type EntityType = typeof ENTITY_TYPE[keyof typeof ENTITY_TYPE];
