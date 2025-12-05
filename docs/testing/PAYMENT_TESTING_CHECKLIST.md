# Payment Testing Checklist

**Status:** ⏳ Manual Testing Required  
**Priority:** 🔴 Critical  
**Estimated Time:** 8 hours

---

## 📋 Pre-Testing Setup

### Environment Configuration
- [ ] **Sandbox Environment**
  - [ ] PayFast sandbox credentials configured
  - [ ] Test merchant ID and key set in environment variables
  - [ ] ITN webhook URL configured in PayFast dashboard
  - [ ] Webhook signature verification enabled

- [ ] **Production Environment** (After sandbox testing)
  - [ ] PayFast production credentials configured
  - [ ] Production merchant ID and key set
  - [ ] ITN webhook URL configured
  - [ ] SSL certificate valid
  - [ ] Webhook endpoint accessible from PayFast servers

---

## 🧪 Test Scenarios

### 1. Credit/Debit Card Payments

#### Test Case 1.1: Successful Card Payment
- [ ] Add product(s) to cart
- [ ] Proceed to checkout
- [ ] Fill in shipping address
- [ ] Select "Credit/Debit Card" payment method
- [ ] Click "Proceed to Payment"
- [ ] Redirected to PayFast payment page
- [ ] Enter test card details:
  - Card Number: `4000000000000002` (Visa test card)
  - CVV: `123`
  - Expiry: Future date
- [ ] Complete payment
- [ ] **Expected:** Redirected to `/checkout/success`
- [ ] **Expected:** Order created in database with status `PAID`
- [ ] **Expected:** Order confirmation email sent
- [ ] **Expected:** ITN webhook received and processed
- [ ] **Expected:** Order visible in admin dashboard

#### Test Case 1.2: Declined Card Payment
- [ ] Use test card: `4000000000000069` (Declined card)
- [ ] Attempt payment
- [ ] **Expected:** Payment declined message shown
- [ ] **Expected:** Redirected to `/checkout/cancel` or back to checkout
- [ ] **Expected:** Order NOT created (or created with status `PENDING`)
- [ ] **Expected:** Cart items preserved

#### Test Case 1.3: Insufficient Funds
- [ ] Use test card: `4000000000009995` (Insufficient funds)
- [ ] Attempt payment
- [ ] **Expected:** Error message displayed
- [ ] **Expected:** User can retry with different payment method

---

### 2. EFT (Electronic Funds Transfer) Payments

#### Test Case 2.1: EFT Payment Initiation
- [ ] Add product(s) to cart
- [ ] Proceed to checkout
- [ ] Select "EFT" payment method
- [ ] Click "Proceed to Payment"
- [ ] **Expected:** Redirected to PayFast EFT page
- [ ] **Expected:** Banking details displayed
- [ ] **Expected:** Reference number shown
- [ ] **Expected:** Order created with status `PENDING`
- [ ] **Expected:** Order confirmation email sent with payment instructions

#### Test Case 2.2: EFT Payment Completion
- [ ] **Manual Step:** Complete EFT payment from bank account
- [ ] Wait for payment confirmation (may take 1-3 business days)
- [ ] **Expected:** ITN webhook received when payment clears
- [ ] **Expected:** Order status updated to `PAID`
- [ ] **Expected:** Confirmation email sent

---

### 3. Instant EFT Payments

#### Test Case 3.1: Successful Instant EFT
- [ ] Select "Instant EFT" payment method
- [ ] Click "Proceed to Payment"
- [ ] **Expected:** Redirected to Instant EFT provider (e.g., PayGate, Ozow)
- [ ] **Expected:** Bank selection screen shown
- [ ] Select test bank
- [ ] Complete authentication (test credentials)
- [ ] **Expected:** Payment processed immediately
- [ ] **Expected:** Redirected to `/checkout/success`
- [ ] **Expected:** Order created with status `PAID`
- [ ] **Expected:** ITN webhook received

#### Test Case 3.2: Failed Instant EFT
- [ ] Attempt Instant EFT payment
- [ ] Cancel or fail authentication
- [ ] **Expected:** Redirected back to checkout
- [ ] **Expected:** Error message displayed
- [ ] **Expected:** Order status remains `PENDING` or cancelled

---

### 4. PayFast Wallet Payments

#### Test Case 4.1: PayFast Wallet Payment
- [ ] Select "PayFast Wallet" payment method
- [ ] Click "Proceed to Payment"
- [ ] **Expected:** Redirected to PayFast login
- [ ] Login with test PayFast account
- [ ] Complete payment from wallet balance
- [ ] **Expected:** Payment processed
- [ ] **Expected:** Redirected to success page
- [ ] **Expected:** Order created with status `PAID`

---

### 5. Payment Cancellation

#### Test Case 5.1: User Cancels Payment
- [ ] Proceed to PayFast payment page
- [ ] Click "Cancel" or close browser
- [ ] **Expected:** Redirected to `/checkout/cancel`
- [ ] **Expected:** Order created with status `CANCELLED` or `PENDING`
- [ ] **Expected:** Cart items preserved
- [ ] **Expected:** User can retry checkout

---

### 6. Webhook Testing (ITN)

#### Test Case 6.1: Successful Payment Webhook
- [ ] Complete a test payment
- [ ] **Check PayFast Dashboard:** Verify ITN sent
- [ ] **Check Application Logs:** Verify webhook received
- [ ] **Check Database:** Verify order status updated
- [ ] **Expected:** Webhook signature verified
- [ ] **Expected:** Order status updated correctly
- [ ] **Expected:** No duplicate processing

#### Test Case 6.2: Failed Payment Webhook
- [ ] Simulate failed payment
- [ ] **Check Logs:** Verify error handling
- [ ] **Expected:** Error logged but not exposed to user
- [ ] **Expected:** Retry mechanism works (if implemented)

