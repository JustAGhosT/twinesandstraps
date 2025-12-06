/**
 * Centralized Logger
 * Uses provider pattern to support multiple logging backends
 */

import { ILoggingProvider, LogLevel, LogContext } from './provider.interface';
import { ConsoleLoggingProvider } from './providers/console.provider';

class Logger {
  private providers: ILoggingProvider[] = [];
  private defaultLevel: LogLevel = process.env.NODE_ENV === 'production' 
    ? LogLevel.INFO 
    : LogLevel.DEBUG;
  private appInsightsProvider: ILoggingProvider | null = null;

  constructor() {
    // Register default providers
    this.registerProvider(new ConsoleLoggingProvider());
    
    // Register Application Insights if configured (server-side only)
    if (typeof window === 'undefined') {
      // Dynamic import to avoid bundling in client
      import('./providers/app-insights.provider').then(({ AppInsightsLoggingProvider }) => {
        const appInsightsProvider = new AppInsightsLoggingProvider();
        if (appInsightsProvider.isConfigured()) {
          this.appInsightsProvider = appInsightsProvider;
          this.registerProvider(appInsightsProvider);
        }
      }).catch(() => {
        // Application Insights not available, continue with console only
      });
    }

    // Set default level for all providers
    this.setLevel(this.defaultLevel);
  }

  /**
   * Register a logging provider
   */
  registerProvider(provider: ILoggingProvider): void {
    provider.setLevel(this.defaultLevel);
    this.providers.push(provider);
  }

  /**
   * Set minimum log level for all providers
   */
  setLevel(level: LogLevel): void {
    this.defaultLevel = level;
    this.providers.forEach(provider => provider.setLevel(level));
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.providers.forEach(provider => {
      if (provider.isConfigured()) {
        provider.debug(message, context);
      }
    });
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.providers.forEach(provider => {
      if (provider.isConfigured()) {
        provider.info(message, context);
      }
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.providers.forEach(provider => {
      if (provider.isConfigured()) {
        provider.warn(message, context);
      }
    });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.providers.forEach(provider => {
      if (provider.isConfigured()) {
        provider.error(message, error, context);
      }
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export function logDebug(message: string, context?: LogContext): void {
  logger.debug(message, context);
}

export function logInfo(message: string, context?: LogContext): void {
  logger.info(message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  logger.warn(message, context);
}

export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  logger.error(message, error, context);
}

