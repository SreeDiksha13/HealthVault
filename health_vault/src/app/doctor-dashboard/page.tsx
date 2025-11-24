 "use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Search, FileText, Calendar, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  address: string;
  bloodGroup: string;
}

interface EmergencyContact {
  name?: string;
  relation?: string;
  phone?: string;
}

interface Report {
  _id?: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  doctor?: string;
  fileType?: "lab report" | "prescription" | "scan" | "other";
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  emergencyContact?: EmergencyContact;
  bloodGroup?: string;
  address?: string;
  allergies?: string[];
  bp?: string;
  currentMedications?: string[];
  reports?: Report[];
  image?: string;
}

interface PatientRecord {
  _id: string;
  patientId: string;
  patientName: string;
  fileName: string;
  fileUrl: string;
  date: string;
  uploadedAt: string;
  summary: string;
  fullDetails: string;
  fileType?: string;
}

interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCard, setExpandedCard] = useState<{
    type: "record" | "appointment" | "patient";
    id: string;
  } | null>(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestStatus, setRequestStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("hv_user");
    if (!storedUser) {
      console.log('No user found in localStorage, redirecting to login');
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    if (!user.email) {
      console.log('No email found in user data, redirecting to login');
      router.push("/login");
      return;
    }

    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch doctor profile by email
        const doctorRes = await api.get(`/api/doctors/email/${user.email}`);
        const doctorData: Doctor = doctorRes.data;
        console.log('Found doctor:', doctorData);
        setDoctor(doctorData);

        // Now use the doctor's _id for other requests
        const doctorId = doctorData._id;

        // Fetch patients doctor has access to
        const patientsRes = await api.get(`/api/doctors/${doctorId}/patients`);
        const patientsData: Patient[] = patientsRes.data;

        // Fetch detailed patient data including reports
        const patientsWithDetails = await Promise.all(
          patientsData.map(async (patient) => {
            try {
              const detailRes = await api.get(`/api/patients/${patient._id}`);
              return detailRes.data;
            } catch (err) {
              console.error(`Failed to fetch details for patient ${patient._id}:`, err);
              return patient;
            }
          })
        );

        setPatients(patientsWithDetails);

        // Fetch appointments
        const appointmentsRes = await api.get(`/api/doctors/${doctorId}/appointments`);
        const appointmentsData: Appointment[] = appointmentsRes.data;

        // Filter today's appointments
        const today = new Date().toISOString().split("T")[0];
        const todayAppointments = appointmentsData.filter((appt) => {
          const apptDate = new Date(appt.appointmentDate).toISOString().split("T")[0];
          return apptDate === today;
        });

        setAppointments(todayAppointments);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching doctor data:", err);
        setError(err.response?.data?.error || err.message || "Failed to load data");
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [router]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all patient records
  const patientRecords: PatientRecord[] = patients.flatMap((patient) =>
    (patient.reports || []).map((report) => ({
      _id: report._id || `${patient._id}-${report.fileName}`,
      patientId: patient._id,
      patientName: patient.name,
      fileName: report.fileName,
      fileUrl: report.fileUrl,
      date: new Date(report.uploadedAt).toLocaleDateString(),
      uploadedAt: report.uploadedAt,
      fileType: report.fileType,
      summary: `${report.fileType || "Medical record"}: ${report.fileName}`,
      fullDetails: `Patient: ${patient.name}\nFile: ${report.fileName}\nType: ${report.fileType || "Other"}\nUploaded: ${new Date(
        report.uploadedAt
      ).toLocaleString()}\n\nThis is a medical record uploaded by the patient.`,
    }))
  );

  const handleCardClick = (type: "record" | "appointment" | "patient", id: string) => {
    setExpandedCard({ type, id });
  };

  const handleClose = () => setExpandedCard(null);

  

  const handleRequestAccess = async () => {
    if (!requestEmail.trim()) {
      setRequestStatus({ type: "error", message: "Please enter an email address" });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestEmail)) {
      setRequestStatus({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    if (!doctor) {
      setRequestStatus({ type: "error", message: "Doctor information not loaded" });
      return;
    }

    try {
      setRequestStatus({ type: null, message: "" });
      const response = await api.post(`/api/doctors/${doctor._id}/request-access`, {
        patientEmail: requestEmail.trim().toLowerCase(),
      });
      
      setRequestStatus({
        type: "success",
        message: response.data.message || "Access request sent successfully!",
      });
      setRequestEmail("");
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setRequestStatus({ type: null, message: "" });
      }, 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to send access request";
      console.error("Access request error:", errorMessage);
      setRequestStatus({
        type: "error",
        message: errorMessage
      });
    }
  };

  const getExpandedData = (): Patient | PatientRecord | Appointment | null => {
    if (!expandedCard) return null;

    if (expandedCard.type === "record") {
      return patientRecords.find((r) => r._id === expandedCard.id) || null;
    } else if (expandedCard.type === "appointment") {
      return appointments.find((a) => a._id === expandedCard.id) || null;
    } else if (expandedCard.type === "patient") {
      return patients.find((p) => p._id === expandedCard.id) || null;
    }
    return null;
  };

  const expandedData = getExpandedData();

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get next appointment
  const getNextAppointment = () => {
    if (appointments.length === 0) return "No appointments today";
    const sortedAppts = [...appointments].sort((a, b) => {
      const timeA = a.appointmentTime || "00:00";
      const timeB = b.appointmentTime || "00:00";
      return timeA.localeCompare(timeB);
    });
    const next = sortedAppts[0];
    return `${new Date(next.appointmentDate).toLocaleDateString()}, ${
      next.appointmentTime || "Time TBD"
    }`;
  };

  // Type guards
  const isPatient = (data: any): data is Patient => {
    return data && "email" in data && !("patientName" in data) && !("appointmentDate" in data);
  };

  const isPatientRecord = (data: any): data is PatientRecord => {
    return data && "patientName" in data && "fileName" in data;
  };

  const isAppointment = (data: any): data is Appointment => {
    return data && "appointmentDate" in data && "patientName" in data;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">Error: {error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <p className="text-gray-600 text-xl mb-4">Doctor not found</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100">
      <Header />

      <div className="flex justify-start items-center p-4 min-h-[100px]">
        <h1 className="text-3xl font-bold text-blue-700 tracking-wide">
          {getGreeting()}, <span className="text-cyan-600">Dr. {doctor.name}</span>
        </h1>
      </div>

      <main className="flex-grow px-6 pb-20 pt-6 flex flex-col md:flex-row gap-x-8 gap-y-6 max-w-7xl mx-auto">
        {/* Left: Vertical patient list with search */}
        <div className="flex flex-col space-y-4 basis-[400px] min-w-[350px] max-w-[500px]">
          <Card className="p-4 shadow-lg bg-white/80 backdrop-blur-sm border border-gray-200 h-full">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search patients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div key={patient._id} className="flex items-center gap-2">
                      <div
                      className="flex-1 p-3 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-blue-100 transition"
                      onClick={() => router.push(`/patient-dashboard?patientId=${patient._id}`)}
                    >
                      <div className="font-semibold text-blue-700">{patient.name}</div>
                      <div className="text-xs text-gray-500">
                        {patient.phone || patient.email || "No contact info"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/patient-records/${patient._id}`);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        title="View patient records"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/patient-dashboard?patientId=${patient._id}`);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        title="View patient dashboard"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 p-3 text-center">No patients found.</div>
              )}
            </div>
          </Card>

          {/* Request Access Card */}
          <Card className="p-4 shadow-lg bg-white/80 backdrop-blur-sm border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-700 font-semibold flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Request Patient Access</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Enter patient's email to request access to their medical records.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Patient email address"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleRequestAccess}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
                >
                  Send Request
                </button>
                {requestStatus.type && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      requestStatus.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    {requestStatus.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Two columns, each with two stacked cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 h-[650px]">
          {/* First column: Patient Records & Appointments */}
          <div className="flex flex-col gap-8 h-full">
            {/* Patient Records */}
            <Card className="p-4 shadow-xl bg-white/80 backdrop-blur-sm border border-gray-200 flex-1 min-h-[180px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 text-lg font-semibold">
                  <FileText className="w-5 h-5" />
                  <span>Patient Records (Current Access)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientRecords.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No patient records available</p>
                ) : (
                  <ul className="space-y-2 max-h-36 overflow-y-auto">
                    {patientRecords.slice(0, 5).map((record) => (
                      <li
                        key={record._id}
                        className="border-b border-gray-200 pb-2 last:border-none cursor-pointer hover:bg-blue-50 p-2 rounded transition"
                        onClick={() => handleCardClick("record", record._id)}
                      >
                        <div className="font-semibold">{record.patientName}</div>
                        <div className="text-sm text-gray-600">{record.date}</div>
                        <div className="text-sm truncate" title={record.fileName}>
                          {record.fileName}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Appointments for the day */}
            <Card className="p-4 shadow-xl bg-white/80 backdrop-blur-sm border border-gray-200 flex-1 min-h-[180px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 text-lg font-semibold">
                  <Calendar className="w-5 h-5" />
                  <span>Appointments for Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No appointments today</p>
                ) : (
                  <ul className="space-y-2 max-h-36 overflow-y-auto">
                    {appointments.map((appt) => (
                      <li
                        key={appt._id}
                        className="border-b border-gray-200 pb-2 last:border-none cursor-pointer hover:bg-blue-50 p-2 rounded transition"
                        onClick={() => handleCardClick("appointment", appt._id)}
                      >
                        <div className="font-semibold">{appt.patientName}</div>
                        <div className="text-sm text-gray-600">
                          {appt.appointmentTime || "Time not set"}
                        </div>
                        <div className="text-sm truncate" title={appt.notes}>
                          {appt.notes || "No notes"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Second column: Doctor Profile & Patients Summary */}
          <div className="flex flex-col gap-8 h-full">
            <Card className="p-4 shadow-xl bg-white/80 backdrop-blur-sm border border-gray-200 flex-1 min-h-[180px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 text-lg font-semibold">
                  <Users className="w-5 h-5" />
                  <span>Doctor Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 space-y-2">
                  <p>
                    <span className="font-semibold">Name:</span> Dr. {doctor.name}
                  </p>
                  <p>
                    <span className="font-semibold">Specialty:</span>{" "}
                    {doctor.specialization || "General Medicine"}
                  </p>
                  <p>
                    <span className="font-semibold">Contact:</span> {doctor.email}
                  </p>
                 
                  <p>
                    <span className="font-semibold">Next Appointment:</span> {getNextAppointment()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4 shadow-xl bg-white/80 backdrop-blur-sm border border-gray-200 flex-1 min-h-[180px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700 text-lg font-semibold">
                  <Users className="w-5 h-5" />
                  <span>Patients Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 space-y-3">
                  <p className="text-lg">
                    <span className="font-semibold">Total Patients:</span>{" "}
                    <span className="text-2xl text-blue-600">{patients.length}</span>
                  </p>
                  <p className="text-lg">
                    <span className="font-semibold">Appointments Today:</span>{" "}
                    <span className="text-2xl text-green-600">{appointments.length}</span>
                  </p>
                  <p className="text-lg">
                    <span className="font-semibold">Records Available:</span>{" "}
                    <span className="text-2xl text-purple-600">{patientRecords.length}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Expanded Card Modal */}
      {expandedCard && expandedData && (
        <div
          className="fixed inset-0 bg-transparent backdrop-filter backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 font-bold text-2xl"
              onClick={handleClose}
              aria-label="Close expanded details"
            >
              &times;
            </button>

            {isPatient(expandedData) && (
              <>
                <h2 className="text-xl font-bold mb-4">{expandedData.name} - Patient Details</h2>
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>Email:</strong> {expandedData.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {expandedData.phone || "Not provided"}
                  </p>
                  <p>
                    <strong>Gender:</strong> {expandedData.gender || "Not specified"}
                  </p>
                  <p>
                    <strong>Blood Group:</strong> {expandedData.bloodGroup || "Not recorded"}
                  </p>
                  <p>
                    <strong>BP:</strong> {expandedData.bp || "Not recorded"}
                  </p>
                  {expandedData.allergies && expandedData.allergies.length > 0 && (
                    <p>
                      <strong>Allergies:</strong> {expandedData.allergies.join(", ")}
                    </p>
                  )}
                  {expandedData.currentMedications && expandedData.currentMedications.length > 0 && (
                    <p>
                      <strong>Current Medications:</strong>{" "}
                      {expandedData.currentMedications.join(", ")}
                    </p>
                  )}
                  {expandedData.emergencyContact && expandedData.emergencyContact.name && (
                    <div>
                      <strong>Emergency Contact:</strong>
                      <p className="ml-4">
                        {expandedData.emergencyContact.name} ({expandedData.emergencyContact.relation})
                        <br />
                        {expandedData.emergencyContact.phone}
                      </p>
                    </div>
                  )}
                  <p>
                    <strong>Total Reports:</strong> {(expandedData.reports || []).length}
                  </p>
                </div>
              </>
            )}

            {isPatientRecord(expandedData) && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {expandedData.patientName} - Medical Record
                </h2>
                <p className="mb-3 text-gray-700 font-semibold">
                  File: {expandedData.fileName}
                </p>
                <p className="mb-3 text-gray-700 font-semibold">
                  Type: {expandedData.fileType || "Other"}
                </p>
                <p className="mb-3 text-gray-700 font-semibold">
                  Uploaded: {new Date(expandedData.uploadedAt).toLocaleString()}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{expandedData.fullDetails}</p>
                {expandedData.fileUrl && (
                  <a
                    href={expandedData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    View File
                  </a>
                )}
              </>
            )}

            {isAppointment(expandedData) && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {expandedData.patientName} - Appointment Details
                </h2>
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(expandedData.appointmentDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {expandedData.appointmentTime || "Not specified"}
                  </p>
                  <p>
                    <strong>Patient Phone:</strong> {expandedData.patientPhone || "Not provided"}
                  </p>
                  <p>
                    <strong>Patient Email:</strong> {expandedData.patientEmail || "Not provided"}
                  </p>
                  {expandedData.notes && (
                    <div>
                      <strong>Notes:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{expandedData.notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      
    </div>
  );
}