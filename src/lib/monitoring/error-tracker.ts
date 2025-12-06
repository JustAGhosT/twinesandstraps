/**
 * Error Tracking and Logging
 * Centralized error tracking with Application Insights integration
 */

import { trackException, trackTrace, trackEvent } from './app-insights';

import { logInfo as loggerInfo, logError as loggerError, logWarn, logDebug } from '@/lib/logging/logger';

export interface ErrorContext {
  userId?: number;
  orderId?: number;
  productId?: number;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: any;
}

/**
 * Log error with context
 */
export function logError(error: Error | unknown, context?: ErrorContext) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  // Track in Application Insights
  trackException(errorObj, context as any);

  // Also log to console for development
  if (process.env.NODE_ENV === 'development') {
    loggerError('Error:', errorObj, context);
    if (errorObj.stack) {
      loggerError('Stack:', new Error(errorObj.stack), context);
    }
  }
}

/**
 * Log warning
 */
export function logWarning(message: string, context?: ErrorContext) {
  trackTrace(`WARNING: ${message}`, 2, context as any);
  
  if (process.env.NODE_ENV === 'development') {
    logWarn('Warning:', new Error(message), context);
  }
}

/**
 * Log info
 */
export function logInfo(message: string, context?: Record<string, any>) {
  trackTrace(message, 1, context);
  
  if (process.env.NODE_ENV === 'development') {
    loggerInfo('Info:', message, context);
  }
}

/**
 * Track performance metric
 */
export function trackPerformance(metricName: string, value: number, unit: string = 'ms', context?: Record<string, any>) {
  trackEvent(`Performance:${metricName}`, {
    value: value.toString(),
    unit,
    ...context,
  });
}

/**
 * Create error wrapper for async functions
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  }) as T;
}

