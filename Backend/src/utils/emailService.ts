import nodemailer from "nodemailer";
import { config } from "../config/config";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Receipt/Invoice data interface
interface ReceiptData {
  invoiceId: string;
  amount: number;
  currency: string;
  planName: string;
  billingPeriod: string;
  paymentDate: Date;
  nextBillingDate?: Date;
  invoiceUrl?: string;
}

// Due balance interface
interface DueBalanceData {
  amount: number;
  currency: string;
  dueDate: Date;
  planName: string;
  invoiceUrl?: string;
}

// Interface for populated user in subscription queries
interface PopulatedUser {
  _id: string;
  email: string;
  fullName: string;
}

// Interface for populated subscription in queries
interface PopulatedSubscription {
  name: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE === "true",
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send email using nodemailer
   * @param options Email options (to, subject, html)
   * @returns Promise with send mail info
   */
  async sendEmail(options: EmailOptions): Promise<nodemailer.SentMessageInfo> {
    const mailOptions = {
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendEmailVerificationOTP(
    to: string,
    otp: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getEmailVerificationOTPTemplate(otp, userName);

    return this.sendEmail({
      to,
      subject: "Verify Your Email Address",
      html,
    });
  }

  /**
   * Get email verification OTP template
   * @param otp Verification OTP code
   * @param userName User's full name
   * @returns HTML email template
   */
  private getEmailVerificationOTPTemplate(
    otp: string,
    userName: string
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email Address</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Email Verification</h2>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>Thank you for registering with us. To complete your registration, please use the following verification code:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>Enter this code on the verification page to activate your account.</p>
          
          <div class="note">
            <strong>Note:</strong> This verification code is valid for 10 minutes. After that, you'll need to request a new code.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send password reset email with token link
   * @param to User email address
   * @param resetToken Reset token
   * @param userName User's full name
   * @returns Promise with send mail info
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const resetUrl = `${config.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = this.getPasswordResetTemplate(resetUrl, userName);

    return this.sendEmail({
      to,
      subject: "Password Reset Request",
      html,
    });
  }

  private getPasswordResetTemplate(resetUrl: string, userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset</h2>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. To proceed with the password reset, please click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>
          
          <div class="note">
            <strong>Note:</strong> This password reset link is valid for 1 hour. After that, you'll need to request a new link.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendPasswordResetSuccessEmail(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getPasswordResetSuccessTemplate(userName);

    return this.sendEmail({
      to,
      subject: "Password Reset Successful",
      html,
    });
  }

  private getPasswordResetSuccessTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Updated Successfully</h2>
        </div>
        <div class="content">
          <div class="success-icon">✓</div>
          <h3>Hello ${userName},</h3>
          <p>Your password has been successfully reset.</p>
          <p>You can now log in to your account using your new password.</p>
          
          <div class="alert">
            <p><strong>Security Notice:</strong></p>
            <p>If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Subscription Related Emails
  async sendSubscriptionConfirmation(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getSubscriptionConfirmationTemplate(userName);
    return this.sendEmail({
      to,
      subject: "Your Subscription is Now Active",
      html,
    });
  }

  private getSubscriptionConfirmationTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmation</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Subscription Confirmation</h2>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We've activated your subscription — thank you for trusting KonnectSphere. You now have full access to connect, explore, and grow.</p>
          <p>Need help at any point? Write to us at contact@konnectsphere.net</p>
        </div>
        <div class="footer">
          <p>The KonnectSphere Team</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendEntrepreneurBasicPlanConfirmation(
    to: string,
    userName: string,
    receipt?: ReceiptData
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getEntrepreneurBasicPlanTemplate(userName, receipt);
    return this.sendEmail({
      to,
      subject: "Your KonnectSphere Basic Plan is Active",
      html,
    });
  }

  private getEntrepreneurBasicPlanTemplate(
    userName: string,
    receipt?: ReceiptData
  ): string {
    const receiptSection = receipt ? this.getReceiptSection(receipt) : "";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Basic Plan Confirmation</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to KonnectSphere! 🚀</h2>
        </div>
        <div class="content">
          <p>Dear <span class="highlight">${userName}</span>,</p>
          <p>We're thrilled to have you onboard with the <span class="highlight">Entrepreneur Basic Plan</span>!</p>
          
          <div class="price">USD $49/month</div>
          
          <p>Your profile and pitch are now part of a growing global network connecting investors with bold, emerging founders like you.</p>
          
          <p>Your pitch is live and ready to be discovered. Keep it sharp, clear, and inspiring — this is your stage.</p>
          
          ${receiptSection}
          
          <div class="note">
            <p><strong>✨ What's Next?</strong></p>
            <ul>
              <li>Complete your profile</li>
              <li>Polish your pitch</li>
              <li>Connect with investors</li>
              <li>Track your progress</li>
            </ul>
          </div>

          <p>For updates or to upgrade anytime, simply visit your dashboard.</p>
          
          <div class="contact-info">
            <p>Need assistance? We're here to help!</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          </div>
          
          <p>Thanks for trusting us. Let's shape the future together.</p>
          <br>
          <p>Warm regards,<br>KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendEntrepreneurPremiumPlanConfirmation(
    to: string,
    userName: string,
    receipt?: ReceiptData
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getEntrepreneurPremiumPlanTemplate(userName, receipt);
    return this.sendEmail({
      to,
      subject: "Your KonnectSphere Premium Subscription Has Been Activated",
      html,
    });
  }

  private getEntrepreneurPremiumPlanTemplate(
    userName: string,
    receipt?: ReceiptData
  ): string {
    const receiptSection = receipt ? this.getReceiptSection(receipt) : "";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Premium Plan Confirmation</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to KonnectSphere Premium! ⭐</h2>
        </div>
        <div class="content">
          <p>Dear <span class="highlight">${userName}</span>,</p>
          
          <div class="price">USD $69/month</div>
          
          <p>Welcome to the premium experience! You've just unlocked:</p>
          
          <div class="note">
            <p><strong>🌟 Premium Benefits:</strong></p>
            <ul>
              <li>Enhanced visibility</li>
              <li>Priority investor matching</li>
              <li>Advanced engagement tools</li>
              <li>Premium analytics</li>
            </ul>
          </div>

          ${receiptSection}

          <p>Your pitch will be highlighted and prioritized across our platform to attract the right kind of attention.</p>
          
          <p>You're not just joining a network — you're building opportunity.</p>
          
          <div class="contact-info">
            <p>Questions about your premium features?</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          </div>
          
          <p>Wishing you success as you take the next big step.</p>
          <br>
          <p>Warm regards,<br>KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendInvestorAnnualPlanConfirmation(
    to: string,
    userName: string,
    receipt?: ReceiptData
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getInvestorAnnualPlanTemplate(userName, receipt);
    return this.sendEmail({
      to,
      subject: "Welcome to KonnectSphere – Investor Access Confirmed",
      html,
    });
  }

  private getInvestorAnnualPlanTemplate(
    userName: string,
    receipt?: ReceiptData
  ): string {
    const receiptSection = receipt ? this.getReceiptSection(receipt) : "";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Investor Plan Confirmation</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome, Investor! 💎</h2>
        </div>
        <div class="content">
          <p>Dear <span class="highlight">${userName}</span>,</p>
          
          <div class="price">USD $49/year</div>
          
          <p>Thank you for joining KonnectSphere as an investor. Your annual membership unlocks:</p>
          
          <div class="note">
            <p><strong>🎯 Investor Benefits:</strong></p>
            <ul>
              <li>Access to verified startups</li>
              <li>Direct entrepreneur communication</li>
              <li>Detailed pitch analytics</li>
              <li>Investment tracking tools</li>
            </ul>
          </div>

          ${receiptSection}

          <p>You can now browse pitches, contact promising startups, and connect directly with entrepreneurs shaping the future.</p>
          
          <div class="contact-info">
            <p>Need investment guidance?</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          </div>
          
          <p>We're thrilled to have you with us — let's find your next great deal.</p>
          <br>
          <p>Sincerely,<br>KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // NEW: Dedicated subscription cancellation email
  async sendSubscriptionCancellationConfirmation(
    to: string,
    userName: string,
    planName: string,
    cancelDate: Date,
    immediate: boolean = false
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getSubscriptionCancellationTemplate(
      userName,
      planName,
      cancelDate,
      immediate
    );
    return this.sendEmail({
      to,
      subject: immediate
        ? "Your Subscription Has Been Cancelled"
        : "Your Subscription Will End Soon",
      html,
    });
  }

  private getSubscriptionCancellationTemplate(
    userName: string,
    planName: string,
    cancelDate: Date,
    immediate: boolean
  ): string {
    const cancelDateStr = cancelDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Cancellation</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${
            immediate ? "Subscription Cancelled" : "Subscription Ending Soon"
          } 📋</h2>
        </div>
        <div class="content">
          <p>Hi <span class="highlight">${userName}</span>,</p>
          
          <div class="note">
            <p><strong>📋 Cancellation Details:</strong></p>
            <p>Your <span class="highlight">${planName}</span> subscription ${
      immediate ? "has been cancelled immediately" : "is scheduled to end on"
    }:</p>
            <p class="highlight-date">${cancelDateStr}</p>
          </div>

          ${
            immediate
              ? `
          <p>Your subscription access has ended immediately. You can still access basic features, but premium features are no longer available.</p>
          `
              : `
          <p>You'll continue to have full access to your subscription benefits until <span class="highlight">${cancelDateStr}</span>. After this date, your account will revert to basic access.</p>
          `
          }
          
          <div class="reactivation-info">
            <p><strong>💡 Changed Your Mind?</strong></p>
            <p>You can reactivate your subscription anytime before ${
              immediate ? "signing up again" : "the end date"
            } to continue enjoying all premium features.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${
                config.FRONTEND_URL
              }/pricing" class="button">Reactivate Subscription</a>
            </div>
          </div>
          
          <div class="contact-info">
            <p>Questions about your cancellation?</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          </div>
          
          <p>Thank you for being part of the KonnectSphere community. We hope to see you again soon!</p>
          <br>
          <p>Best regards,<br>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendSubscriptionRenewalReminder(
    to: string,
    userName: string,
    renewalDate: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getSubscriptionRenewalReminderTemplate(
      userName,
      renewalDate
    );
    return this.sendEmail({
      to,
      subject: "Your Subscription Will Renew Soon",
      html,
    });
  }

  private getSubscriptionRenewalReminderTemplate(
    userName: string,
    renewalDate: string
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Renewal Reminder</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Subscription Renewal Reminder ⏰</h2>
        </div>
        <div class="content">
          <p>Hi <span class="highlight">${userName}</span>,</p>
          
          <div class="note">
            <p><strong>📅 Important Date:</strong></p>
            <p>Your KonnectSphere subscription will renew on <span class="highlight">${renewalDate}</span></p>
          </div>

          <p>If everything looks good, no action is needed. Your subscription will automatically renew to ensure uninterrupted access.</p>
          
          <div class="contact-info">
            <p>Want to make changes to your subscription?</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          </div>
          
          <br>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // NEW: 2-day expiration reminder
  async sendTwoDayExpirationReminder(
    to: string,
    userName: string,
    planName: string,
    expirationDate: Date
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getTwoDayExpirationReminderTemplate(
      userName,
      planName,
      expirationDate
    );
    return this.sendEmail({
      to,
      subject: "⚠️ Your Subscription Expires in 2 Days",
      html,
    });
  }

  private getTwoDayExpirationReminderTemplate(
    userName: string,
    planName: string,
    expirationDate: Date
  ): string {
    const expirationDateStr = expirationDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Expiring Soon</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Your Subscription Expires Soon ⚠️</h2>
        </div>
        <div class="content">
          <p>Hi <span class="highlight">${userName}</span>,</p>
          
          <div class="urgent-notice">
            <p><strong>⏰ Urgent Notice:</strong></p>
            <p>Your <span class="highlight">${planName}</span> subscription will expire in just <span class="highlight">2 days</span>!</p>
            <p class="highlight-date">Expiration Date: ${expirationDateStr}</p>
        </div>

          <p>Don't lose access to your premium features! Renew now to continue enjoying:</p>
          
          <div class="benefits-list">
            <ul>
              <li>🌟 Full platform access</li>
              <li>🔗 Investor connections</li>
              <li>📊 Analytics and insights</li>
              <li>💼 Premium support</li>
              <li>🌍 Global visibility</li>
            </ul>
        </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              config.FRONTEND_URL
            }/pricing" class="button urgent-button">Renew Now</a>
      </div>
          
          <div class="note">
            <p><strong>What happens if I don't renew?</strong></p>
            <p>After ${expirationDateStr}, your account will be downgraded to basic access with limited features.</p>
          </div>
          
          <div class="contact-info">
            <p>Need help with renewal?</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
        </div>
          
          <br>
          <p>Don't miss out on valuable opportunities!</p>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Enhanced subscription expired notification with due balance
  async sendSubscriptionExpiredNotification(
    to: string,
    userName: string,
    planName?: string,
    dueBalance?: DueBalanceData
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getSubscriptionExpiredTemplate(
      userName,
      planName,
      dueBalance
    );
    return this.sendEmail({
      to,
      subject: dueBalance
        ? "Subscription Expired - Payment Due"
        : "Your Subscription Has Ended",
      html,
    });
  }

  private getSubscriptionExpiredTemplate(
    userName: string,
    planName?: string,
    dueBalance?: DueBalanceData
  ): string {
    const dueDateStr = dueBalance?.dueDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dueBalanceSection = dueBalance
      ? `
    <div class="due-balance-section">
      <h3>📋 Outstanding Invoice</h3>
      <div class="invoice-details">
        <div class="invoice-row">
          <span class="invoice-label">Plan:</span>
          <span class="invoice-value">${dueBalance.planName}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Amount Due:</span>
          <span class="invoice-value amount-due">${dueBalance.currency.toUpperCase()} $${dueBalance.amount.toFixed(
          2
        )}</span>
        </div>
        <div class="invoice-row">
          <span class="invoice-label">Due Date:</span>
          <span class="invoice-value due-date">${dueDateStr}</span>
        </div>
        ${
          dueBalance.invoiceUrl
            ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${dueBalance.invoiceUrl}" class="button">Download Invoice</a>
        </div>
        `
            : ""
        }
      </div>
    </div>
    `
      : "";

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Expired</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${
            dueBalance
              ? "Subscription Expired - Payment Required"
              : "Subscription Expired"
          } ⚠️</h2>
        </div>
        <div class="content">
          <p>Hi <span class="highlight">${userName}</span>,</p>
          
          <div class="note">
            <p><strong>Status Update:</strong></p>
            <p>Your ${
              planName || "subscription"
            } has ended, and your access is now limited.</p>
          </div>

          ${dueBalanceSection}

          <p>Don't miss out on valuable opportunities! Renew your subscription to:</p>
          <ul>
            <li>Restore full platform access</li>
            <li>Continue connecting with potential partners</li>
            <li>Keep your profile visible</li>
            <li>Access premium analytics</li>
            <li>Receive priority support</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              config.FRONTEND_URL
            }/pricing" class="button">Renew Subscription</a>
          </div>
          
          <div class="contact-info">
            <p>Need help with renewal or have payment questions?</p>
            <p>📩 <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          </div>
          
          <br>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Helper method to generate receipt section (Gmail-safe table layout + inline styles)
  private getReceiptSection(receipt: ReceiptData): string {
    const paymentDateStr = receipt.paymentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const nextBillingStr = receipt.nextBillingDate?.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    // Use tables with inline styles for high compatibility with Gmail
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:20px 0;background:#ffffff;border:1px solid #e9ecef;border-radius:8px;">
        <tr>
          <td style="padding:16px 16px 0 16px;">
            <div style="font-size:18px;font-weight:700;color:#b58228;margin-bottom:8px;">🧾 Payment Receipt</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 16px 16px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#fff;border:1px solid #f1f3f5;border-radius:6px;">
              ${this.renderReceiptRow("Invoice ID:", receipt.invoiceId)}
              ${this.renderReceiptRow("Plan:", receipt.planName)}
              ${this.renderReceiptRow("Billing Period:", receipt.billingPeriod)}
              ${this.renderReceiptRow(
                "Amount Paid:",
                `${receipt.currency.toUpperCase()} $${receipt.amount.toFixed(
                  2
                )}`,
                true
              )}
              ${this.renderReceiptRow("Payment Date:", paymentDateStr)}
              ${
                nextBillingStr
                  ? this.renderReceiptRow("Next Billing:", nextBillingStr)
                  : ""
              }
            </table>
            ${
              receipt.invoiceUrl
                ? `<div style="text-align:center;margin:20px 0;">
                     <a href="${receipt.invoiceUrl}" style="display:inline-block;padding:12px 24px;background:#b58228;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Download Invoice</a>
                   </div>`
                : ""
            }
          </td>
        </tr>
      </table>
    `;
  }

  // Render a single receipt row (Gmail-safe table row with inline styles)
  private renderReceiptRow(
    label: string,
    value: string,
    emphasize = false
  ): string {
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f3f5;width:45%;font-weight:600;color:#495057;vertical-align:top;">${label}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f3f5;width:55%;text-align:right;color:${
          emphasize ? "#b58228" : "#212529"
        };font-weight:${emphasize ? "700" : "400"};">${value}</td>
      </tr>
    `;
  }

  // Function to check for subscriptions expiring in 2 days and send reminders
  async checkAndSendTwoDayReminders(): Promise<void> {
    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(23, 59, 59, 999); // End of day

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 2);
      oneDayFromNow.setHours(0, 0, 0, 0); // Start of day

      // Import here to avoid circular dependency
      const { UserSubscription } = await import(
        "../subscription/subscriptionModel"
      );

      // Find subscriptions expiring in exactly 2 days
      const expiringSubscriptions = await UserSubscription.find({
        currentPeriodEnd: {
          $gte: oneDayFromNow,
          $lte: twoDaysFromNow,
        },
        active: true,
        status: { $in: ["active", "trialing"] },
        $or: [{ cancelAtPeriodEnd: true }, { cancelAtPeriodEnd: false }],
      }).populate("user subscription");

      console.log(
        `📧 Found ${expiringSubscriptions.length} subscriptions expiring in 2 days`
      );

      for (const userSub of expiringSubscriptions) {
        try {
          // Type assertion for populated objects
          const user = userSub.user as unknown as PopulatedUser;
          const subscription =
            userSub.subscription as unknown as PopulatedSubscription;
          const periodEnd = userSub.currentPeriodEnd;

          if (
            user &&
            user.email &&
            user.fullName &&
            subscription &&
            subscription.name &&
            periodEnd
          ) {
            await this.sendTwoDayExpirationReminder(
              user.email,
              user.fullName,
              subscription.name,
              periodEnd
            );
            console.log(`✅ 2-day reminder sent to ${user.email}`);
          }
        } catch (emailError) {
          console.error(
            `❌ Failed to send 2-day reminder to ${
              (userSub.user as unknown as PopulatedUser)?.email || "unknown"
            }:`,
            emailError
          );
        }
      }
    } catch (error) {
      console.error("❌ Error checking for 2-day expiration reminders:", error);
    }
  }

  async sendPitchHiddenNotification(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getPitchHiddenTemplate(userName);
    return this.sendEmail({
      to,
      subject: "Your Pitch is Currently Hidden and Your Access is Denied",
      html,
    });
  }

  private getPitchHiddenTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pitch Hidden Notice</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Pitch Hidden Notice</h2>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We've temporarily hidden your pitch due to a missed subscription payment and your access is denied.</p>
          <p>You can restore it anytime and bring it back online, simply renew your plan.</p>
          <p>Let us know how we can support you: contact@konnectsphere.net</p>
          <br>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Common email styles with GOLDEN COLOR SCHEME from globals.css
  private getCommonEmailStyles(): string {
    return `
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eaeaea;
        background: linear-gradient(135deg, hsl(40, 75%, 49%) 0%, hsl(38, 92%, 50%) 100%);
        color: white;
        border-radius: 8px 8px 0 0;
        margin: -20px -20px 20px -20px;
      }
      .header h2 {
        margin: 0;
        font-size: 24px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      .content {
        padding: 30px 20px;
        color: #444;
      }
      .content p {
        margin-bottom: 15px;
        font-size: 16px;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 12px;
        color: #999;
        border-top: 1px solid #eaeaea;
        padding-top: 20px;
        background: #f8f9fa;
        margin: 0 -20px -20px -20px;
        padding: 20px;
        border-radius: 0 0 8px 8px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: linear-gradient(135deg, hsl(40, 75%, 49%) 0%, hsl(38, 92%, 50%) 100%);
        color: white !important;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 600;
        margin: 25px 0;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 2px 4px rgba(181, 130, 40, 0.2);
      }
      .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(181, 130, 40, 0.3);
      }
      .urgent-button {
        background: linear-gradient(135deg, hsl(0, 84%, 60%) 0%, hsl(38, 92%, 50%) 100%);
        animation: pulse 2s infinite;
      }
      .note {
        background-color: #f7f7f7;
        padding: 15px;
        border-radius: 4px;
        margin-top: 25px;
        font-size: 14px;
        border-left: 4px solid hsl(40, 75%, 49%);
      }
      .urgent-notice {
        background: linear-gradient(135deg, rgba(220, 38, 127, 0.1), rgba(181, 130, 40, 0.1));
        padding: 20px;
        border-radius: 8px;
        border: 2px solid hsl(0, 84%, 60%);
        margin: 20px 0;
        text-align: center;
      }
      .highlight {
        color: hsl(40, 75%, 49%);
        font-weight: 600;
      }
      .highlight-date {
        font-size: 18px;
        font-weight: bold;
        color: hsl(0, 84%, 60%);
        text-align: center;
        margin: 15px 0;
      }
      .price {
        font-size: 24px;
        color: hsl(40, 75%, 49%);
        font-weight: bold;
        margin: 10px 0;
        text-align: center;
      }
      .contact-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        margin-top: 20px;
        text-align: center;
        border-left: 4px solid hsl(40, 75%, 49%);
      }
      .contact-info a {
        color: hsl(40, 75%, 49%);
        text-decoration: none;
      }
      .success-icon {
        color: hsl(142, 76%, 36%);
        font-size: 48px;
        margin-bottom: 15px;
        text-align: center;
      }
      .alert {
        background-color: #e8f4fd;
        padding: 15px;
        border-radius: 4px;
        margin-top: 25px;
        font-size: 14px;
        border-left: 4px solid hsl(40, 75%, 49%);
      }
      .otp-code {
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 8px;
        margin: 30px 0;
        color: hsl(40, 75%, 49%);
        background: linear-gradient(135deg, rgba(181, 130, 40, 0.1), rgba(253, 186, 116, 0.1));
        padding: 20px;
        border-radius: 8px;
        border: 2px dashed hsl(40, 75%, 49%);
      }
      .receipt-section, .due-balance-section {
        background: linear-gradient(135deg, rgba(181, 130, 40, 0.05), rgba(253, 186, 116, 0.05));
        border: 1px solid hsl(40, 75%, 85%);
        border-radius: 8px;
        padding: 20px;
        margin: 25px 0;
      }
      .receipt-section h3, .due-balance-section h3 {
        color: hsl(40, 75%, 49%);
        margin-bottom: 15px;
        font-size: 18px;
      }
      .receipt-details, .invoice-details {
        background: white;
        border-radius: 6px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .receipt-row, .invoice-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      .receipt-row:last-child, .invoice-row:last-child {
        border-bottom: none;
      }
      .receipt-label, .invoice-label {
        font-weight: 600;
        color: #495057;
      }
      .receipt-value, .invoice-value {
        color: #212529;
        text-align: right;
      }
      .amount-paid, .amount-due {
        font-weight: bold;
        color: hsl(40, 75%, 49%);
        font-size: 16px;
      }
      .due-date {
        color: hsl(0, 84%, 60%);
        font-weight: 600;
      }
      .benefits-list ul {
        list-style: none;
        padding: 0;
      }
      .benefits-list li {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      .reactivation-info {
        background: linear-gradient(135deg, rgba(142, 76%, 36%, 0.1), rgba(181, 130, 40, 0.1));
        padding: 20px;
        border-radius: 8px;
        margin: 25px 0;
        text-align: center;
        border: 1px solid hsl(142, 76%, 70%);
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @media only screen and (max-width: 600px) {
        .container {
          width: 100%;
          border-radius: 0;
          padding: 15px;
        }
        .header {
          margin: -15px -15px 15px -15px;
          padding: 15px 0;
        }
        .content {
          padding: 20px 15px;
        }
        .footer {
          margin: 0 -15px -15px -15px;
          padding: 15px;
        }
        .button {
          display: block;
          text-align: center;
        }
        .receipt-row, .invoice-row {
          flex-direction: column;
          align-items: flex-start;
        }
        .receipt-value, .invoice-value {
          text-align: left;
          margin-top: 5px;
        }
      }
    `;
  }

  // Contact Form Email Templates (keeping existing functionality)
  async sendContactFormEmail(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<nodemailer.SentMessageInfo> {
    const html = this.getContactFormEmailTemplate(contactData);
    return this.sendEmail({
      to: config.CONTACT_EMAIL || "konnectsphere123@gmail.com",
      subject: `Contact Form: ${contactData.subject} - ${contactData.name}`,
      html,
    });
  }

  private getContactFormEmailTemplate(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): string {
    const subjectLabels: { [key: string]: string } = {
      "technical-support": "🔧 Technical Support",
      "billing-question": "💳 Billing Question",
      "feature-request": "💡 Feature Request",
      "bug-report": "🐛 Bug Report",
      "account-support": "👤 Account Support",
      other: "💬 General Inquiry",
    };

    const subjectDisplay =
      subjectLabels[contactData.subject] || contactData.subject;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission</title>
      <style>
        ${this.getCommonEmailStyles()}
        .contact-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid hsl(40, 75%, 49%);
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #495057;
          min-width: 100px;
        }
        .detail-value {
          color: #212529;
          text-align: right;
          word-break: break-word;
        }
        .message-section {
          background: #ffffff;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .message-header {
          font-size: 18px;
          font-weight: 600;
          color: hsl(40, 75%, 49%);
          margin-bottom: 15px;
          border-bottom: 2px solid #f8f9fa;
          padding-bottom: 10px;
        }
        .message-content {
          line-height: 1.8;
          color: #495057;
          white-space: pre-wrap;
          font-size: 16px;
        }
        .priority-banner {
          background: linear-gradient(135deg, hsl(0, 84%, 60%), hsl(38, 92%, 50%));
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .action-buttons {
          text-align: center;
          margin: 30px 0;
        }
        .reply-button {
          display: inline-block;
          padding: 15px 30px;
          background: linear-gradient(135deg, hsl(40, 75%, 49%) 0%, hsl(38, 92%, 50%) 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 10px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(181, 130, 40, 0.2);
        }
        @media only screen and (max-width: 600px) {
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .detail-value {
            text-align: left;
            margin-top: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission 📨</h2>
        </div>
        <div class="content">
          <div class="priority-banner">
            ⚡ New ${subjectDisplay} Inquiry Received
          </div>

          <p>Hello KonnectSphere Team,</p>
          <p>You have received a new contact form submission through the website. Please find the details below:</p>

          <div class="contact-details">
            <div class="detail-row">
              <span class="detail-label">👤 Name:</span>
              <span class="detail-value">${contactData.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📧 Email:</span>
              <span class="detail-value">${contactData.email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📋 Subject:</span>
              <span class="detail-value">${subjectDisplay}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${new Date().toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              })}</span>
            </div>
          </div>

          <div class="message-section">
            <div class="message-header">💬 Message Content</div>
            <div class="message-content">${contactData.message}</div>
          </div>

          <div class="action-buttons">
            <a href="mailto:${contactData.email}?subject=Re: ${
      contactData.subject
    }&body=Hi ${
      contactData.name
    },%0D%0A%0D%0AThank you for contacting KonnectSphere. We have received your inquiry regarding '${
      contactData.subject
    }' and wanted to get back to you.%0D%0A%0D%0ABest regards,%0D%0AKonnectSphere Team" class="reply-button">
              📧 Reply to ${contactData.name}
            </a>
          </div>

          <div class="note">
            <p><strong>📝 Action Required:</strong></p>
            <ul>
              <li>Review the inquiry and determine the appropriate response</li>
              <li>Reply within 24 hours for optimal customer experience</li>
              <li>Update any relevant documentation if this is a common question</li>
              <li>Forward to the appropriate team member if specialized knowledge is required</li>
            </ul>
          </div>

          <div class="contact-info">
            <p><strong>Quick Response Tips:</strong></p>
            <p>• For technical issues: Check the FAQ and documentation first</p>
            <p>• For billing questions: Verify account status before responding</p>
            <p>• For feature requests: Consider product roadmap alignment</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This email was automatically generated from the contact form submission.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Send confirmation email to the user who submitted the contact form
  async sendContactFormConfirmation(
    to: string,
    userName: string,
    subject: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getContactFormConfirmationTemplate(userName, subject);
    return this.sendEmail({
      to,
      subject: "We've Received Your Message - KonnectSphere",
      html,
    });
  }

  private getContactFormConfirmationTemplate(
    userName: string,
    subject: string
  ): string {
    const subjectLabels: { [key: string]: string } = {
      "technical-support": "🔧 Technical Support",
      "billing-question": "💳 Billing Question",
      "feature-request": "💡 Feature Request",
      "bug-report": "🐛 Bug Report",
      "account-support": "👤 Account Support",
      other: "💬 General Inquiry",
    };

    const subjectDisplay = subjectLabels[subject] || subject;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Received</title>
      <style>
        ${this.getCommonEmailStyles()}
        .timeline {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .timeline-item {
          display: flex;
          align-items: center;
          margin: 10px 0;
          padding: 10px 0;
        }
        .timeline-icon {
          width: 30px;
          height: 30px;
          background: hsl(40, 75%, 49%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: bold;
        }
        .timeline-content {
          flex: 1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Message Received Successfully! ✅</h2>
        </div>
        <div class="content">
          <div class="success-icon">🎉</div>
          
          <p>Hi <span class="highlight">${userName}</span>,</p>
          
          <p>Thank you for reaching out to KonnectSphere! We've successfully received your inquiry regarding <span class="highlight">${subjectDisplay}</span>.</p>

          <div class="note">
            <p><strong>📋 What happens next?</strong></p>
            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-icon">1</div>
                <div class="timeline-content">
                  <strong>Message Received</strong><br>
                  <small>Your message has been received and logged in our system</small>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-icon">2</div>
                <div class="timeline-content">
                  <strong>Team Assignment</strong><br>
                  <small>Your inquiry will be routed to the appropriate team member</small>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-icon">3</div>
                <div class="timeline-content">
                  <strong>Response</strong><br>
                  <small>We'll get back to you within 24 hours</small>
                </div>
              </div>
            </div>
          </div>

          <p>Our team reviews all inquiries carefully and will respond to you as soon as possible. For urgent matters, you can also reach us directly at our contact information below.</p>

          <div class="contact-info">
            <p><strong>📞 Need immediate assistance?</strong></p>
            <p>📧 Email: <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
            <p>📍 Location: Dubai, United Arab Emirates</p>
          </div>

          <p>Thank you for choosing KonnectSphere. We appreciate your interest and look forward to helping you!</p>
          
          <br>
          <p>Best regards,<br>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
          <p>This is an automated confirmation email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Additional Account Management Emails (keeping existing functionality)
  async sendReportConfirmation(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getReportConfirmationTemplate(userName);
    return this.sendEmail({
      to,
      subject: "We've Received Your Report",
      html,
    });
  }

  private getReportConfirmationTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report Received</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Report Received</h2>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for bringing this to our attention. Our team will carefully review the issue and take appropriate steps to maintain the integrity of our community.</p>
          <p>You'll hear from us soon. For updates, contact@konnectsphere.net</p>
          <br>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendAccountDeactivationConfirmation(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getAccountDeactivationTemplate(userName);
    return this.sendEmail({
      to,
      subject: "Your Account Has Been Deactivated",
      html,
    });
  }

  private getAccountDeactivationTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deactivated</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Account Deactivated</h2>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We've processed your account deactivation. It's always difficult to say goodbye — but if you ever choose to return, KonnectSphere will be ready to welcome you back.</p>
          <p>Reach us anytime: contact@konnectsphere.net</p>
          <br>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendAccountReactivationConfirmation(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getAccountReactivationTemplate(userName);
    return this.sendEmail({
      to,
      subject: "Welcome Back to KonnectSphere",
      html,
    });
  }

  private getAccountReactivationTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Reactivated</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome Back!</h2>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>It's great to have you back. Your account is now reactivated and ready to go. Let's continue building something meaningful together.</p>
          <p>Need assistance? We're here at contact@konnectsphere.net</p>
          <br>
          <p>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async sendAccountDeletionConfirmation(
    to: string,
    userName: string
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getAccountDeletionTemplate(userName);
    return this.sendEmail({
      to,
      subject: "Your KonnectSphere Account Has Been Deleted",
      html,
    });
  }

  private getAccountDeletionTemplate(userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deleted</title>
      <style>
        ${this.getCommonEmailStyles()}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Account Deleted</h2>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Your account has now been permanently deleted from KonnectSphere, along with your data and pitch history, as requested.</p>
          <p>It's always difficult to see a member of our community leave — especially someone with the potential to build or support great ideas.</p>
          <p>If circumstances change, or if you're ever ready to return, our doors will always be open.</p>
          <p>For any final concerns, feel free to reach out: contact@konnectsphere.net</p>
          <br>
          <p>Wishing you all the best,<br>The KonnectSphere Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // ====== RECURRING PAYMENT EMAIL METHODS ======

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(
    to: string,
    userName: string,
    invoiceDetails: {
      invoiceId: string;
      amount: number;
      currency: string;
      dueDate: Date;
      planName: string;
      nextRetryDate: Date;
      invoiceUrl?: string;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getPaymentFailureTemplate(userName, invoiceDetails);
    return this.sendEmail({
      to,
      subject: `🚨 Payment Failed - Action Required for Your ${invoiceDetails.planName} Plan`,
      html,
    });
  }

  private getPaymentFailureTemplate(
    userName: string,
    invoiceDetails: {
      invoiceId: string;
      amount: number;
      currency: string;
      dueDate: Date;
      planName: string;
      nextRetryDate: Date;
      invoiceUrl?: string;
    }
  ): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed - Action Required</title>
      <style>
        ${this.getCommonEmailStyles()}
        .payment-failed-banner {
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
        .invoice-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .invoice-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }
        .invoice-label {
          font-weight: 600;
          color: #495057;
        }
        .invoice-value {
          color: #212529;
        }
        .amount-due {
          font-weight: bold;
          color: #dc3545;
          font-size: 1.1em;
        }
        .retry-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="payment-failed-banner">
          <h2>⚠️ Payment Failed</h2>
          <p>We couldn't process your payment for the ${
            invoiceDetails.planName
          } plan</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>We attempted to process your recurring payment for the <strong>${
            invoiceDetails.planName
          }</strong> plan, but unfortunately, the payment failed.</p>
          
          <div class="invoice-details">
            <h3>Payment Details</h3>
            <div class="invoice-row">
              <span class="invoice-label">Plan:</span>
              <span class="invoice-value">${invoiceDetails.planName}</span>
            </div>
            <div class="invoice-row">
              <span class="invoice-label">Amount Due:</span>
              <span class="invoice-value amount-due">${invoiceDetails.currency.toUpperCase()} $${invoiceDetails.amount.toFixed(
      2
    )}</span>
            </div>
            <div class="invoice-row">
              <span class="invoice-label">Original Due Date:</span>
              <span class="invoice-value">${formatDate(
                invoiceDetails.dueDate
              )}</span>
            </div>
            <div class="invoice-row">
              <span class="invoice-label">Invoice ID:</span>
              <span class="invoice-value">${invoiceDetails.invoiceId}</span>
            </div>
          </div>

          <div class="retry-info">
            <h4>🔄 What happens next?</h4>
            <p>Don't worry - we'll automatically retry your payment on <strong>${formatDate(
              invoiceDetails.nextRetryDate
            )}</strong>. Please ensure your payment method is up to date to avoid service interruption.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            ${
              invoiceDetails.invoiceUrl
                ? `<a href="${invoiceDetails.invoiceUrl}" class="button">Update Payment Method & Pay Now</a>`
                : `<a href="${config.FRONTEND_URL}/billing" class="button">Update Payment Method</a>`
            }
          </div>

          <p><strong>Important:</strong> If payment continues to fail, your subscription may be suspended to avoid further charges. You can always reactivate it once payment is successful.</p>

          <p>Need help? Contact our support team at <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          
          <br>
          <p>Best regards,<br>The KonnectSphere Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send payment action required notification (for 3D Secure, etc.)
   */
  async sendPaymentActionRequiredNotification(
    to: string,
    userName: string,
    invoiceDetails: {
      invoiceId: string;
      amount: number;
      currency: string;
      planName: string;
      invoiceUrl?: string;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getPaymentActionRequiredTemplate(
      userName,
      invoiceDetails
    );
    return this.sendEmail({
      to,
      subject: `🔐 Payment Authentication Required - ${invoiceDetails.planName} Plan`,
      html,
    });
  }

  private getPaymentActionRequiredTemplate(
    userName: string,
    invoiceDetails: {
      invoiceId: string;
      amount: number;
      currency: string;
      planName: string;
      invoiceUrl?: string;
    }
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Authentication Required</title>
      <style>
        ${this.getCommonEmailStyles()}
        .action-required-banner {
          background: linear-gradient(135deg, #ffa726, #ff9800);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="action-required-banner">
          <h2>🔐 Payment Authentication Required</h2>
          <p>Your payment needs additional verification</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>We're processing your payment for the <strong>${
            invoiceDetails.planName
          }</strong> plan (${invoiceDetails.currency.toUpperCase()} $${invoiceDetails.amount.toFixed(
      2
    )}), but your bank requires additional authentication to complete the transaction.</p>
          
          <p>This is a security measure to protect your account and is completely normal for many payment methods.</p>

          <div style="text-align: center; margin: 30px 0;">
            ${
              invoiceDetails.invoiceUrl
                ? `<a href="${invoiceDetails.invoiceUrl}" class="button">Complete Payment Authentication</a>`
                : `<a href="${config.FRONTEND_URL}/billing" class="button">Complete Payment</a>`
            }
          </div>

          <p><strong>What you need to do:</strong></p>
          <ul>
            <li>Click the button above to complete the authentication process</li>
            <li>Follow your bank's verification steps (this may include SMS codes, app notifications, or biometric verification)</li>
            <li>Once verified, your payment will be processed automatically</li>
          </ul>

          <p><strong>Time sensitive:</strong> Please complete this within 24 hours to avoid any service interruption.</p>

          <p>Questions? We're here to help at <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          
          <br>
          <p>Best regards,<br>The KonnectSphere Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send subscription past due notification
   */
  async sendSubscriptionPastDueNotification(
    to: string,
    userName: string,
    subscriptionDetails: {
      planName: string;
      currentPeriodEnd: Date;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getSubscriptionPastDueTemplate(
      userName,
      subscriptionDetails
    );
    return this.sendEmail({
      to,
      subject: `⏰ Subscription Past Due - ${subscriptionDetails.planName} Plan`,
      html,
    });
  }

  private getSubscriptionPastDueTemplate(
    userName: string,
    subscriptionDetails: {
      planName: string;
      currentPeriodEnd: Date;
    }
  ): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Past Due</title>
      <style>
        ${this.getCommonEmailStyles()}
        .past-due-banner {
          background: linear-gradient(135deg, #ff8a65, #ff7043);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="past-due-banner">
          <h2>⏰ Subscription Past Due</h2>
          <p>Your ${
            subscriptionDetails.planName
          } subscription needs attention</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>Your <strong>${
            subscriptionDetails.planName
          }</strong> subscription is now past due. While we continue to retry payment automatically, we wanted to let you know so you can take action if needed.</p>
          
          <p><strong>What this means:</strong></p>
          <ul>
            <li>Your subscription remains active for now</li>
            <li>We'll continue attempting to collect payment</li>
            <li>If payment continues to fail, your subscription may be suspended</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              config.FRONTEND_URL
            }/billing" class="button">Update Payment Method</a>
          </div>

          <p><strong>Original billing period ended:</strong> ${formatDate(
            subscriptionDetails.currentPeriodEnd
          )}</p>

          <p>To avoid any service interruption, please update your payment method or contact us if you're experiencing issues.</p>

          <p>Need assistance? Reach out to us at <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          
          <br>
          <p>Best regards,<br>The KonnectSphere Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send upcoming payment notification
   */
  async sendUpcomingPaymentNotification(
    to: string,
    userName: string,
    invoiceDetails: {
      invoiceId: string;
      amount: number;
      currency: string;
      dueDate: Date;
      planName: string;
      billingPeriod: string;
      invoiceUrl?: string;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getUpcomingPaymentTemplate(userName, invoiceDetails);
    return this.sendEmail({
      to,
      subject: `📅 Upcoming Payment: ${invoiceDetails.planName} Plan Renewal`,
      html,
    });
  }

  private getUpcomingPaymentTemplate(
    userName: string,
    invoiceDetails: {
      invoiceId: string;
      amount: number;
      currency: string;
      dueDate: Date;
      planName: string;
      billingPeriod: string;
      invoiceUrl?: string;
    }
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Upcoming Payment Notification</title>
      <style>
        ${this.getCommonEmailStyles()}
        .upcoming-payment-banner {
          background: linear-gradient(135deg, #66bb6a, #4caf50);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="upcoming-payment-banner">
          <h2> Upcoming Payment</h2>
          <p>Your ${invoiceDetails.planName} subscription will renew soon</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>This is a friendly reminder that your <strong>${
            invoiceDetails.planName
          }</strong> subscription will automatically renew .</p>
          
          <div class="invoice-details">
            <h3>Renewal Details</h3>
            <div class="invoice-row">
              <span class="invoice-label">Plan:</span>
              <span class="invoice-value">${invoiceDetails.planName}</span>
            </div>
            <div class="invoice-row">
              <span class="invoice-label">Billing Period:</span>
              <span class="invoice-value">${invoiceDetails.billingPeriod}</span>
            </div>
            <div class="invoice-row">
              <span class="invoice-label">Amount:</span>
              <span class="invoice-value">${invoiceDetails.currency.toUpperCase()} $${invoiceDetails.amount.toFixed(
      2
    )}</span>
            </div>
            
          </div>

          <p>The payment will be automatically charged to your saved payment method. No action is required unless you want to make changes.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              config.FRONTEND_URL
            }/billing" class="button">Manage Billing</a>
            ${
              invoiceDetails.invoiceUrl
                ? `<a href="${invoiceDetails.invoiceUrl}" class="button-secondary" style="margin-left: 10px;">View Invoice</a>`
                : ""
            }
          </div>

          <p>Want to make changes? You can update your payment method, change your plan, or cancel your subscription anytime from your billing dashboard.</p>

          <p>Questions? Contact us at <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          
          <br>
          <p>Best regards,<br>The KonnectSphere Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send recurring payment success notification (different from initial subscription)
   */
  async sendRecurringPaymentSuccessNotification(
    to: string,
    userName: string,
    receiptData: ReceiptData
  ): Promise<nodemailer.SentMessageInfo> {
    const html = this.getRecurringPaymentSuccessTemplate(userName, receiptData);
    return this.sendEmail({
      to,
      subject: `✅ Payment Successful - ${receiptData.planName} Renewed`,
      html,
    });
  }

  private getRecurringPaymentSuccessTemplate(
    userName: string,
    receiptData: ReceiptData
  ): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - Subscription Renewed</title>
      <style>
        ${this.getCommonEmailStyles()}
        .success-banner {
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-banner">
          <h2>✅ Payment Successful</h2>
          <p>Your ${receiptData.planName} subscription has been renewed</p>
        </div>
        
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>Great news! Your payment was processed successfully and your <strong>${
            receiptData.planName
          }</strong> subscription has been renewed.</p>
          
          <div class="receipt-section">
            <h3>📧 Payment Receipt</h3>
            <div class="receipt-details">
              <div class="receipt-row">
                <span class="receipt-label">Plan:</span>
                <span class="receipt-value">${receiptData.planName}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Amount Paid:</span>
                <span class="receipt-value">${receiptData.currency.toUpperCase()} $${receiptData.amount.toFixed(
      2
    )}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Billing Period:</span>
                <span class="receipt-value">${receiptData.billingPeriod}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Payment Date:</span>
                <span class="receipt-value">${formatDate(
                  receiptData.paymentDate
                )}</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Next Billing Date:</span>
                <span class="receipt-value">${
                  receiptData.nextBillingDate
                    ? formatDate(receiptData.nextBillingDate)
                    : "Next billing cycle"
                }</span>
              </div>
              <div class="receipt-row">
                <span class="receipt-label">Invoice ID:</span>
                <span class="receipt-value">${receiptData.invoiceId}</span>
              </div>
            </div>
            
            ${
              receiptData.invoiceUrl
                ? `<div style="text-align: center; margin: 20px 0;">
                <a href="${receiptData.invoiceUrl}" class="button">Download Invoice</a>
              </div>`
                : ""
            }
          </div>

          <p>Your subscription is now active until <strong>${
            receiptData.nextBillingDate
              ? formatDate(receiptData.nextBillingDate)
              : "your next billing cycle"
          }</strong>. Continue enjoying all the benefits of your ${
      receiptData.planName
    } plan!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              config.FRONTEND_URL
            }/dashboard" class="button">Go to Dashboard</a>
          </div>

          <p>Need help or have questions? Contact us at <a href="mailto:contact@konnectsphere.net">contact@konnectsphere.net</a></p>
          
          <br>
          <p>Thank you for being a valued member!<br>The KonnectSphere Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} KonnectSphere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

export default new EmailService();
