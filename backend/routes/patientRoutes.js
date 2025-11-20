import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  approveDoctorAccess,
  denyDoctorAccess,
  getPatientByPhone,
  getPatientRecords,
  uploadPatientReport 
} from "../controllers/patientControllers.js";

const router = express.Router();

// ================= Multer setup =================
const uploadDir = path.join("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ================= Routes =================
// Static routes first (no URL parameters)
router.post("/", createPatient);
router.get("/", getAllPatients); // This handles email queries via ?email=

// Then specific parameter routes
router.get("/phone/:phone", getPatientByPhone);

// Then the id-based routes
router.get("/:id/records", getPatientRecords);
router.post("/:id/upload", upload.single("file"), uploadPatientReport);
router.post("/:id/approve-access/:doctorId", approveDoctorAccess);
router.post("/:id/deny-access/:doctorId", denyDoctorAccess);

// Generic CRUD routes last
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;
