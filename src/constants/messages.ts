/**
 * Centralized message constants
 * Error messages, success messages, and UI copy
 */

// Generic error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
} as const;

// Entity-specific not found messages
export const NOT_FOUND_MESSAGES = {
  PRODUCT: 'Product not found',
  ORDER: 'Order not found',
  CUSTOMER: 'Customer not found',
  CATEGORY: 'Category not found',
  SUPPLIER: 'Supplier not found',
  REVIEW: 'Review not found',
  ADDRESS: 'Address not found',
  USER: 'User not found',
} as const;

// Entity-specific failed messages
export const FAILED_MESSAGES = {
  FETCH_PRODUCTS: 'Failed to fetch products',
  FETCH_ORDERS: 'Failed to fetch orders',
  FETCH_CUSTOMERS: 'Failed to fetch customers',
  FETCH_CATEGORIES: 'Failed to fetch categories',
  FETCH_SUPPLIERS: 'Failed to fetch suppliers',
  FETCH_REVIEWS: 'Failed to fetch reviews',
  CREATE_PRODUCT: 'Failed to create product',
  CREATE_ORDER: 'Failed to create order',
  CREATE_SUPPLIER: 'Failed to create supplier',
  UPDATE_PRODUCT: 'Failed to update product',
  UPDATE_ORDER: 'Failed to update order',
  UPDATE_SUPPLIER: 'Failed to update supplier',
  DELETE_PRODUCT: 'Failed to delete product',
  DELETE_ORDER: 'Failed to delete order',
  DELETE_SUPPLIER: 'Failed to delete supplier',
  IMPORT_PRODUCTS: 'Failed to import products',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  SUPPLIER_CREATED: 'Supplier created successfully',
  SUPPLIER_UPDATED: 'Supplier updated successfully',
  SUPPLIER_DELETED: 'Supplier deleted successfully',
  REVIEW_SUBMITTED: 'Review submitted successfully',
  REVIEW_APPROVED: 'Review approved successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  IMPORT_COMPLETED: 'Import completed successfully',
  ADDED_TO_CART: 'Added to cart successfully',
  REMOVED_FROM_CART: 'Removed from cart',
  ADDED_TO_WISHLIST: 'Added to wishlist',
  REMOVED_FROM_WISHLIST: 'Removed from wishlist',
  NEWSLETTER_SUBSCRIBED: 'Thank you for subscribing! We\'ll keep you updated.',
} as const;

// Context hook error messages
export const CONTEXT_ERRORS = {
  CART: 'useCart must be used within a CartProvider',
  COMPARE: 'useCompare must be used within a CompareProvider',
  TOAST: 'useToast must be used within a ToastProvider',
  ADMIN_AUTH: 'useAdminAuth must be used within an AdminAuthProvider',
  USER_AUTH: 'useUserAuth must be used within a UserAuthProvider',
  WISHLIST: 'useWishlist must be used within a WishlistProvider',
  THEME: 'useTheme must be used within a ThemeProvider',
  SITE_SETTINGS: 'useSiteSettings must be used within a SiteSettingsProvider',
  CONFIRM: 'useConfirm must be used within a ConfirmProvider',
} as const;

// Validation error messages (for reference, actual validation in validations.ts)
export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must be at most ${max} characters`,
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_URL: 'Invalid URL',
  PASSWORD_MIN: 'Password must be at least 8 characters',
  PASSWORD_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_NUMBER: 'Password must contain at least one number',
  PASSWORDS_MATCH: 'Passwords do not match',
} as const;

// Empty state messages
export const EMPTY_STATES = {
  NO_PRODUCTS: 'No products found',
  NO_ORDERS: 'No orders found',
  NO_REVIEWS: 'No reviews yet',
  NO_RESULTS: 'No results found',
  CART_EMPTY: 'Your cart is empty',
  WISHLIST_EMPTY: 'Your wishlist is empty',
  COMPARE_EMPTY: 'No products to compare',
} as const;
