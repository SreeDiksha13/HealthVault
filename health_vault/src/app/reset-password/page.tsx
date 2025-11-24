"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as auth from '@/lib/auth';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
  };

  useEffect(() => {
    if (!token) setMsg('No reset token provided.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (newPassword !== confirm) return setMsg('Passwords do not match');
    
    // Check password validation
    const pwdValidation = validatePassword(newPassword);
    const isPwdValid = Object.values(pwdValidation).every(v => v);
    if (!isPwdValid) {
      return setMsg('Password does not meet requirements');
    }
    
    try {
      await auth.resetPassword(token, newPassword);
      setMsg('Password reset successful. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <input 
          type="password" 
          className="w-full p-2 mb-3 border rounded" 
          placeholder="New password" 
          value={newPassword} 
          onChange={e => setNewPassword(e.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
        {passwordFocused && (
          <div className="mb-2 p-2 bg-gray-50 border rounded text-xs">
            <p className="font-semibold mb-1">Password must contain:</p>
            {(() => {
              const pwdValidation = validatePassword(newPassword);
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
        <input type="password" className="w-full p-2 mb-3 border rounded" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        {msg && <div className="text-sm text-green-700 mb-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Reset Password</button>
          <a href="/login" className="text-sm text-blue-600">Back to login</a>
        </div>
      </form>
    </div>
  );
}
