/**
 * Application Insights Logging Provider
 * Integrates with Azure Application Insights
 */

import { ILoggingProvider, LogLevel, LogContext } from '../provider.interface';
import { getAppInsights, trackTrace, trackException, trackEvent } from '@/lib/monitoring/app-insights';

export class AppInsightsLoggingProvider implements ILoggingProvider {
  readonly name = 'app-insights';
  readonly displayName = 'Application Insights';

  private level: LogLevel = LogLevel.INFO;
  private appInsights: any = null;

  constructor() {
    // Initialize Application Insights
    this.appInsights = getAppInsights();
  }

  isConfigured(): boolean {
    return this.appInsights !== null;
  }

  debug(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.DEBUG && this.appInsights) {
      trackTrace(message, 0, this.contextToProperties(context)); // Verbose level
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.INFO && this.appInsights) {
      trackTrace(message, 1, this.contextToProperties(context)); // Information level
      if (context) {
        trackEvent('LogInfo', this.contextToProperties(context));
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.WARN && this.appInsights) {
      trackTrace(message, 2, this.contextToProperties(context)); // Warning level
      trackEvent('LogWarning', { message, ...this.contextToProperties(context) });
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.level <= LogLevel.ERROR && this.appInsights) {
      const errorObj = error instanceof Error ? error : new Error(message);
      trackException(errorObj, {
        message,
        ...this.contextToProperties(context),
      });
      trackEvent('LogError', {
        message,
        errorType: errorObj.constructor.name,
        ...this.contextToProperties(context),
      });
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private contextToProperties(context?: LogContext): Record<string, string> {
    if (!context) return {};
    
    const properties: Record<string, string> = {};
    for (const [key, value] of Object.entries(context)) {
      if (value !== null && value !== undefined) {
        properties[key] = String(value);
      }
    }
    return properties;
  }
}

