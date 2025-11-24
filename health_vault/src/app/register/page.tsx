"use client";
import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button"; // Assuming existing button component
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegistrationPage() {
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password validation
  const validatePassword = (pwd: string) => ({
    minLength: pwd.length >= 8,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[@$!%*?&#]/.test(pwd),
  });

  // Common state for form inputs
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Patient fields
    dob: "",
    gender: "",
    address: "",
    phone: "",
    // Doctor fields
    specialty: "",
    yearsExperience: "",
    licenseNumber: "",
    bio: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Simple validation example on submit
  const router = useRouter();
  const { register } = useAuth();

  const pwdValidation = validatePassword(form.password);
  const isPwdValid = Object.values(pwdValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic client-side validation
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!isPwdValid) {
      alert('Password does not meet requirements');
      return;
    }

    try {
      // Send OTP to email (don't create user yet)
      const { sendOtp } = await import('@/lib/auth');
      await sendOtp(form.email);
      
      // Store form data temporarily in sessionStorage
      sessionStorage.setItem('registrationData', JSON.stringify({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: role
      }));
      
      // Redirect to OTP verification
      const encoded = encodeURIComponent(form.email || '');
      router.push(`/register/verify-otp?email=${encoded}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to send OTP');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Top Panel - Animated Banner (replaces deprecated <marquee>) */}
      <header className="bg-blue-900 text-white py-2 shadow-md overflow-hidden">
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

      <Header />
      <main className="flex-grow max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Register</h1>

        {/* Role Selection */}
        {!role && (
          <div className="flex justify-center space-x-8 mb-12">
            <Button variant="outline" size="lg" onClick={() => setRole("patient")}>
              Register as Patient
            </Button>
            <Button variant="outline" size="lg" onClick={() => setRole("doctor")}>
              Register as Doctor
            </Button>
          </div>
        )}

        {/* Registration Form */}
        {role && (
          <form
            onSubmit={handleSubmit}
            className="bg-white bg-opacity-80 backdrop-blur-md shadow-lg rounded-xl p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label htmlFor="fullName" className="mb-2 font-semibold text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="email" className="mb-2 font-semibold text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label htmlFor="password" className="mb-2 font-semibold text-gray-700">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  minLength={8}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {passwordFocused && (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs space-y-1">
                    <p className="font-semibold text-gray-700">Password must contain:</p>
                    <p className={pwdValidation.minLength ? 'text-green-600' : 'text-gray-500'}>
                      {pwdValidation.minLength ? '✓' : '○'} At least 8 characters
                    </p>
                    <p className={pwdValidation.hasLower ? 'text-green-600' : 'text-gray-500'}>
                      {pwdValidation.hasLower ? '✓' : '○'} One lowercase letter
                    </p>
                    <p className={pwdValidation.hasUpper ? 'text-green-600' : 'text-gray-500'}>
                      {pwdValidation.hasUpper ? '✓' : '○'} One uppercase letter
                    </p>
                    <p className={pwdValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}>
                      {pwdValidation.hasNumber ? '✓' : '○'} One number
                    </p>
                    <p className={pwdValidation.hasSpecial ? 'text-green-600' : 'text-gray-500'}>
                      {pwdValidation.hasSpecial ? '✓' : '○'} One special character (@$!%*?&#)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label htmlFor="confirmPassword" className="mb-2 font-semibold text-gray-700">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Conditional Fields */}
            {role === "patient" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="dob" className="mb-2 font-semibold text-gray-700">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={form.dob}
                      onChange={handleInputChange}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="gender" className="mb-2 font-semibold text-gray-700">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleInputChange}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="phone" className="mb-2 font-semibold text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="address" className="mb-2 font-semibold text-gray-700">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
              </>
            )}

            {role === "doctor" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="specialty" className="mb-2 font-semibold text-gray-700">
                      Specialty *
                    </label>
                    <select
                      id="specialty"
                      name="specialty"
                      value={form.specialty}
                      onChange={handleInputChange}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select Specialty</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="yearsExperience" className="mb-2 font-semibold text-gray-700">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      id="yearsExperience"
                      name="yearsExperience"
                      value={form.yearsExperience}
                      min={0}
                      onChange={handleInputChange}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="licenseNumber" className="mb-2 font-semibold text-gray-700">
                      Medical License Number *
                    </label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleInputChange}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="bio" className="mb-2 font-semibold text-gray-700">
                    Bio / Description *
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 mt-4 text-white font-semibold bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition-colors"
              onClick={handleSubmit}
            >
              Register
            </button>
          </form>
        )}
      </main>
      <footer className="bg-blue-900 text-white text-center py-2 text-sm shadow-inner">
        © {new Date().getFullYear()} Health Vault. All rights reserved.
      </footer>
    </div>
  );
}
