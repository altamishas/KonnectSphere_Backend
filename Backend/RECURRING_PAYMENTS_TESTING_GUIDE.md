# Comprehensive Recurring Payments Testing Guide

## Overview

This guide provides detailed instructions for testing the recurring payment functionality in KonnectSphere during development, including payment processing, email notifications, and invoice history tracking.

## Prerequisites

1. Stripe account in test mode
2. Stripe CLI installed (for webhook testing)
3. Test credit cards from Stripe
4. Email service configured (e.g., SMTP settings in .env)
5. MongoDB database running locally
6. Node.js backend running in development mode

## Test Environment Setup

1. **Configure Environment Variables**

   ```bash
   # .env file
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   FRONTEND_URL=http://localhost:3000
   ```

2. **Start Stripe Webhook Listener**
   ```bash
   stripe listen --forward-to localhost:5000/api/subscriptions/webhook
   ```

## Test Credit Cards

Use these Stripe test cards for different scenarios:

- **Success (Recurring)**: 4242 4242 4242 4242

  - Use this for successful recurring payments
  - Will automatically succeed on future payments

- **Authentication Required**: 4000 0025 0000 3155

  - Triggers 3D Secure authentication
  - Tests payment_action_required webhook

- **Payment Failure**: 4000 0000 0000 9995

  - Insufficient funds error
  - Tests retry logic and failure notifications

- **Immediate Decline**: 4000 0000 0000 0002
  - Payment declined
  - Tests decline handling and notifications

## Step-by-Step Testing Process

### 1. Initial Subscription Setup & Testing

1. **Create Test User & Subscribe**

   ```bash
   # 1. Start your frontend and backend servers
   cd frontend && npm start
   cd backend && npm run dev

   # 2. Create a new user account
   # 3. Navigate to pricing page
   # 4. Select Premium plan
   # 5. Use test card: 4242 4242 4242 4242
   ```

2. **Verify Initial Setup**

   ```javascript
   // In MongoDB Compass or shell
   db.userSubscriptions.findOne({ user: ObjectId("your_user_id") });
   db.paymentHistory.findOne({ user: ObjectId("your_user_id") });
   ```

   Check for:

   - [x] Subscription status is "active"
   - [x] Initial payment record exists
   - [x] Check your email for welcome/confirmation
   - [x] Verify invoice URL works

### 2. Test Recurring Payment Success

1. **Using Stripe CLI (recommended)**

   ```bash
   # Terminal 1: Start webhook forwarding
   stripe listen --forward-to localhost:5000/api/subscriptions/webhook

   # Terminal 2: Trigger a successful recurring payment event
   stripe trigger invoice.payment_succeeded
   ```

2. **Verify Success Flow**

   - [x] Check email for renewal receipt
   - [x] Verify in database:

   ```javascript
   // Check payment history
   db.paymentHistory
     .find({
       user: ObjectId("your_user_id"),
       paymentType: "recurring",
     })
     .sort({ createdAt: -1 });

   // Check subscription dates updated
   db.userSubscriptions.findOne({
     user: ObjectId("your_user_id"),
   });
   ```

### 3. Test Payment Authentication

1. **Update Payment Method**

   ```bash
   # 1. Go to billing settings in UI
   # 2. Add new card: 4000 0025 0000 3155
   # 3. Set as default
   ```

2. **Trigger Next Payment**

   ```bash
   # Advance test clock
   curl -X POST "http://localhost:5000/api/subscriptions/test-clock/advance" \
     -d '{"days": 30}'
   ```

3. **Verify Flow**
   - [x] Check for authentication email
   - [x] Verify subscription status is "requires_action"
   - [x] Complete 3D Secure in Stripe Dashboard
   - [x] Verify status returns to "active"

### 4. Test Payment Failure Handling

1. **Setup Failing Payment**

   ```bash
   # 1. Update card to: 4000 0000 0000 9995
   # 2. Trigger failure event
   stripe trigger invoice.payment_failed
   ```

