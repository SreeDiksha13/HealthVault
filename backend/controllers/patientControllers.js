import { supabase } from "../config/supabase.js";


import fs from "fs";
import path from "path";
import Patient from "../models/Patients.js";
import Doctor from "../models/Doctors.js";
import aiService from "../services/aiServices.js";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client


// Create a patient
export const createPatient = async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all patients or by email
export const getAllPatients = async (req, res) => {
  try {
    const { email } = req.query;
    const query = email ? { email } : {};

    const patients = await Patient.find(query)
      .populate("visitedDoctors", "name email")
      .populate("currentAccess", "name email")
      .populate("accessRequests.doctor", "name email");

    if (email) {
      if (!patients.length) return res.status(404).json({ error: "Patient not found" });
      return res.json(patients[0]);
    }

    res.json(patients);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("visitedDoctors", "name email")
      .populate("currentAccess", "name email")
      .populate("accessRequests.doctor", "name email")
      .populate("reports.doctor", "name email");

    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update patient
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("visitedDoctors", "name email")
      .populate("currentAccess", "name email")
      .populate("accessRequests.doctor", "name email");

    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Approve doctor access
export const approveDoctorAccess = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    patient.accessRequests = patient.accessRequests.filter(
      r => r.doctor.toString() !== req.params.doctorId
    );

    if (!patient.currentAccess.includes(req.params.doctorId)) {
      patient.currentAccess.push(req.params.doctorId);
    }

    await patient.save({ validateModifiedOnly: true });

    await Doctor.updateOne(
      { _id: req.params.doctorId },
      { $addToSet: { currentAccessToPatients: req.params.id } }
    );

    res.json({ message: "Access approved" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Deny doctor access
export const denyDoctorAccess = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    patient.accessRequests = patient.accessRequests.filter(
      r => r.doctor.toString() !== req.params.doctorId
    );

    await patient.save();
    res.json({ message: "Access denied" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get patient by phone
export const getPatientByPhone = async (req, res) => {
  try {
    const patient = await Patient.findOne({ phone: req.params.phone })
      .populate("visitedDoctors", "name email")
      .populate("currentAccess", "name email")
      .populate("accessRequests.doctor", "name email");

    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get patient records
export const getPatientRecords = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("reports.doctor", "name email");
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    res.json(patient.reports);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Upload report to Supabase + Save in Mongo
export const uploadPatientReport = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const fileBuffer = fs.readFileSync(file.path);
    const fileName = `${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET) // health-records
      .upload(fileName, fileBuffer, { contentType: file.mimetype });

    fs.unlinkSync(file.path); // remove temporary local file

    if (error) return res.status(500).json({ error: "Failed to upload to Supabase" });

    const { data: publicUrlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    const summaryData = await aiService.processFile(fileUrl, file.mimetype);

    const newReport = {
      fileName: file.originalname,
      fileUrl,
      uploadedAt: new Date(),
      doctor: null,
      fileType: "other",
      summary: {
        doctor_name: summaryData.doctor_name || "Not specified",
        report_date: summaryData.report_date || "Not specified",
        diagnosis: summaryData.diagnosis || "Not specified",
        medications: summaryData.medications || "None listed",
        allergies: summaryData.allergies || "None listed",
        summary: summaryData.summary || "No summary available",
        status: summaryData.status || "completed"
      }
    };

    patient.reports.push(newReport);
    await patient.save();
    await patient.populate("reports.doctor", "name email");

    return res.json({
      message: "Report uploaded successfully",
      report: patient.reports[patient.reports.length - 1]
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};
