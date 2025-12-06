/**
 * Azure Application Insights Integration
 * Provides monitoring, error tracking, and custom metrics
 */

let appInsights: any = null;
let initialized = false;

/**
 * Initialize Application Insights
 */
export function initializeAppInsights() {
  if (initialized) {
    return appInsights;
  }

  // Server-side only
  if (typeof window !== 'undefined') {
    return null;
  }

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  const instrumentationKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

  if (!connectionString && !instrumentationKey) {
    console.warn('Application Insights not configured. Monitoring disabled.');
    return null;
  }

  try {
    // Dynamic import to avoid bundling issues if SDK not installed
    const appInsightsPackage = require('applicationinsights');
    
    if (connectionString) {
      appInsightsPackage.setup(connectionString).start();
    } else if (instrumentationKey) {
      appInsightsPackage.setup(instrumentationKey).start();
    }

    appInsights = appInsightsPackage.defaultClient;
    initialized = true;

    // Set default properties
    appInsights?.context.tags[appInsightsPackage.defaultClient.context.keys.cloudRole] = 'twines-and-straps-api';
    appInsights?.context.tags[appInsightsPackage.defaultClient.context.keys.cloudRoleInstance] = process.env.NODE_ENV || 'development';

    console.log('Application Insights initialized');
    return appInsights;
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
    return null;
  }
}

/**
 * Get Application Insights client (initialize if needed)
 */
export function getAppInsights() {
  if (!initialized) {
    return initializeAppInsights();
  }
  return appInsights;
}

/**
 * Track custom event
 */
export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  try {
    const client = getAppInsights();
    if (client) {
      client.trackEvent({ name, properties });
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Track exception
 */
export function trackException(error: Error, properties?: Record<string, string | number | boolean>) {
  try {
    const client = getAppInsights();
    if (client) {
      client.trackException({ exception: error, properties });
    }
  } catch (err) {
    console.error('Failed to track exception:', err);
  }
}

/**
 * Track custom metric
 */
export function trackMetric(name: string, value: number, properties?: Record<string, string>) {
  try {
    const client = getAppInsights();
    if (client) {
      client.trackMetric({ name, value, properties });
    }
  } catch (error) {
    console.error('Failed to track metric:', error);
  }
}

/**
 * Track dependency (external API calls, database queries, etc.)
 */
export function trackDependency(
  name: string,
  commandName: string,
  elapsed: number,
  success: boolean,
  dependencyTypeName: string = 'HTTP',
  properties?: Record<string, string>
) {
  try {
    const client = getAppInsights();
    if (client) {
      client.trackDependency({
        name,
        data: commandName,
        duration: elapsed,
        success,
        dependencyTypeName,
        properties,
      });
    }
  } catch (error) {
    console.error('Failed to track dependency:', error);
  }
}

/**
 * Track trace (debug/info messages)
 */
export function trackTrace(message: string, severityLevel: number = 1, properties?: Record<string, string>) {
  try {
    const client = getAppInsights();
    if (client) {
      client.trackTrace({ message, severityLevel, properties });
    }
  } catch (error) {
    console.error('Failed to track trace:', error);
  }
}

/**
 * Start timing a request
 */
export function startRequest(name: string, url: string, properties?: Record<string, string>): string {
  try {
    const client = getAppInsights();
    if (client) {
      return client.startTrackRequest(name, url, properties);
    }
  } catch (error) {
    console.error('Failed to start request tracking:', error);
  }
  return '';
}

/**
 * End timing a request
 */
export function endRequest(
  name: string,
  url: string,
  statusCode: number,
  success: boolean,
  properties?: Record<string, string>
) {
  try {
    const client = getAppInsights();
    if (client) {
      client.stopTrackRequest(name, url, statusCode.toString(), success, properties);
    }
  } catch (error) {
    console.error('Failed to end request tracking:', error);
  }
}

/**
 * Check if Application Insights is configured
 */
export function isAppInsightsConfigured(): boolean {
  return !!(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
}

