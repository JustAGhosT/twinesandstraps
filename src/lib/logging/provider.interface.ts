/**
 * Logging Provider Interface
 * All logging providers must implement this interface
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ILoggingProvider {
  /**
   * Provider identifier (e.g., 'console', 'app-insights', 'file')
   */
  readonly name: string;

  /**
   * Human-readable provider name
   */
  readonly displayName: string;

  /**
   * Check if the provider is configured and available.
   */
  isConfigured(): boolean;

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void;

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void;

  /**
   * Get current minimum log level
   */
  getLevel(): LogLevel;
}

