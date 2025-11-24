"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";

type SummaryObj = {
  doctor_name?: string;
  report_date?: string;
  diagnosis?: string;
  medications?: string;
  allergies?: string;
  summary?: string;
};

interface PatientRecordRaw {
  _id: string;
  fileName: string;
  fileUrl: string;
  doctor?: string | { _id?: string; name?: string; email?: string } | null;
  date?: string;
  uploadedAt?: string;
  createdAt?: string;
  notes?: string;
  summary?: SummaryObj | string;
  fileType?: string;
}

type PatientRecord = PatientRecordRaw & {
  _doctorName: string;
  _dateISO: string;
  _dateDisplay: string;
};

function safeDateParts(raw?: string): { iso: string; display: string } {
  if (!raw) return { iso: "", display: "—" };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { iso: "", display: "—" };
  return { iso: d.toISOString().slice(0, 10), display: d.toLocaleDateString() };
}

function pickDoctorName(rec: PatientRecordRaw): string {
  if (rec.summary && typeof rec.summary !== "string" && rec.summary.doctor_name) return rec.summary.doctor_name;
  if (rec.doctor && typeof rec.doctor === "object" && (rec.doctor as any).name) return String((rec.doctor as any).name);
  if (typeof rec.doctor === "string" && rec.doctor.trim().length > 0) return rec.doctor;
  return "Unknown Doctor";
}

export default function PatientRecordsPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id; // ✅ ALWAYS STRING

  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [isDoctorView, setIsDoctorView] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);

        let patientId = id;

        // ✅ If no route param, resolve correct patient ID using email
        if (!patientId) {
          const storedUser = localStorage.getItem("hv_user");
          if (!storedUser) return router.push("/login");

          const user = JSON.parse(storedUser);

          const res = await api.get(`/api/patients`, { params: { email: user.email } });
          patientId = res.data._id;

          router.replace(`/patient-records/${patientId}`);
          return;
        }

        // ✅ Detect doctor view
        try {
          const storedUser = localStorage.getItem("hv_user");
          if (storedUser) setIsDoctorView(true);
        } catch {}

        const res = await api.get<PatientRecordRaw[]>(`/api/patients/${patientId}/records`);
        const raw = res.data || [];

        const normalized: PatientRecord[] = raw.map((r) => {
          const bestDate = r.date || r.uploadedAt || r.createdAt || "";
          const { iso, display } = safeDateParts(bestDate);

          return {
            ...r,
            notes: r.notes || "",
            _doctorName: pickDoctorName(r),
            _dateISO: iso,
            _dateDisplay: display,
          };
        });

        setRecords(normalized);
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to fetch records");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [id, router]);

  const doctorOptions = useMemo(() => Array.from(new Set(records.map((r) => r._doctorName))).filter(Boolean), [records]);

  const fileTypeOptions = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.fileName?.split(".").pop() || "").filter(Boolean)));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesDoctor = doctorFilter ? r._doctorName === doctorFilter : true;
      const matchesDate = dateFilter ? r._dateISO === dateFilter : true;
      const matchesFileType = fileTypeFilter
        ? (r.fileName || "").toLowerCase().endsWith(fileTypeFilter.toLowerCase())
        : true;
      return matchesDoctor && matchesDate && matchesFileType;
    });
  }, [records, doctorFilter, dateFilter, fileTypeFilter]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100">
      <Header />

      <main className="flex-grow p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Patient Records</h1>
          {isDoctorView && (
            <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 text-sm underline">
              ← Back
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className="mb-6 flex flex-wrap gap-6">
          <div>
            <label className="block mb-1 font-semibold">Doctor</label>
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="border px-3 py-2 rounded">
              <option value="">All</option>
              {doctorOptions.map((doc) => <option key={doc}>{doc}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Date</label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                   className="border px-3 py-2 rounded"/>
          </div>

          <div>
            <label className="block mb-1 font-semibold">File Type</label>
            <select value={fileTypeFilter} onChange={(e) => setFileTypeFilter(e.target.value)} className="border px-3 py-2 rounded">
              <option value="">All</option>
              {fileTypeOptions.map((ext) => <option key={ext}>{ext.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full text-left text-gray-700">
            <thead className="bg-blue-100 border-b">
              <tr>
                <th className="px-6 py-3">File</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Notes</th>
                <th className="px-6 py-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r._id} className="border-b hover:bg-blue-50">
                  <td className="px-6 py-4">
                    <a href={r.fileUrl} target="_blank" className="text-blue-600 underline">{r.fileName}</a>
                  </td>
                  <td className="px-6 py-4">{r._doctorName}</td>
                  <td className="px-6 py-4">{r._dateDisplay}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{r.notes || "—"}</td>

                  <td className="px-6 py-4 max-w-lg truncate">
                    {r.summary ? (
                      typeof r.summary === "string"
                        ? r.summary
                        : (
                          <div>
                            <p><strong>Doctor:</strong> {r.summary.doctor_name || "Not specified"}</p>
                            <p><strong>Report Date:</strong> {r.summary.report_date || "Not specified"}</p>
                            <p><strong>Diagnosis:</strong> {r.summary.diagnosis || "Not specified"}</p>
                            <p><strong>Medications:</strong> {r.summary.medications || "None"}</p>
                            <p><strong>Allergies:</strong> {r.summary.allergies || "None"}</p>
                            <p><strong>Summary:</strong> {r.summary.summary || "No summary available"}</p>
                          </div>
                        )
                    ) : "No summary available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
