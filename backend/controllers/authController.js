import Otp from '../models/Otp.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordReset from '../models/PasswordReset.js';
import EmailVerification from '../models/EmailVerification.js';
import Patient from '../models/Patients.js';
import Doctor from '../models/Doctors.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  signAccessToken,
  signRefreshToken,
  saveRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
} from '../utils/jwt.js';
import {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../services/email.service.js';
import { createAuditLog, getFailedLoginAttempts } from '../utils/audit.util.js';
import { getDeviceInfo, getClientIp } from '../utils/device.util.js';

// ==================== OTP ROUTES ====================

export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await sendOtpEmail(email, otp);
      await Otp.create({ email, otp });
      res.json({ message: 'OTP sent successfully to your email' });
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError.message);
      res.status(500).json({ error: `Failed to send OTP email: ${emailError.message}. Please check your email configuration or try again later.` });
    }
  } catch (err) {
    next(err);
  }
};

export const verifyOtpAndRegister = async (req, res, next) => {
  try {
    const { email, otp, full_name, password, role } = req.body;
    const record = await Otp.findOne({ email, otp });
    if (!record) {
      await createAuditLog({
        email,
        action: 'register',
        status: 'failure',
        error_message: 'Invalid or expired OTP',
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const userRole = role || 'patient'; // Default to patient if no role specified
    
    const newUser = await User.create({
      email,
      password_hash,
      full_name,
      role: userRole,
      email_verified: true,
    });
    await record.deleteOne();

    // Create corresponding Patient or Doctor entry
    if (userRole === 'patient') {
      const { dob, gender, bloodGroup, phone, address } = req.body;
      await Patient.create({
        name: full_name,
        email: email,
        usertype: 'patient',
        dateOfBirth: dob ? new Date(dob) : undefined,
        gender: gender, // Model will handle lowercase conversion
        bloodGroup,
        phone,
        address
      });
    } else if (userRole === 'doctor') {
      const { specialty, phone, address, bio, yearsExperience, licenseNumber } = req.body;
      await Doctor.create({
        name: full_name,
        email: email,
        usertype: 'doctor',
        phone,
        address,
        specialization: specialty,
        licenseNumber,
        bio,
        yearsExperience
      });
    }

    const deviceInfo = getDeviceInfo(req);
    const accessToken = signAccessToken({ user_id: newUser._id });
    const refreshToken = signRefreshToken({ user_id: newUser._id });
    const decodedRefresh = jwt.decode(refreshToken);

    await saveRefreshToken(newUser._id, refreshToken, new Date(decodedRefresh.exp * 1000), deviceInfo);

    await createAuditLog({
      user_id: newUser._id,
      email: newUser.email,
      action: 'register',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      device_info: deviceInfo,
    });

    sendWelcomeEmail(email, full_name).catch((err) => console.error('Welcome email failed:', err.message));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken,
      user: {
        email: newUser.email,
        full_name: newUser.full_name,
        email_verified: newUser.email_verified,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ==================== STANDARD AUTH ====================

export const register = async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password_hash,
      full_name,
      email_verified: false,
    });

    const verificationToken = uuidv4();
    await EmailVerification.create({ user_id: newUser._id, token: verificationToken });

    const deviceInfo = getDeviceInfo(req);
    await createAuditLog({
      user_id: newUser._id,
      email: newUser.email,
      action: 'register',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      device_info: deviceInfo,
    });

    try {
      await sendVerificationEmail(email, verificationToken);
      res.json({ message: 'Registration successful! Please check your email to verify your account.', email: newUser.email });
    } catch (emailError) {
      console.error('Verification email failed:', emailError.message);
      res.json({ message: 'Registration successful! Verification email could not be sent. Please contact support.', email: newUser.email });
    }
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const verification = await EmailVerification.findOne({ token });
    if (!verification) return res.status(400).json({ error: 'Invalid or expired verification token' });

    const user = await User.findById(verification.user_id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (user.email_verified) return res.status(400).json({ error: 'Email already verified' });

    user.email_verified = true;
    user.updated_at = new Date();
    await user.save();
    await verification.deleteOne();

    await createAuditLog({
      user_id: user._id,
      email: user.email,
      action: 'email_verify',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
    });

    sendWelcomeEmail(user.email, user.full_name).catch((err) => console.error('Welcome email failed:', err.message));

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (user.email_verified) return res.status(400).json({ error: 'Email already verified' });

    await EmailVerification.deleteMany({ user_id: user._id });
    const verificationToken = uuidv4();
    await EmailVerification.create({ user_id: user._id, token: verificationToken });

    try {
      await sendVerificationEmail(email, verificationToken);
      res.json({ message: 'Verification email sent successfully!' });
    } catch (emailError) {
      console.error('Verification email failed:', emailError.message);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const failedAttempts = await getFailedLoginAttempts(email);
    if (failedAttempts >= 5) {
      await createAuditLog({
        email,
        action: 'failed_login',
        status: 'failure',
        error_message: 'Account temporarily locked due to multiple failed attempts',
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
      return res.status(429).json({ error: 'Too many failed login attempts. Please try again in 15 minutes.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await createAuditLog({
        email,
        action: 'failed_login',
        status: 'failure',
        error_message: 'User not found',
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await createAuditLog({
        user_id: user._id,
        email,
        action: 'failed_login',
        status: 'failure',
        error_message: 'Invalid password',
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email before logging in', email_verified: false });
    if (!user.is_active) return res.status(403).json({ error: 'Account is deactivated. Please contact support.' });

    // Ensure Patient/Doctor entry exists (migration for existing users)
    if (user.role === 'patient') {
      const existingPatient = await Patient.findOne({ email: user.email });
      if (!existingPatient) {
        await Patient.create({
          name: user.full_name,
          email: user.email,
          usertype: 'patient'
        });
        console.log(`✅ Created Patient entry for existing user: ${user.email}`);
      }
    } else if (user.role === 'doctor') {
      const existingDoctor = await Doctor.findOne({ email: user.email });
      if (!existingDoctor) {
        await Doctor.create({
          name: user.full_name,
          email: user.email,
          usertype: 'doctor'
        });
        console.log(`✅ Created Doctor entry for existing user: ${user.email}`);
      }
    }

    const deviceInfo = getDeviceInfo(req);
    const accessToken = signAccessToken({ user_id: user._id });
    const refreshToken = signRefreshToken({ user_id: user._id });
    const decodedRefresh = jwt.decode(refreshToken);
    await saveRefreshToken(user._id, refreshToken, new Date(decodedRefresh.exp * 1000), deviceInfo);

    await createAuditLog({
      user_id: user._id,
      email: user.email,
      action: 'login',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      device_info: deviceInfo,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Log user info for debugging
    console.log('Login successful for:', {
      email: user.email,
      role: user.role,
      name: user.full_name,
      verified: user.email_verified
    });

    res.json({ 
      accessToken, 
      user: { 
        email: user.email, 
        full_name: user.full_name, 
        email_verified: user.email_verified, 
        role: user.role 
      } 
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.user_id);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const deviceInfo = getDeviceInfo(req);
    const accessToken = signAccessToken({ user_id: user._id });
    const newRefreshToken = await rotateRefreshToken(token, user._id, deviceInfo);

    await createAuditLog({
      user_id: user._id,
      email: user.email,
      action: 'token_refresh',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      device_info: deviceInfo,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await RefreshToken.updateOne({ token_hash: token }, { revoked: true });
      try {
        const payload = jwt.decode(token);
        if (payload && payload.user_id) {
          const user = await User.findById(payload.user_id);
          if (user) {
            await createAuditLog({
              user_id: user._id,
              email: user.email,
              action: 'logout',
              status: 'success',
              ip_address: getClientIp(req),
              user_agent: req.headers['user-agent'],
              device_info: getDeviceInfo(req),
            });
          }
        }
      } catch (auditError) {
        console.error('Audit log error:', auditError.message);
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ==================== PASSWORD RESET ====================

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If your email is registered, you will receive a password reset link.' });

    await PasswordReset.deleteMany({ user_id: user._id });
    const resetToken = uuidv4();
    await PasswordReset.create({ user_id: user._id, token: resetToken });

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError.message);
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    await createAuditLog({
      user_id: user._id,
      email: user.email,
      action: 'password_reset',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
    });

    res.json({ message: 'If your email is registered, you will receive a password reset link.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const resetRecord = await PasswordReset.findOne({ token });
    if (!resetRecord) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const user = await User.findById(resetRecord.user_id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    user.password_hash = password_hash;
    user.updated_at = new Date();
    await user.save();

    await resetRecord.deleteOne();
    await RefreshToken.updateMany({ user_id: user._id }, { revoked: true });

    await createAuditLog({
      user_id: user._id,
      email: user.email,
      action: 'password_reset',
      status: 'success',
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
    });

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
};

// ==================== USER INFO ====================

export const getActivity = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const activities = await (await import('../utils/audit.util.js')).getUserActivity(userId, 20);
    res.json({ activities });
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const sessions = await RefreshToken.find({ user_id: userId, revoked: false, expires_at: { $gt: new Date() } })
      .select('device_info created_at last_used_at')
      .sort({ last_used_at: -1 });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { sessionId } = req.body;
    const result = await RefreshToken.updateOne({ _id: sessionId, user_id: userId }, { revoked: true });
    if (result.modifiedCount === 0) return res.status(400).json({ error: 'Session not found' });
    res.json({ message: 'Session revoked successfully' });
  } catch (err) {
    next(err);
  }
};

export default {
  sendOtp,
  verifyOtpAndRegister,
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getActivity,
  getSessions,
  revokeSession,
};
