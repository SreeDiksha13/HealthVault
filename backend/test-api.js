// Test backend connectivity
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

async function testRegister() {
  try {
    console.log('Testing backend connection...');
    const response = await api.get('/');
    console.log('✅ Backend is running:', response.data);
    
    console.log('\nTesting /api/auth/send-otp endpoint...');
    const otpResponse = await api.post('/api/auth/send-otp', {
      email: 'test@example.com'
    });
    console.log('✅ OTP endpoint works:', otpResponse.data);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from backend');
      console.error('Request config:', error.config);
    }
  }
}

testRegister();
