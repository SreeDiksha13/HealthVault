"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User } from "lucide-react";
import api from "@/lib/api.js";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

type DoctorStatus = "pending" | "approved" | "rejected";

interface Doctor {
  _id: string;
  name: string;
  status?: DoctorStatus;
}

interface Report {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  summary?: {
    doctor_name: string;
    report_date: string;
    diagnosis: string;
    medications: string;
    allergies: string;
    summary: string;
  } | string;
}

interface AccessRequest {
  doctor: Doctor;
  status?: string;
}

interface Patient {
  _id: string;
  name: string;
  phone?: string;
  visitedDoctors?: Doctor[];
  currentAccess?: Doctor[];
  accessRequests?: AccessRequest[];
  reports?: Report[];
  allergies?: string[];
  currentMedications?: string[];
  bp?: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<null | "vitals" | "medication" | "summary">(null);
  const [isDoctorView, setIsDoctorView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const patientIdFromQuery = searchParams.get("patientId");

    const fetchPatient = async () => {
      try {
        let patientEmail: string;

        if (patientIdFromQuery) {
          // Doctor viewing patient - use patient ID from query
          const res = await api.get(`/api/patients/${patientIdFromQuery}`);
          setPatient(res.data);
          setIsDoctorView(true);
          setLoading(false);
          return;
        } else {
          // Patient viewing their own dashboard
          const storedUser = localStorage.getItem("hv_user");
          if (!storedUser) {
            router.push("/login");
            return;
          }
          const user = JSON.parse(storedUser);
          patientEmail = user.email;
          setIsDoctorView(false);
        }

        // Fetch patient by email using query parameter
        const res = await api.get(`/api/patients?email=${patientEmail}`);
        const data: Patient = res.data;

        // Build doctor list
        const doctorMap = new Map<string, Doctor>();

        data.accessRequests?.forEach((r) => {
          if (r?.doctor?._id) {
            doctorMap.set(r.doctor._id, { ...r.doctor, status: (r.status as DoctorStatus) || "pending" });
          }
        });

        data.currentAccess?.forEach((doc) => {
          if (doc?._id) {
            doctorMap.set(doc._id, { ...doc, status: "approved" });
          }
        });

        setPatient(data);
        setDoctors(Array.from(doctorMap.values()));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchPatient();
  }, [router, searchParams]);

  const handleApprove = async (doctorId: string) => {
    if (!patient || isDoctorView) return;
    try {
      await api.post(`/api/patients/${patient._id}/approve-access/${doctorId}`);
      setDoctors((prev) =>
        prev.map((doc) => (doc._id === doctorId ? { ...doc, status: "approved" } : doc))
      );
    } catch (err: any) {
      console.error("Error approving access:", err);
      console.error("Error details:", err.response?.data);
      alert(`Failed to approve access: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleReject = async (doctorId: string) => {
    if (!patient || isDoctorView) return;
    try {
      await api.post(`/api/patients/${patient._id}/deny-access/${doctorId}`);
      setDoctors((prev) =>
        prev.map((doc) => (doc._id === doctorId ? { ...doc, status: "rejected" } : doc))
      );
    } catch (err: any) {
      console.error("Error rejecting access:", err);
      console.error("Error details:", err.response?.data);
      alert(`Failed to reject access: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!patient || !e.target.files?.length || isDoctorView) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/api/patients/${patient._id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPatient((prev) => (prev ? { ...prev, reports: [...(prev.reports || []), res.data.report] } : prev));
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const getBackgroundColor = (status?: DoctorStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 border-green-400";
      case "rejected":
        return "bg-red-100 border-red-400";
      default:
        return "bg-white/80 border-transparent";
    }
  };

  const getLatestReportSummary = () => {
    if (!patient?.reports || patient.reports.length === 0) {
      return {
        brief: <p className="text-gray-600 text-sm">No reports available yet.</p>,
        full: <p className="text-gray-700">Upload your first medical report to see a summary here.</p>
      };
    }

    const sortedReports = [...patient.reports].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    const latestReport = sortedReports[0];

    if (!latestReport.summary) {
      return {
        brief: <p className="text-gray-600 text-sm">Latest report summary not yet generated.</p>,
        full: <p className="text-gray-700">The summary for your latest report is being processed.</p>
      };
    }

    if (typeof latestReport.summary === "string") {
      return {
        brief: <p className="text-gray-600 text-sm">{latestReport.summary.slice(0, 100)}...</p>,
        full: <div className="text-gray-700"><p>{latestReport.summary}</p></div>
      };
    }

    const sum = latestReport.summary;
    return {
      brief: (
        <div className="text-gray-600 text-sm space-y-1">
          <p><strong>Doctor:</strong> {sum.doctor_name || "Not specified"}</p>
          <p><strong>Diagnosis:</strong> {sum.diagnosis || "Not specified"}</p>
          <p className="text-xs text-gray-500">From: {new Date(latestReport.uploadedAt).toLocaleDateString()}</p>
        </div>
      ),
      full: (
        <div className="text-gray-700 space-y-2">
          <p><strong>Report from:</strong> {new Date(latestReport.uploadedAt).toLocaleDateString()}</p>
          <p><strong>Doctor:</strong> {sum.doctor_name || "Not specified"}</p>
          <p><strong>Report Date:</strong> {sum.report_date || "Not specified"}</p>
          <p><strong>Diagnosis:</strong> {sum.diagnosis || "Not specified"}</p>
          <p><strong>Medications:</strong> {sum.medications || "None listed"}</p>
          <p><strong>Allergies:</strong> {sum.allergies || "None listed"}</p>
          <p><strong>Summary:</strong> {sum.summary || "No summary available"}</p>
        </div>
      )
    };
  };

  const summaryData = {
    vitals: {
      title: "Recent Vitals",
      brief: (
        <ul className="text-gray-600 text-sm space-y-1">
          <li>Blood Pressure: {patient?.bp ?? "—"}</li>
          <li>Temperature: 98.6°F</li>
          <li>Heart Rate: 72 bpm</li>
          <li>Sleep Last Night: 8h 20m</li>
        </ul>
      ),
      full: (
        <div className="text-gray-700 space-y-2">
          <p>Detailed vitals for the past week (sample data shown where unavailable):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mon: 98.7°F, {patient?.bp ?? "122/80"}, 70 bpm, 7h 50m sleep</li>
            <li>Tue: 98.4°F, 118/79 mmHg, 73 bpm, 8h 15m sleep</li>
            <li>Wed: 98.6°F, 120/81 mmHg, 71 bpm, 8h 30m sleep</li>
            <li>Thu: 98.5°F, 121/80 mmHg, 72 bpm, 8h 20m sleep</li>
            <li>Fri: 98.6°F, 119/78 mmHg, 70 bpm, 8h 10m sleep</li>
          </ul>
        </div>
      ),
    },
    medication: {
      title: "Current Medications & Allergies",
      brief: (
        <div className="text-gray-600 text-sm space-y-1">
          <div>
            <strong>Medications:</strong>
            <ul className="pl-4 list-disc mt-1">
              {patient?.currentMedications?.length
                ? patient.currentMedications.map((m, i) => <li key={i}>{m}</li>)
                : <li>No medications recorded</li>}
            </ul>
          </div>
          <div>
            <strong>Allergies:</strong>
            <ul className="pl-4 list-disc mt-1">
              {patient?.allergies?.length
                ? patient.allergies.map((a, i) => <li key={i}>{a}</li>)
                : <li>No allergies recorded</li>}
            </ul>
          </div>
        </div>
      ),
      full: (
        <div className="text-gray-700 space-y-2">
          <p>Medication and allergy details (keep updated):</p>
          <ul className="list-disc pl-5 space-y-1">
            {patient?.currentMedications?.length
              ? patient.currentMedications.map((m, i) => <li key={`med-${i}`}>{m}</li>)
              : <li>No current medications recorded.</li>}
            {patient?.allergies?.length
              ? patient.allergies.map((a, i) => <li key={`alg-${i}`}>Allergic to {a}</li>)
              : null}
          </ul>
        </div>
      ),
    },
    summary: {
      title: "Latest Report Summary",
      ...getLatestReportSummary()
    },
  } as const;

  const smallCards = [
    { key: "vitals", ...summaryData.vitals },
    { key: "medication", ...summaryData.medication },
    { key: "summary", ...summaryData.summary },
  ];

  if (loading) return <div className="p-6">Loading...</div>;
  if (!patient) return <div className="p-6">No patient data found.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100">
      <Header />

      <div className="px-6 py-6">
        {isDoctorView && (
          <div className="mb-2 flex items-center gap-2">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Doctor View</span>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {isDoctorView ? `Patient: ${patient.name}` : `Welcome back, ${patient.name}!`}
        </h2>
        <p className="text-gray-600">
          {isDoctorView ? "Patient health overview" : "Here's your health overview for today"}
        </p>
      </div>

      <main className="flex-grow px-6 pb-20 space-y-6">
        {/* Small summary cards */}
        <Card className="w-full hover:scale-[1.02] transition-all duration-300 shadow-2xl bg-white/80 backdrop-blur-sm border-0 cursor-pointer group p-4 relative">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-gray-800 group-hover:text-blue-600 transition-colors flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <span>AI Health Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              {smallCards.map(({ key, title, brief }) => (
                <div
                  key={key}
                  className="flex-1 bg-white rounded-lg shadow p-4 h-48 flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setExpanded(key as any)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setExpanded(key as any);
                  }}
                  aria-expanded={expanded === key}
                  aria-label={`Expand ${title}`}
                >
                  <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">{title}</h3>
                  {brief}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expanded modal */}
        {expanded && (
          <div
            className="fixed inset-0 bg-transparent backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setExpanded(null)}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 font-bold text-2xl"
                onClick={() => setExpanded(null)}
                aria-label="Close expanded info"
              >
                &times;
              </button>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">{summaryData[expanded].title}</h2>
              <div>{summaryData[expanded].full}</div>
            </div>
          </div>
        )}

        {/* Big cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient Records */}
          <Link href={`/patient-records/${patient._id}`} className="block">
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl bg-white/80 backdrop-blur-sm border-0 cursor-pointer group h-[330px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-800 group-hover:text-blue-600 transition-colors flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span>Patient Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">
                  View and manage complete medical history and documents.
                </p>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  {(patient.reports || []).length} records available
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Upload files */}
          {!isDoctorView && (
            <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl bg-white/80 backdrop-blur-sm border-0 cursor-pointer group h-[330px] flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-800 group-hover:text-green-600 transition-colors flex items-center space-x-2">
                  <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">+</span>
                  </div>
                  <span>Upload Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">Add prescriptions, lab reports, and medical documents securely.</p>
                <div className="mt-3 text-xs text-green-600 font-medium">Drag & drop supported</div>
              </CardContent>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
                >
                  Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  multiple={false}
                  accept=".pdf,.doc,.docx,.jpg,.png,.txt"
                />
              </div>
            </Card>
          )}

          {/* Doctor Access */}
          <Card className="hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl bg-white/80 backdrop-blur-sm border-0 cursor-pointer group h-[330px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-800 flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span>Doctor Access {isDoctorView ? "List" : "Requests"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className={`border rounded-xl p-3 flex justify-between items-center ${getBackgroundColor(doctor.status)}`}
                  >
                    <div className="text-gray-800 font-semibold">{doctor.name}</div>
                    {!isDoctorView && (
                      <>
                        {doctor.status === "pending" && (
                          <div className="space-x-2">
                            <button
                              onClick={() => handleApprove(doctor._id)}
                              className="px-3 py-1 rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(doctor._id)}
                              className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {doctor.status === "approved" && (
                          <span className="text-green-700 font-semibold flex items-center">
                            <span className="mr-1">✓</span> Approved
                          </span>
                        )}
                        {doctor.status === "rejected" && (
                          <span className="text-red-700 font-semibold flex items-center">
                            <span className="mr-1">✗</span> Rejected
                          </span>
                        )}
                      </>
                    )}
                    {isDoctorView && (
                      <span className="text-xs text-gray-600">
                        {doctor.status === "approved" ? "✓ Approved" : doctor.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {!isDoctorView && (
                <div className="mt-3 text-xs text-purple-600 font-medium">
                  {doctors.filter((d) => d.status === "pending").length} pending requests
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {!isDoctorView && <Footer />}
    </div>
  );
}
