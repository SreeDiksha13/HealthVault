import express from "express";
import {
  getDoctorByPhone,
  getDoctorByEmail,
  getPatientsByDoctor,
  requestAccessToPatient,
  getAppointments,
  requestAccessByEmail
} from "../controllers/doctorControllers.js";

const router = express.Router();

// Doctor info
router.get("/phone/:phone", getDoctorByPhone);
router.get("/email/:email", getDoctorByEmail);

// Patients doctor can access
router.get("/:id/patients", getPatientsByDoctor);

// Request access to a patient
router.post("/:doctorId/request-access/:patientId", requestAccessToPatient);

// Appointments
router.get("/:id/appointments", getAppointments);

router.post("/:doctorId/request-access", requestAccessByEmail);

export default router;
