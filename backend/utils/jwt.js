import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import RefreshToken from '../models/RefreshToken.js';
dotenv.config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'change_this_access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_this_refresh';
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

export const saveRefreshToken = async (userId, token, expiry, deviceInfo = null) => {
  await RefreshToken.create({
    user_id: userId,
    token_hash: token,
    expires_at: expiry,
    revoked: false,
    device_info: deviceInfo,
    last_used_at: new Date(),
  });
};

export const revokeRefreshToken = async (token) => {
  await RefreshToken.updateOne({ token_hash: token }, { revoked: true });
};

export const isRefreshTokenValid = async (token) => {
  const record = await RefreshToken.findOne({ token_hash: token, revoked: false });
  if (!record) return false;
  if (record.expires_at < new Date()) return false;
  record.last_used_at = new Date();
  await record.save();
  return true;
};

export const rotateRefreshToken = async (oldToken, userId, deviceInfo = null) => {
  await RefreshToken.updateOne({ token_hash: oldToken }, { revoked: true });
  const newRefreshToken = signRefreshToken({ user_id: userId });
  const decoded = jwt.decode(newRefreshToken);
  await saveRefreshToken(userId, newRefreshToken, new Date(decoded.exp * 1000), deviceInfo);
  return newRefreshToken;
};

export const cleanupExpiredTokens = async () => {
  try {
    const result = await RefreshToken.deleteMany({
      $or: [
        { expires_at: { $lt: new Date() } },
        { revoked: true, created_at: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    });
    console.log(`Cleaned up ${result.deletedCount} expired/revoked tokens`);
  } catch (error) {
    console.error('Error cleaning up tokens:', error.message);
  }
};

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  isRefreshTokenValid,
  rotateRefreshToken,
  cleanupExpiredTokens,
};
