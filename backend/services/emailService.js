/**
 * Email Service — FIX #3 & #13
 *
 * Centralizes all email sending logic that was scattered across app.js.
 * Also fixes FIX #13: sendResetPasswordOTP was called BEFORE it was defined.
 *
 * Used by: advocateRoutes, litigantRoutes, clerkAuthRoutes
 */
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL;

/**
 * Sends a 6-digit OTP email for registration verification.
 */
const sendEmailOTP = async (email, otp) => {
  const currentYear = new Date().getFullYear();

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Verification Code - Legal Portal',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #1a365d; padding: 24px; text-align: center; }
        .content { padding: 30px; }
        .otp-container { margin: 30px auto; padding: 20px; background-color: #f7fafc; border-radius: 6px; text-align: center; border: 1px solid #e2e8f0; }
        .otp-code { font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1a365d; margin: 20px 0; }
        .expiry { color: #e53e3e; font-size: 14px; margin-top: 10px; }
        .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; }
        .security-note { font-size: 13px; color: #718096; background-color: #f7fafc; padding: 15px; border-radius: 6px; margin-top: 30px; border-left: 4px solid #4299e1; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: white; margin: 0;">Legal Portal</h2>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with Legal Portal. Please use the verification code below to complete your registration.</p>
          <div class="otp-container">
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p class="expiry">This code will expire in 10 minutes</p>
          </div>
          <div class="security-note">
            <strong>Security Note:</strong> Legal Portal representatives will never ask for this code via phone or email. Please do not share this code with anyone.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${currentYear} Legal Portal. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>`
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid OTP Error:', error?.response?.body || error.message);
    // In dev, fall back gracefully rather than crashing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[DEV MODE] OTP for ${email}: ${otp}\n`);
      return true;
    }
    return false;
  }
};

/**
 * Sends a password reset OTP email.
 * FIX #13: This function was used in app.js before it was defined.
 */
const sendResetPasswordOTP = async (email, otp) => {
  const currentYear = new Date().getFullYear();

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Password Reset Code - E-Portal CMS',
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c3e50; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #fff; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; }
        .header { background: linear-gradient(135deg, #2c3e50 0%, #1a2a3a 100%); padding: 30px 20px; text-align: center; color: #fff; border-bottom: 4px solid #3498db; }
        .content { padding: 35px 30px; }
        .otp-container { margin: 35px auto; padding: 25px; background-color: #f8f9fa; text-align: center; border-radius: 8px; border: 1px solid #e9ecef; }
        .otp-code { font-size: 36px; letter-spacing: 10px; font-weight: bold; color: #2c3e50; margin: 20px auto; font-family: 'Courier New', monospace; background-color: #fff; padding: 18px; border: 1px dashed #3498db; border-radius: 6px; display: inline-block; }
        .expiry { color: #e74c3c; font-size: 14px; margin-top: 15px; font-weight: 600; }
        .footer { background: linear-gradient(135deg, #2c3e50 0%, #1a2a3a 100%); padding: 25px; text-align: center; font-size: 12px; color: #fff; border-top: 3px solid #3498db; }
        .security-note { font-size: 14px; color: #2c3e50; background-color: #f1f9ff; padding: 18px; margin-top: 30px; border-radius: 6px; border-left: 5px solid #3498db; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>E-Portal <span style="color: #3498db;">CMS</span></h1></div>
        <div class="content">
          <h2>Password Reset Verification</h2>
          <p>We received a request to reset your password. Use the verification code below:</p>
          <div class="otp-container">
            <p>Your secure verification code:</p>
            <div class="otp-code">${otp}</div>
            <p class="expiry">Valid for 10 minutes only</p>
          </div>
          <div class="security-note">
            <strong>Security Advisory:</strong> We will never ask for this code via phone or email. Keep this code confidential.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${currentYear} E-Portal CMS. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>`
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid Reset Error:', error?.response?.body || error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[DEV MODE] Reset OTP for ${email}: ${otp}\n`);
      return true;
    }
    throw error;
  }
};

/**
 * Sends a document request email to a litigant or advocate.
 */
const sendDocumentRequestEmail = async (recipient, caseDetails, documentRequest) => {
  try {
    const { name, email } = recipient;
    const { case_num, case_type } = caseDetails;
    const { document_type, description, submission_deadline } = documentRequest;
    const deadlineDate = new Date(submission_deadline).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: `Document Request - Case #${case_num}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <div style="background-color: #1a365d; color: white; padding: 15px; text-align: center;">
          <h2>Document Request - Case #${case_num}</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear ${name},</p>
          <p>The court has requested you to submit the following document:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Case Number:</strong> ${case_num}</p>
            <p><strong>Case Type:</strong> ${case_type}</p>
            <p><strong>Document Type:</strong> ${document_type}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Submission Deadline:</strong> ${deadlineDate}</p>
          </div>
          <div style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0;">
            <strong>⚠️ Important:</strong> Please submit the requested document before the deadline.
          </div>
          <p>Please log in to your account to upload the requested document.</p>
          <p>Regards,<br>Court Administration</p>
        </div>
        <div style="font-size: 12px; text-align: center; margin-top: 20px; color: #777;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>`
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Document request email error:', error);
    return false;
  }
};

module.exports = { sendEmailOTP, sendResetPasswordOTP, sendDocumentRequestEmail };
