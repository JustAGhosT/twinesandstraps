/**
 * Standardized API Response Types
 * 
 * All API endpoints should return responses wrapped in these types
 * to ensure consistent structure across the application.
 */

/**
 * Base API response interface with success/failure flag and message
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: Record<string, string>;
}

/**
 * Success response type
 */
export interface ApiSuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response type
 */
export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  error: string;
  details?: Record<string, string>;
}

/**
 * Paginated response data
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore?: boolean;
  };
}

/**
 * Upload response data
 */
export interface UploadData {
  url: string;
  filename: string;
  size: number;
  type: string;
}

/**
 * Helper function to create a success response
 */
export function successResponse<T>(data: T, message: string = 'Operation successful'): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Helper function to create an error response
 */
export function errorResponse(error: string, details?: Record<string, string>): ApiErrorResponse {
  return {
    success: false,
    message: error,
    error,
    details,
  };
}
