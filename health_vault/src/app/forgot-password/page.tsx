"use client";
import React, { useState } from 'react';
import * as auth from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await auth.forgotPassword(email);
      setMsg('If your email is registered, a reset link has been sent (check console if email not configured).');
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Failed to request password reset');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <input className="w-full p-2 mb-3 border rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        {msg && <div className="text-sm text-green-700 mb-2">{msg}</div>}
        <div className="flex justify-between items-center">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send Reset Link</button>
          <a href="/login" className="text-sm text-blue-600">Back to login</a>
        </div>
      </form>
    </div>
  );
}