2. **Monitor Retry Cycle**

   ```javascript
   // Check payment history for retries
   db.paymentHistory
     .find({
       user: ObjectId("your_user_id"),
       status: "failed",
     })
     .sort({ createdAt: -1 });
   ```

3. **Verify Notifications**
   - [x] Initial failure email received
   - [x] Retry schedule in payment history
   - [x] Past due notification after grace period

### 5. Test Subscription Cancellation

1. **Initiate Cancellation**

   ```javascript
   // Via API
   curl -X POST "http://localhost:5000/api/subscriptions/cancel" \
     -H "Content-Type: application/json" \
     -d '{
       "reason": "Testing cancellation",
       "feedback": "test",
       "immediate": false
     }'

   // Or use UI Cancel button
   ```

2. **Verify Cancellation Flow**

   ```javascript
   // Check subscription status
   db.userSubscriptions.findOne({
     user: ObjectId("your_user_id"),
   });
   ```

   Verify:

   - [x] Status shows "active" but `cancelAtPeriodEnd: true`
   - [x] Cancellation email received
   - [x] UI shows "Cancels at period end" message
   - [x] Access continues until period end

3. **Test Access After Cancellation**
   ```bash
   # Trigger upcoming invoice event near period end
   stripe trigger invoice.upcoming
   ```
   - [x] Verify features still accessible
   - [x] Check for "subscription ending soon" email

### 6. Test Expiration Process

1. **Setup Expiration Test**

   ```bash
   # Simulate end-of-period events via Stripe CLI if needed
   stripe trigger customer.subscription.updated
   ```

2. **Run Expiration Check**

   ```bash
   # Trigger expiration check manually
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/expired-subscriptions"
   ```

3. **Verify Expiration Flow**

   ```javascript
   // Check subscription status
   db.userSubscriptions.findOne({
     user: ObjectId("your_user_id"),
   });

   // Check user plan downgraded
   db.users.findOne({
     _id: ObjectId("your_user_id"),
   });
   ```

   Verify:

   - [x] Subscription status is "cancelled"
   - [x] User plan reverted to "Basic"
   - [x] Expiration email received
   - [x] Premium features no longer accessible

### 7. Test Email Notifications

1. **Setup Email Testing**

   ```bash
   # 1. Ensure SMTP settings in .env are correct
   # 2. Use a real email address for testing
   ```

2. **Trigger Various Email Scenarios**

   ```bash
   # Test 2-day reminder
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/two-day-reminder"

   # Test upcoming payment
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/upcoming-payment"
   ```

3. **Verify Email Content**
   Check received emails for:
   - [x] Correct subscription details
   - [x] Valid payment/invoice amounts
   - [x] Working action buttons/links
   - [x] Proper formatting
   - [x] No missing variables

### 8. Test Invoice History

1. **Generate Test Invoices**

   ```bash
   # Create multiple payment scenarios via CLI
   # 1. Successful recurring payment
   stripe trigger invoice.payment_succeeded

   # 2. Failed payment
   stripe trigger invoice.payment_failed

   # 3. Retry payment
   stripe trigger invoice.payment_succeeded
   ```

2. **Check Invoice Records**

   ```javascript
   // View all payment history
   db.paymentHistory
     .find({
       user: ObjectId("your_user_id"),
     })
     .sort({ createdAt: -1 });

   // Check specific payment types
   db.paymentHistory.find({
     user: ObjectId("your_user_id"),
     paymentType: { $in: ["initial", "recurring", "retry"] },
   });
   ```

3. **Verify Invoice Details**

   - [x] Initial payment record exists
   - [x] Recurring payments tracked
   - [x] Failed payments logged
   - [x] Retry attempts recorded
   - [x] Invoice URLs accessible
   - [x] Correct amounts and dates
   - [x] Payment status accurate

4. **Test Invoice Retrieval API**

   ```bash
   # Get payment history
   curl "http://localhost:5000/api/subscriptions/payments?limit=10"

   # Get current invoice
   curl "http://localhost:5000/api/subscriptions/current-invoice"
   ```

