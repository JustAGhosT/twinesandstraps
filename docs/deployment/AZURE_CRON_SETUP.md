# Azure Functions Cron Job Setup

## Low Stock Alert Cron Job

This document explains how to set up the daily low stock alert cron job using Azure Functions.

---

## Prerequisites

1. Azure Functions Core Tools installed
2. Azure subscription with Functions App created
3. Next.js application deployed to Azure App Service

---

## Setup Steps

### 1. Environment Variables

Add the following environment variables to your Azure Function App:

```bash
CRON_SECRET=your-secure-random-secret-here
API_URL=https://your-app-service.azurewebsites.net
# OR use NEXT_PUBLIC_SITE_URL if already set
```

**To set in Azure Portal:**
1. Go to your Function App
2. Navigate to **Configuration** → **Application settings**
3. Add new application setting:
   - Name: `CRON_SECRET`
   - Value: Generate a secure random string (e.g., `openssl rand -hex 32`)

### 2. Deploy Azure Function

#### Option A: Using Azure Functions Core Tools

```bash
# Install Azure Functions Core Tools (if not already installed)
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Navigate to the function directory
cd azure-functions/low-stock-alert

# Install dependencies
npm install

# Build the function
npm run build

# Deploy to Azure
func azure functionapp publish <your-function-app-name>
```

#### Option B: Using VS Code Azure Extension

1. Install the **Azure Functions** extension in VS Code
2. Open the `azure-functions` folder
3. Right-click on `low-stock-alert` → **Deploy to Function App**
4. Select your Function App

#### Option C: Using Azure CLI

```bash
# Create resource group (if needed)
az group create --name rg-twinesandstraps --location southafricanorth

# Create Function App (if needed)
az functionapp create \
  --resource-group rg-twinesandstraps \
  --consumption-plan-location southafricanorth \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name <your-function-app-name> \
  --storage-account <your-storage-account>

# Deploy function
cd azure-functions/low-stock-alert
func azure functionapp publish <your-function-app-name>
```

### 3. Verify Deployment

1. Go to Azure Portal → Your Function App
2. Navigate to **Functions** → `low-stock-alert`
3. Click **Test/Run** to manually trigger the function
4. Check **Monitor** tab for execution logs

---

## Schedule Configuration

The cron job is configured to run **daily at 9:00 AM UTC** in `function.json`:

```json
"schedule": "0 0 9 * * *"
```

### Customizing the Schedule

You can modify the schedule in `azure-functions/low-stock-alert/function.json`:

- **Every day at 9 AM UTC**: `"0 0 9 * * *"`
- **Every day at 8 AM SAST (6 AM UTC)**: `"0 6 * * *"`
- **Every Monday at 9 AM**: `"0 0 9 * * 1"`
- **Every 6 hours**: `"0 */6 * * *"`
- **Every hour**: `"0 0 * * * *"`

**Cron Format:** `{second} {minute} {hour} {day} {month} {day-of-week}`

---

## Alternative: Using Azure WebJobs (App Service)

If you prefer to use Azure WebJobs instead of Functions:

### 1. Create WebJob Script

Create `webjobs/low-stock-alert/run.sh`:

```bash
#!/bin/bash
curl -X GET "https://your-app-service.azurewebsites.net/api/cron/low-stock-alert" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 2. Create settings.job

```json
{
  "schedule": "0 0 9 * * *"
}
```

### 3. Deploy via Azure Portal

1. Go to App Service → **WebJobs**
2. Click **Add**
3. Upload the `webjobs` folder as a zip file
4. Set schedule type to **Scheduled**

---

## Testing

### Manual Test

```bash
# Test the API endpoint directly
curl -X GET "https://your-app-service.azurewebsites.net/api/cron/low-stock-alert" \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### Test Azure Function Locally

```bash
cd azure-functions/low-stock-alert
npm install
npm run build
func start
```

---

## Monitoring

### View Logs

1. **Azure Portal:**
   - Function App → **Functions** → `low-stock-alert` → **Monitor**

2. **Application Insights:**
   - Function App → **Application Insights** → **Logs**
   - Query: `traces | where message contains "Low stock alert"`

3. **Next.js Application Logs:**
   - Check your Next.js application logs for API endpoint calls

### Set Up Alerts

1. Go to Function App → **Alerts**
2. Create alert rule for:
   - Function execution failures
   - Function execution duration > threshold
   - No executions in 25 hours (should run daily)

---

## Troubleshooting

### Function Not Running

1. **Check Function App Status:**
   - Ensure Function App is running (not stopped)
   - Check **Diagnose and solve problems** in Azure Portal

2. **Check Schedule:**
   - Verify `function.json` schedule is correct
   - Check timezone (Azure Functions use UTC)

3. **Check Environment Variables:**
   - Verify `CRON_SECRET` is set
   - Verify `API_URL` points to correct endpoint

### API Call Failing

1. **Check API Endpoint:**
   - Verify `/api/cron/low-stock-alert` is accessible
   - Test manually with curl/Postman

2. **Check Authentication:**
   - Verify `CRON_SECRET` matches in both places
   - Check Authorization header format

3. **Check Application Logs:**
   - Review Next.js application logs for errors
   - Check if email service (Brevo) is configured

### Email Not Sending

1. **Check Brevo Configuration:**
   - Verify `BREVO_API_KEY` is set
   - Check Brevo dashboard for email logs

2. **Check Admin Email:**
   - Verify `ADMIN_EMAIL` or `BREVO_FROM_EMAIL` is set
   - Check email isn't going to spam

---

## Security Best Practices

1. **CRON_SECRET:**
   - Use a strong, random secret (minimum 32 characters)
   - Rotate periodically
   - Never commit to version control

2. **Network Security:**
   - Consider using Azure Private Endpoints
   - Restrict Function App to specific IPs if possible

3. **Monitoring:**
   - Set up alerts for unauthorized access attempts
   - Monitor for unusual execution patterns

---

## Cost Considerations

- **Azure Functions Consumption Plan:** First 1 million executions/month are free
- **Execution Time:** Function should complete in < 5 seconds
- **Storage:** Minimal (just logs)

---

*Last Updated: December 2024*

