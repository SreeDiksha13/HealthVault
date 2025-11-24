"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as auth from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [msg, setMsg] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Load registration data from sessionStorage
  useEffect(() => {
    const emailParam = params.get('email') || '';
    const storedData = sessionStorage.getItem('registrationData');
    
    if (storedData) {
      const data = JSON.parse(storedData);
      setEmail(data.email || emailParam);
      setFullName(data.fullName || '');
      setPassword(data.password || '');
      setConfirm(data.password || '');
      setRole(data.role || 'patient');
    } else {
      setEmail(emailParam);
    }
  }, [params]);

  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    
    if (!otp) {
      return setMsg('Please enter the OTP sent to your email');
    }
    
    if (!fullName) {
      return setMsg('Please enter your full name');
    }
    
    if (password !== confirm) {
      return setMsg('Passwords do not match');
    }
    
    // Check password validation
    const pwdValidation = validatePassword(password);
    const isPwdValid = Object.values(pwdValidation).every(v => v);
    if (!isPwdValid) {
      return setMsg('Password does not meet requirements');
    }
    
    try {
      // Verify OTP and create user in database (with role)
      const res = await auth.verifyOtpRegistration(email, otp, fullName, password, role);
      
      // Clear stored registration data
      sessionStorage.removeItem('registrationData');
      
      // Auto-login after successful registration
      if (res.accessToken) {
        await login(email, password);
      }
      
      setMsg('Registration successful! Redirecting...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.response?.data?.error || 'Verification failed');
    }
  };

  const handleSendOtp = async () => {
    setMsg('');
    if (!email) {
      return setMsg('Please enter your email');
    }
    try {
      await auth.sendOtp(email);
      setMsg('✅ OTP sent to your email! Check your inbox.');
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Failed to send OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
      <form onSubmit={handleVerify} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Verify OTP & Complete Registration</h2>
        
        <p className="text-sm text-gray-600 mb-4">Enter the OTP sent to your email to complete registration</p>

        <input 
          className="w-full mb-2 p-2 border rounded" 
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={e => setEmail(e.target.value)}
          readOnly={!!sessionStorage.getItem('registrationData')}
        />
        <div className="flex gap-2 mb-2">
          <input 
            className="flex-1 p-2 border rounded" 
            placeholder="Enter 6-digit OTP" 
            value={otp} 
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
          />
          <button type="button" onClick={handleSendOtp} className="px-3 bg-blue-600 text-white rounded hover:bg-blue-700">
            {sessionStorage.getItem('registrationData') ? 'Resend OTP' : 'Send OTP'}
          </button>
        </div>

        <input className="w-full mb-2 p-2 border rounded" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <input 
          type="password" 
          className="w-full mb-2 p-2 border rounded" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
        {passwordFocused && (
          <div className="mb-2 p-2 bg-gray-50 border rounded text-xs">
            <p className="font-semibold mb-1">Password must contain:</p>
            {(() => {
              const pwdValidation = validatePassword(password);
              return (
                <>
                  <p className={pwdValidation.minLength ? "text-green-600" : "text-gray-600"}>
                    {pwdValidation.minLength ? "✓" : "○"} At least 8 characters
                  </p>
                  <p className={pwdValidation.hasLower ? "text-green-600" : "text-gray-600"}>
                    {pwdValidation.hasLower ? "✓" : "○"} Lowercase letter (a-z)
                  </p>
                  <p className={pwdValidation.hasUpper ? "text-green-600" : "text-gray-600"}>
                    {pwdValidation.hasUpper ? "✓" : "○"} Uppercase letter (A-Z)
                  </p>
                  <p className={pwdValidation.hasNumber ? "text-green-600" : "text-gray-600"}>
                    {pwdValidation.hasNumber ? "✓" : "○"} Number (0-9)
                  </p>
                  <p className={pwdValidation.hasSpecial ? "text-green-600" : "text-gray-600"}>
                    {pwdValidation.hasSpecial ? "✓" : "○"} Special character (!@#$%^&*...)
                  </p>
                </>
              );
            })()}
          </div>
        )}
        <input type="password" className="w-full mb-2 p-2 border rounded" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} />

        {msg && <div className={`text-sm mb-2 ${msg.includes('✅') || msg.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{msg}</div>}

        <div className="flex justify-between items-center">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Verify & Register</button>
          <a className="text-sm text-blue-600 hover:underline" href="/login">Back to login</a>
        </div>
      </form>
    </div>
  );
}
