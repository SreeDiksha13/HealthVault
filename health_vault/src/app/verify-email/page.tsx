"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as auth from '@/lib/auth';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (token) {
      (async () => {
        try {
          await auth.verifyEmail(token);
          setMsg('Email verified successfully. Redirecting to login...');
          setTimeout(() => router.push('/login'), 1500);
        } catch (err: any) {
          setMsg(err?.response?.data?.error || 'Verification failed');
        }
      })();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Verify Email</h2>
        <p>{msg || 'Waiting for verification...'}</p>
        {!token && <p className="mt-4">No token provided. Please use the link sent to your email.</p>}
      </div>
    </div>
  );
}
