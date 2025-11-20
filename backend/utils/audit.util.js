import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (data) => {
  try {
    await AuditLog.create({
      user_id: data.user_id,
      email: data.email,
      action: data.action,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      device_info: data.device_info,
      status: data.status || 'success',
      error_message: data.error_message,
    });
  } catch (error) {
    console.error('Error creating audit log:', error.message);
  }
};

export const getUserActivity = async (userId, limit = 10) => {
  try {
    return await AuditLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('-__v');
  } catch (error) {
    console.error('Error fetching user activity:', error.message);
    return [];
  }
};

export const getFailedLoginAttempts = async (email, minutesAgo = 15) => {
  try {
    const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000);
    return await AuditLog.countDocuments({
      email: email,
      action: 'failed_login',
      timestamp: { $gte: timeThreshold }
    });
  } catch (error) {
    console.error('Error checking failed login attempts:', error.message);
    return 0;
  }
};

export default { createAuditLog, getUserActivity, getFailedLoginAttempts };
