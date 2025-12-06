# Application Insights Setup Guide

**Last Updated:** December 2025

---

## Overview

Application Insights is integrated for server-side monitoring, error tracking, and performance metrics.

---

## Configuration

### Environment Variables

The following environment variables are configured in Azure infrastructure:

- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Connection string for Application Insights
- `APPINSIGHTS_INSTRUMENTATIONKEY` - Instrumentation key (legacy, for compatibility)

These are automatically set during Azure deployment via Bicep templates.

---

## Usage

### Error Tracking

```typescript
import { logError, logWarning, logInfo } from '@/lib/monitoring/error-tracker';

try {
  // Your code
} catch (error) {
  logError(error, {
    userId: user.id,
    endpoint: '/api/products',
    context: 'product_fetch',
  });
}
```

### Custom Events

```typescript
import { trackEvent } from '@/lib/monitoring/app-insights';

trackEvent('OrderCompleted', {
  orderId: order.id,
  total: order.total,
  paymentMethod: order.payment_method,
});
```

### Performance Metrics

```typescript
import { trackPerformance } from '@/lib/monitoring/error-tracker';

const startTime = Date.now();
// ... your code ...
trackPerformance('DatabaseQuery', Date.now() - startTime, 'ms', {
  queryType: 'products',
});
```

### Dependency Tracking

```typescript
import { trackDependency } from '@/lib/monitoring/app-insights';

const startTime = Date.now();
const response = await fetch('https://api.example.com/data');
trackDependency(
  'External API',
  'GET /api/data',
  Date.now() - startTime,
  response.ok,
  'HTTP'
);
```

---

## Viewing Data

Access Application Insights in Azure Portal:

1. Go to your Resource Group
2. Open the Application Insights resource
3. View dashboards for:
   - Requests and failures
   - Response times
   - Exceptions
   - Dependencies
   - Custom events

---

## Note

The Application Insights SDK (`applicationinsights` package) should be installed for full functionality:

```bash
npm install applicationinsights
```

If not installed, monitoring will gracefully degrade with console logging only.

---

**Last Updated:** December 2025

