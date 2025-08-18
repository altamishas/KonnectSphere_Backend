# Recurring Payments Debug Guide

## Issue: Test Clock Not Triggering Recurring Payments

### Root Cause Analysis

The test clock you created is not automatically connected to existing subscriptions. Stripe test clocks only affect subscriptions created **after** the test clock is created and when the customer is explicitly linked to that test clock.

## Step-by-Step Debugging Process

### 1. Check Current Subscription Status

First, let's check your current subscription setup:

```javascript
// In MongoDB shell or Compass
db.userSubscriptions.findOne({ user: ObjectId("your_user_id") });
```

Look for:

- `stripeId` (subscription ID)
- `stripeCustomerId` (customer ID)
- `currentPeriodEnd` (when it should renew)
- `status` (should be "active")

### 2. Check Stripe Dashboard

Go to your Stripe Dashboard (test mode) and:

1. **Check Customer**: Look up your customer by email
2. **Check Subscription**: Verify the subscription exists and is active
3. **Check Test Clock**: Verify your test clock exists
4. **Important**: Check if the customer is linked to the test clock

### 3. Verify Webhook Listener

Make sure your Stripe CLI webhook listener is running:

```bash
# Check if webhook listener is running
ps aux | grep stripe

# If not running, start it
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```

### 4. Check Server Logs

Monitor your server logs when advancing the test clock:

```bash
# In your backend terminal, watch for:
# - Webhook received logs
# - Payment processing logs
# - Email sending logs
```

## Solution: Proper Test Clock Integration

### Method 1: Link Existing Subscription to Test Clock (RECOMMENDED)

I've added new endpoints to fix this issue:

```bash
# 1. Debug your current subscription status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/subscriptions/debug/test-clock"

# 2. Use Stripe CLI to trigger events instead of test clocks
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
stripe trigger invoice.payment_succeeded
```

### Method 2: Use Stripe CLI Triggers (ALTERNATIVE)

If test clocks still don't work, use direct webhook triggers:

```bash
# Make sure your webhook listener is running
stripe listen --forward-to localhost:5000/api/subscriptions/webhook

# In another terminal, trigger specific events
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
```

### Method 3: Manual Webhook Testing

Send webhook events directly to your endpoint:

```bash
# Test webhook endpoint directly
curl -X POST "http://localhost:5000/api/subscriptions/webhook" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type": "test", "data": {"object": {}}}'
```

## Step-by-Step Debugging Process

### Step 1: Debug Current State

```bash
# Check your subscription debug info
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:5000/api/subscriptions/debug/test-clock"
```

This will show you:

- Local subscription details
- Stripe subscription details
- Whether customer is linked to test clock
- Recent payment history

### Step 2: Check Webhook Listener

```bash
# Ensure webhook listener is running
ps aux | grep stripe

# Check webhook endpoint is accessible
curl -X POST "http://localhost:5000/api/subscriptions/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type": "ping"}'
```

### Step 3: Check Email Configuration

```bash
# Test email service directly (add this endpoint for testing)
curl -X POST "http://localhost:5000/api/subscriptions/test-email" \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com"}'
```

### Step 4: Monitor Server Logs

Watch your server console for:

- Webhook received messages
- Payment processing logs
- Email sending attempts
- Database updates

## Common Issues & Solutions

### Issue 1: Customer Not Linked to Test Clock

**Symptom**: Test clock advances but no webhooks triggered

**Solution**:

```bash
stripe trigger customer.subscription.updated
```

### Issue 2: Webhooks Not Being Received

**Symptom**: No webhook logs in server console

**Solution**:

```bash
# Restart webhook listener
stripe listen --forward-to localhost:5000/api/subscriptions/webhook

# Check webhook endpoint
curl -X POST "http://localhost:5000/api/subscriptions/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

### Issue 3: Emails Not Sending

**Symptom**: No emails received

**Solution**:

- Check SMTP configuration in .env
- Verify email service is working
- Check spam folder
- Add console logs to email service

### Issue 4: Subscription Not Updating

**Symptom**: Database not reflecting changes

**Solution**:

- Check webhook processing logs
- Verify Stripe webhook signature
- Check database connection
- Force sync with Stripe

## Testing Commands Summary

```bash
# 1. Debug subscription
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:5000/api/subscriptions/debug/test-clock"

# 2. Link to test clock
curl -X POST "http://localhost:5000/api/subscriptions/test-clock/link" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"testClockId": "clock_1Rt8hkRuGdA337hI0jtqrAjS"}'

# 3. Advance test clock
stripe trigger invoice.payment_failed

# 4. Check payment history
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:5000/api/subscriptions/payments"

# 5. Alternative: Use CLI triggers
stripe trigger invoice.payment_succeeded
```
