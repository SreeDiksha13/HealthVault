"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import axios from "axios";

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
  currentMedications?: string[];
  chronicConditions?: string;
  primaryPhysician?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  photoUrl?: string;
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        // Get user from localStorage
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('hv_user') : null;
        if (!userStr) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userStr);
        if (!user.email) {
          router.push("/login");
          return;
        }

        // Fetch patient by email
        const res = await axios.get(`http://localhost:5000/api/patients?email=${user.email}`);
        setPatient(res.data);
        setFormData(res.data);
      } catch (err) {
        console.error("Error fetching patient:", err);
        setErrorMessage("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'allergies' | 'currentMedications', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!patient?._id) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await axios.put(`http://localhost:5000/api/patients/${patient._id}`, formData);
      setPatient(res.data);
      setFormData(res.data);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error updating patient:", err);
      setErrorMessage(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(patient || {});
    setIsEditing(false);
    setErrorMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">Profile not found</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Header */}
      <Header />

      <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
        {/* Title and Actions */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition-colors font-medium"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">{patient.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-800 px-4 py-2 bg-gray-100 rounded-lg">{patient.email}</p>
                <span className="text-xs text-gray-500">Email cannot be changed</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., +1234567890"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">{patient.phone || "Not provided"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dob || ""}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.dob ? new Date(patient.dob).toLocaleDateString() : "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                {isEditing ? (
                  <select
                    value={formData.gender || ""}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">{patient.gender || "Not provided"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                {isEditing ? (
                  <select
                    value={formData.bloodGroup || ""}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">{patient.bloodGroup || "Not provided"}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <textarea
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Enter your complete address"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">{patient.address || "Not provided"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Medical Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies <span className="text-xs text-gray-500">(comma-separated)</span>
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.allergies?.join(', ') || ""}
                    onChange={(e) => handleArrayInput('allergies', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Penicillin, Peanuts, Pollen"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.allergies?.join(", ") || "None reported"}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications <span className="text-xs text-gray-500">(comma-separated)</span>
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.currentMedications?.join(', ') || ""}
                    onChange={(e) => handleArrayInput('currentMedications', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Aspirin 100mg, Metformin 500mg"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.currentMedications?.join(", ") || "None"}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                {isEditing ? (
                  <textarea
                    value={formData.chronicConditions || ""}
                    onChange={(e) => handleInputChange('chronicConditions', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Diabetes Type 2, Hypertension"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.chronicConditions || "None reported"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Physician</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.primaryPhysician || ""}
                    onChange={(e) => handleInputChange('primaryPhysician', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dr. John Doe"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.primaryPhysician || "Not assigned"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Insurance Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.insuranceProvider || ""}
                    onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Blue Cross Blue Shield"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.insuranceProvider || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.insurancePolicyNumber || ""}
                    onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ABC123456789"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.insurancePolicyNumber || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContact?.name || ""}
                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contact Name"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.emergencyContact?.name || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContact?.relation || ""}
                    onChange={(e) => handleEmergencyContactChange('relation', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Spouse, Parent"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.emergencyContact?.relation || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.emergencyContact?.phone || ""}
                    onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="text-gray-800 px-4 py-2 bg-gray-50 rounded-lg">
                    {patient.emergencyContact?.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
