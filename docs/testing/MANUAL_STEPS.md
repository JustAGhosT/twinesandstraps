# Manual Steps Required

**Last Updated:** December 2024

This document outlines all manual steps that need to be completed after the automated implementations.

---

## 🔴 CRITICAL: Payment Testing

**Priority:** Highest  
**Time Required:** 8 hours  
**Documentation:** `docs/testing/PAYMENT_TESTING_CHECKLIST.md`

### Steps:
1. **Review the checklist** in `docs/testing/PAYMENT_TESTING_CHECKLIST.md`
2. **Set up PayFast sandbox environment:**
   - Log into PayFast dashboard
   - Navigate to Settings → Integration
   - Configure sandbox credentials
   - Set ITN webhook URL: `https://yourdomain.com/api/webhooks/payfast`
   - Enable webhook signature verification

3. **Test all payment methods:**
   - Credit/Debit cards (success and failure scenarios)
   - EFT payments
   - Instant EFT
   - PayFast Wallet

4. **Test webhook handling:**
   - Verify ITN webhooks are received
   - Check order status updates
   - Test duplicate webhook handling
   - Verify signature validation

5. **Document results:**
   - Fill out test results template
   - Note any issues found
   - Create bug tickets if needed

---

## ⚙️ Configuration Steps

### 1. The Courier Guy Webhook Configuration

**Endpoint:** `/api/webhooks/shipping`

**Steps:**
1. Log into The Courier Guy dashboard
2. Navigate to Settings → Webhooks
3. Add new webhook:
   - **URL:** `https://yourdomain.com/api/webhooks/shipping`
   - **Method:** POST
   - **Events to subscribe:**
     - `PICKED_UP`
     - `IN_TRANSIT`
     - `OUT_FOR_DELIVERY`
     - `DELIVERED`
     - `FAILED`
     - `RETURNED`
4. Save webhook configuration
5. Test webhook with sample payload

**Webhook Payload Format:**
```json
{
  "waybill_number": "TCG123456",
  "status": "DELIVERED",
  "reference": "ORD-12345",
  "description": "Package delivered",
  "location": "Cape Town",
  "timestamp": "2024-12-06T10:30:00Z"
}
```

---

### 2. Environment Variables Check

Verify these are set in your production environment:

```bash
# Database
DATABASE_URL=postgresql://...

# Payment
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
PAYFAST_SANDBOX=false  # Set to false for production

# Shipping
COURIER_GUY_API_KEY=...
COURIER_GUY_API_URL=https://api.thecourierguy.co.za

# Email
BREVO_API_KEY=...

# Site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 🧪 Testing Steps

### Quote Request Flow

1. **Test with products in cart:**
   - Add products to cart
   - Go to `/quote` page
   - Fill in form
   - Submit quote request
   - Verify redirect to `/quote/confirmation`
   - Check quote appears in admin dashboard (`/admin/quotes`)
   - Verify confirmation email received

2. **Test without products:**
   - Go to `/quote` page (empty cart)
   - Fill in form
   - Submit quote request
   - Verify quote created successfully

3. **Test form validation:**
   - Try submitting with missing required fields
   - Verify validation errors shown
   - Test email format validation

---

### Shipping Webhook Testing

1. **Test webhook endpoint:**
   ```bash
   curl -X POST https://yourdomain.com/api/webhooks/shipping \
     -H "Content-Type: application/json" \
     -H "X-Provider: TCG" \
     -d '{
       "waybill_number": "TEST123",
       "status": "DELIVERED",
       "reference": "ORD-12345",
       "description": "Test delivery",
       "timestamp": "2024-12-06T10:30:00Z"
     }'
   ```

2. **Verify:**
   - Order status updated correctly
   - Order status history entry created
   - Email notification sent (if order exists)
   - Rate limiting works (send multiple rapid requests)

---

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)

**Manual Steps:**
1. Create Sentry account (if not already done)
2. Get DSN from Sentry dashboard
3. Add to environment variables: `NEXT_PUBLIC_SENTRY_DSN`
4. Install Sentry SDK (if not already installed)
5. Configure error boundaries

### 2. Application Insights (Azure)

**Manual Steps:**
1. Create Application Insights resource in Azure
2. Get instrumentation key
3. Add to environment variables: `APPLICATIONINSIGHTS_CONNECTION_STRING`
4. Configure in application

### 3. Log Aggregation

**Manual Steps:**
1. Set up log aggregation service (e.g., Logtail, Datadog)
2. Configure log shipping from Azure App Service
3. Set up alerts for critical errors

---

## 🔒 Security Checklist

- [ ] SSL certificate valid and configured
- [ ] Environment variables secured (not in code)
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured and tested
- [ ] CSRF protection enabled (if applicable)
- [ ] Database credentials rotated regularly
- [ ] API keys rotated regularly
- [ ] Access logs reviewed regularly

---

## 📝 Documentation Updates

After completing manual steps, update:

- [ ] `docs/testing/IMPLEMENTATION_STATUS.md` - Mark completed items
- [ ] `docs/planning/phased-improvement-plan.md` - Update task status
- [ ] `README.md` - Update setup instructions if needed

---

## ✅ Sign-Off Checklist

Before considering implementation complete:

- [ ] Payment testing completed and documented
- [ ] All webhooks configured and tested
- [ ] Environment variables verified
- [ ] Error monitoring set up
- [ ] Security checklist completed
- [ ] Documentation updated

---

*This document should be reviewed and updated as manual steps are completed.*

