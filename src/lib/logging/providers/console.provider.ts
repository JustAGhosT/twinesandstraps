/**
 * Console Logging Provider
 * Basic console output (development fallback)
 */

import { ILoggingProvider, LogLevel, LogContext } from '../provider.interface';

export class ConsoleLoggingProvider implements ILoggingProvider {
  readonly name = 'console';
  readonly displayName = 'Console';

  private level: LogLevel = LogLevel.INFO;

  isConfigured(): boolean {
    return true; // Always available
  }

  debug(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.level <= LogLevel.ERROR) {
      const errorInfo = error instanceof Error 
        ? { message: error.message, stack: error.stack, ...error }
        : error;
      console.error(`[ERROR] ${message}`, { error: errorInfo, ...context });
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

