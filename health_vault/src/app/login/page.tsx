"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // Give a brief moment for state to update, then redirect
      setTimeout(() => {
        const userData = localStorage.getItem('hv_user');
        if (userData) {
          const user = JSON.parse(userData);
          const destination = user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
          router.push(destination);
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-400 to-yellow-200">
      {/* Top Panel - Animated Banner (replaces deprecated <marquee>) */}
      <header className="bg-blue-900 text-white text-bold text-3xl py-2 shadow-md overflow-hidden">
        <div className="relative overflow-hidden">
          <div
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              paddingLeft: '100%',
              animation: 'hv-marquee 12s linear infinite',
            }}
          >
            Health Vault - Secure EHR System for Patients & Doctors — Health Vault - Secure EHR System for Patients & Doctors
          </div>
        </div>
        <style>{`@keyframes hv-marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }`}</style>
      </header>

      {/* Center Login Box */}
      <main className="flex-grow flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-5"
        >
          <h1 className="text-2xl font-bold text-center text-blue-700">
            Welcome Back
          </h1>
          <p className="text-center text-gray-500 text-sm">
            Login with your registered email and password.
          </p>

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-600">
            New user? <a href="/register" className="text-blue-600 hover:underline">Register here</a>
            <br />
            <a href="/forgot-password" className="text-blue-600 hover:underline text-sm">Forgot password?</a>
          </p>
        </form>
      </main>

      {/* Bottom Panel */}
      <footer className="bg-blue-900 text-white text-center py-2 text-sm shadow-inner">
        © {new Date().getFullYear()} Health Vault. All rights reserved.
      </footer>
    </div>
  );
}
