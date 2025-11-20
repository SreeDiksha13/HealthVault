import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const isEmailConfigured = process.env.EMAIL_USER && 
                          process.env.EMAIL_PASS && 
                          process.env.EMAIL_USER !== 'your-email@gmail.com';

if (!isEmailConfigured) {
  throw new Error('Email service not configured! Please set EMAIL_USER and EMAIL_PASS in .env file');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email service error:', error.message);
    throw new Error(`Email service verification failed: ${error.message}`);
  } else {
    console.log('✅ Email service is ready');
  }
});

export const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"HealthVault EHR" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for HealthVault Registration',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">HealthVault Authentication</h2>
        <p>Your One-Time Password (OTP) for registration is:</p>
        <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #4F46E5; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"HealthVault EHR" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in <strong>1 hour</strong>.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    throw new Error('Failed to send password reset email. Please try again.');
  }
};

export const sendVerificationEmail = async (email, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"HealthVault EHR" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to HealthVault!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6B7280; word-break: break-all;">${verifyUrl}</p>
        <p>This link will expire in <strong>24 hours</strong>.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

export const sendWelcomeEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"HealthVault EHR" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to HealthVault',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome, ${fullName}!</h2>
        <p>Your account has been successfully verified and activated.</p>
        <p>You can now access all features of the HealthVault system.</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">Thank you for joining us!</p>
      </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return false;
  }
};

export default {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
};
