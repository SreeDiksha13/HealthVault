import api from './api';

export async function register(email: string, password: string, full_name?: string) {
  const res = await api.post('/api/auth/register', { email, password, full_name }, { withCredentials: true });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password }, { withCredentials: true });
  return res.data;
}

export async function getProfile(token: string) {
  const res = await api.get('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return res.data;
}

export async function sendOtp(email: string) {
  const res = await api.post('/api/auth/send-otp', { email }, { withCredentials: true });
  return res.data;
}

export async function verifyOtpRegistration(email: string, otp: string, full_name: string, password: string, role?: string) {
  const res = await api.post('/api/auth/verify-otp', { email, otp, full_name, password, role }, { withCredentials: true });
  return res.data;
}

export async function verifyEmail(token: string) {
  const res = await api.post('/api/auth/verify-email', { token }, { withCredentials: true });
  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await api.post('/api/auth/forgot-password', { email }, { withCredentials: true });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await api.post('/api/auth/reset-password', { token, newPassword }, { withCredentials: true });
  return res.data;
}

export default { register, login, getProfile };
