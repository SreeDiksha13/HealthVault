export const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  let deviceType = 'Desktop';
  if (userAgent.includes('Mobile')) deviceType = 'Mobile';
  else if (userAgent.includes('Tablet')) deviceType = 'Tablet';

  return `${deviceType} - ${os} - ${browser}`;
};

export const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'Unknown';
};

export default { getDeviceInfo, getClientIp };