### 9. Webhook Testing & Monitoring

1. **Setup Webhook Listener**

   ```bash
   # Install Stripe CLI if not done
   brew install stripe/stripe-cli/stripe

   # Login to Stripe
   stripe login

   # Start webhook forwarding
   stripe listen --forward-to localhost:5000/api/subscriptions/webhook
   ```

2. **Test Specific Webhooks**

```bash
   # Test successful payment
stripe trigger invoice.payment_succeeded

   # Test failed payment
stripe trigger invoice.payment_failed

   # Test subscription updates
stripe trigger customer.subscription.updated

   # Test 3D Secure requirement
   stripe trigger invoice.payment_action_required
```

3. **Monitor Webhook Processing**
   - [x] Check server logs for webhook receipt
   - [x] Verify database updates
   - [x] Confirm email triggers
   - [x] Check payment history updates

### 10. Test Cron Jobs & Automated Tasks

1. **Setup Development Testing Route**

```javascript
// Add to subscriptionRouter.ts if not exists
router.post("/test-cron/:jobName", async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "Only available in development" });
    }

    const { jobName } = req.params;
    await cronJobManager.runJobManually(jobName);
    res.json({ message: `Job ${jobName} executed successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Test Each Cron Job**

   ```bash
   # Test 2-day expiration reminders
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/two-day-reminder"

   # Test expired subscriptions check
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/expired-subscriptions"

   # Test Stripe sync
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/stripe-sync"

   # Test payment history cleanup
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/cleanup-payment-history"

   # Test failed payment retry check
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/failed-payment-retry-check"

   # Test past due monitor
   curl -X POST "http://localhost:5000/api/subscriptions/test-cron/past-due-monitor"
   ```

3. **Verify Job Execution**

```javascript
   // Check job status
   curl "http://localhost:5000/api/subscriptions/cron-status"

   // Check job logs
   db.cronJobLogs.find().sort({ createdAt: -1 }).limit(10)
```

4. **Monitor Job Results**
   For each job, verify:
   - [x] Job executes without errors
   - [x] Database updates correctly
   - [x] Emails sent if required
   - [x] Logs show execution details
   - [x] Proper error handling

### 11. Troubleshooting Guide

#### Email Issues

1. **Emails Not Sending**

   ```bash
   # 1. Check SMTP settings
   echo "Testing email..." | mail -s "Test" your@email.com

   # 2. Verify email service
   curl -X POST "http://localhost:5000/api/subscriptions/test-email"
   ```

   **Common Solutions**:

   - Update SMTP credentials in .env
   - Check spam folder
   - Verify email templates
   - Enable "less secure app access" for Gmail

2. **Missing Email Content**
   ```javascript
   // Check email template data
   console.log("Email data:", {
     planName,
     amount,
     nextBillingDate,
     invoiceUrl,
   });
   ```

#### Webhook Issues

1. **Webhooks Not Received**

   ```bash
   # 1. Check webhook is running
   ps aux | grep stripe

   # 2. Test webhook endpoint
   curl -X POST "http://localhost:5000/api/subscriptions/webhook" \
     -H "Content-Type: application/json" \
     -d '{"type":"test"}'
   ```

   **Common Solutions**:

   - Restart Stripe CLI
   - Update webhook secret
   - Check endpoint URL
   - Verify firewall settings

2. **Invalid Webhook Signatures**
   ```javascript
   // Add debug logging
   console.log("Webhook headers:", req.headers);
   console.log("Webhook body:", req.body);
   ```

#### Database Issues

1. **Subscription Not Updating**

   ```javascript
   // Check subscription data
   db.userSubscriptions.findOne({
     user: ObjectId("your_user_id")
   })

   // Check Stripe sync status
   curl "http://localhost:5000/api/subscriptions/status"
   ```

   **Common Solutions**:

   - Force sync with Stripe

- Check Stripe API keys
  - Verify database indexes
  - Check connection string