#### Test Case 6.3: Duplicate Webhook Handling
- [ ] Complete a payment
- [ ] **Manual Step:** Resend ITN from PayFast dashboard
- [ ] **Expected:** Duplicate webhook ignored
- [ ] **Expected:** Order not processed twice
- [ ] **Expected:** Idempotency check works

#### Test Case 6.4: Invalid Webhook Signature
- [ ] **Manual Step:** Send webhook with invalid signature
- [ ] **Expected:** Webhook rejected
- [ ] **Expected:** Error logged
- [ ] **Expected:** Order status unchanged

---

### 7. Error Handling

#### Test Case 7.1: Network Timeout
- [ ] Simulate network timeout during payment
- [ ] **Expected:** User sees appropriate error message
- [ ] **Expected:** Can retry payment

#### Test Case 7.2: Invalid Payment Data
- [ ] Attempt payment with invalid data
- [ ] **Expected:** Validation errors shown
- [ ] **Expected:** Payment not processed

#### Test Case 7.3: Webhook Timeout
- [ ] **Manual Step:** Delay webhook response
- [ ] **Expected:** Webhook retried by PayFast
- [ ] **Expected:** Order eventually updated

---

### 8. Edge Cases

#### Test Case 8.1: Multiple Items in Cart
- [ ] Add 5+ different products to cart
- [ ] Complete payment
- [ ] **Expected:** All items included in order
- [ ] **Expected:** Correct totals calculated
- [ ] **Expected:** Order confirmation shows all items

#### Test Case 8.2: Large Order Amount
- [ ] Add products totaling R50,000+
- [ ] Complete payment
- [ ] **Expected:** Payment processed successfully
- [ ] **Expected:** No amount limits exceeded

#### Test Case 8.3: Zero VAT Items
- [ ] Add zero-rated products (if applicable)
- [ ] Complete payment
- [ ] **Expected:** VAT calculated correctly (0%)
- [ ] **Expected:** Order totals correct

#### Test Case 8.4: Concurrent Payments
- [ ] Open checkout in multiple tabs
- [ ] Complete payment in one tab
- [ ] Attempt payment in another tab
- [ ] **Expected:** Second payment handled correctly
- [ ] **Expected:** No duplicate orders

---

### 9. Security Testing

#### Test Case 9.1: SQL Injection in Payment Data
- [ ] Attempt to inject SQL in payment fields
- [ ] **Expected:** Input sanitized
- [ ] **Expected:** No database errors

#### Test Case 9.2: XSS in Payment Data
- [ ] Attempt XSS in customer name/email
- [ ] **Expected:** Input sanitized
- [ ] **Expected:** No script execution

#### Test Case 9.3: Rate Limiting
- [ ] Send multiple webhook requests rapidly
- [ ] **Expected:** Rate limiting applied
- [ ] **Expected:** HTTP 429 responses for excessive requests

#### Test Case 9.4: Webhook Signature Verification
- [ ] Attempt payment with modified webhook
- [ ] **Expected:** Invalid signature rejected
- [ ] **Expected:** Payment not processed

---

### 10. Email Notifications

#### Test Case 10.1: Order Confirmation Email
- [ ] Complete successful payment
- [ ] **Check Email:** Verify order confirmation sent
- [ ] **Expected:** Email contains:
  - Order number
  - Order items
  - Total amount
  - Shipping address
  - Payment method
  - Tracking information (if available)

#### Test Case 10.2: Payment Failure Email
- [ ] Complete failed payment
- [ ] **Check Email:** Verify appropriate email sent (if implemented)
- [ ] **Expected:** User notified of failure

---

## 📊 Test Results Template

### Test Session: [Date]

| Test Case | Status | Notes | Screenshots |
|-----------|--------|-------|-------------|
| 1.1 Successful Card | ⬜ Pass / ⬜ Fail | | |
| 1.2 Declined Card | ⬜ Pass / ⬜ Fail | | |
| 2.1 EFT Initiation | ⬜ Pass / ⬜ Fail | | |
| 3.1 Instant EFT | ⬜ Pass / ⬜ Fail | | |
| 6.1 Webhook Success | ⬜ Pass / ⬜ Fail | | |
| ... | ... | ... | ... |

**Overall Result:** ⬜ All Pass / ⬜ Issues Found

**Issues Found:**
1. [Issue description]
2. [Issue description]

---

## 🔧 Troubleshooting Guide

### Issue: Payment redirects to wrong URL
- **Check:** `PAYFAST_RETURN_URL` environment variable
- **Check:** PayFast merchant settings
- **Solution:** Update return URLs in PayFast dashboard

### Issue: Webhook not received
- **Check:** Webhook URL accessible from internet
- **Check:** PayFast dashboard webhook configuration
- **Check:** Application logs for incoming requests
- **Solution:** Verify webhook URL is publicly accessible

### Issue: Webhook signature verification fails
- **Check:** `PAYFAST_PASSPHRASE` matches PayFast dashboard
- **Check:** Signature generation logic
- **Solution:** Verify passphrase and signature algorithm

### Issue: Order not created after payment
- **Check:** Database connection
- **Check:** Application logs for errors
- **Check:** ITN webhook processing
- **Solution:** Review webhook handler code

---

## ✅ Sign-Off

**Tested By:** _________________  
**Date:** _________________  
**Environment:** ⬜ Sandbox / ⬜ Production  
**Status:** ⬜ Approved / ⬜ Issues Found

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 📝 Post-Testing Actions

- [ ] Document any issues found
- [ ] Create bug tickets for failures
- [ ] Update payment flow documentation
- [ ] Share results with team
- [ ] Schedule production testing (if sandbox passed)

---

*This checklist should be completed before going live with payment processing.*