2. **Payment History Issues**

   ```javascript
   // Check payment records
   db.paymentHistory
     .find({
       status: "failed",
     })
     .sort({ createdAt: -1 });

   // Check for orphaned records
   db.paymentHistory.find({
     userSubscription: null,
   });
   ```

#### Cron Job Issues

1. **Jobs Not Running**

   ```javascript
   // Check job registration
   console.log(cronJobManager.getRegisteredJobs());

   // Check last run times
   db.cronJobLogs.find().sort({ createdAt: -1 });
   ```

   **Common Solutions**:

   - Restart cron service

- Check timezone settings
  - Verify node-cron installation
  - Check server time sync

### 12. Production Deployment Checklist

1. **Stripe Configuration**

   - [ ] Switch to live Stripe API keys
   - [ ] Update webhook endpoints to production URLs
   - [ ] Configure production webhook signing secret
   - [ ] Test live mode webhooks
   - [ ] Set up Stripe Dashboard alerts

2. **Email Configuration**

   - [ ] Configure production SMTP service
   - [ ] Test all email templates in production
   - [ ] Set up email delivery monitoring
   - [ ] Configure bounce handling
   - [ ] Set up email analytics

3. **Database & Backups**

   - [ ] Set up database backups
   - [ ] Configure database monitoring
   - [ ] Set up data retention policies
   - [ ] Create database indexes
   - [ ] Configure connection pooling

4. **Monitoring & Logging**

   - [ ] Set up error tracking (e.g., Sentry)
   - [ ] Configure application logging
   - [ ] Set up performance monitoring
   - [ ] Create monitoring dashboards
   - [ ] Configure alerting thresholds

5. **Security**

   - [ ] Enable SSL/TLS
   - [ ] Configure firewalls
   - [ ] Set up rate limiting
   - [ ] Implement audit logging
   - [ ] Review security headers

6. **Cron Jobs**
   - [ ] Configure production cron schedule
   - [ ] Set up job monitoring
   - [ ] Configure failure alerts
   - [ ] Set up job logs retention
   - [ ] Test all automated tasks

### 13. Monitoring Guide

1. **Real-time Monitoring**

   ```javascript
   // Add monitoring endpoints
   router.get("/health", async (req, res) => {
     try {
       // Check critical services
       const health = await checkServicesHealth();
       res.json(health);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. **Key Metrics to Monitor**

   - Subscription success rate
   - Payment failure rate
   - Email delivery rate
   - Webhook processing time
   - Database query performance
   - API response times

3. **Alert Thresholds**

   ```javascript
   // Example alert thresholds
   const ALERT_THRESHOLDS = {
     paymentFailureRate: 0.05, // 5%
     webhookProcessingTime: 5000, // 5 seconds
     emailDeliveryRate: 0.98, // 98%
     apiResponseTime: 1000, // 1 second
   };
   ```

4. **Logging Strategy**
   ```javascript
   // Implement structured logging
   const logger = {
     payment: (data) => {
       console.log(
         JSON.stringify({
           timestamp: new Date(),
           type: "payment",
           ...data,
         })
       );
     },
     webhook: (data) => {
       console.log(
         JSON.stringify({
           timestamp: new Date(),
           type: "webhook",
           ...data,
         })
       );
     },
     // Add other log types
   };
   ```

### 14. Support & Maintenance

1. **Support Contacts**

   - Technical Support: tech@konnectsphere.network
   - Billing Support: billing@konnectsphere.network
   - Emergency Contact: emergency@konnectsphere.network

2. **Debugging Tools**

   ```javascript
   // Add debugging endpoints (development only)
   if (process.env.NODE_ENV === "development") {
     router.get("/debug/subscription/:userId", async (req, res) => {
       const debug = await getSubscriptionDebugInfo(req.params.userId);
       res.json(debug);
     });
   }
   ```

3. **Maintenance Procedures**
   - Daily: Monitor error logs
   - Weekly: Review payment metrics
   - Monthly: Audit subscription statuses
   - Quarterly: Review and update testing guide
