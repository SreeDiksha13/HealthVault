import Doctor from "../models/Doctors.js";
import Patient from "../models/Patients.js";

// Get doctor by phone and populate patients they have access to
export const getDoctorByPhone = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ phone: req.params.phone })
      .populate({ path: "currentAccessToPatients", select: "name email phone" });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get doctor by email and populate patients they have access to
export const getDoctorByEmail = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ email: req.params.email })
      .populate({ path: "currentAccessToPatients", select: "name email phone" });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get patients doctor currently has access to
export const getPatientsByDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate({ path: "currentAccessToPatients", select: "name email phone" });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json(doctor.currentAccessToPatients);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Request access to a patient
export const requestAccessToPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const alreadyRequested = patient.accessRequests.some(
      r => r.doctor.toString() === req.params.doctorId
    );
    if (alreadyRequested) return res.status(400).json({ error: "Already requested" });

    patient.accessRequests.push({ doctor: req.params.doctorId });
    await patient.save();
    res.json({ message: "Access request sent" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all appointments for a doctor
// export const getAppointments = async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.params.id).populate("appointments.patient", "name phone email");
//     if (!doctor) return res.status(404).json({ error: "Doctor not found" });

//     const appts = doctor.appointments.map(a => ({
//       _id: a._id,
//       patientId: a.patient._id,
//       patientName: a.patient.name,
//       patientEmail: a.patient.email,
//       patientPhone: a.patient.phone,
//       appointmentDate: a.appointmentDate,
//       appointmentTime: a.appointmentTime,
//       notes: a.notes
//     }));

//     res.json(appts);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// Get all appointments for a doctor
export const getAppointments = async (req, res) => {
  try {
    console.log("Fetching appointments for doctor ID:", req.params.id);
    
    const doctor = await Doctor.findById(req.params.id)
      .populate("appointments.patient", "name phone email");
    
    if (!doctor) {
      console.log("Doctor not found");
      return res.status(404).json({ error: "Doctor not found" });
    }

    console.log("Doctor found, appointments count:", doctor.appointments?.length || 0);

    // Handle case where appointments array doesn't exist or is empty
    if (!doctor.appointments || doctor.appointments.length === 0) {
      console.log("No appointments found for doctor");
      return res.json([]);
    }

    // Filter out appointments where patient reference is null/undefined
    const appts = doctor.appointments
      .filter(a => {
        if (!a.patient) {
          console.log("Skipping appointment with missing patient reference:", a._id);
          return false;
        }
        return true;
      })
      .map(a => ({
        _id: a._id,
        patientId: a.patient._id,
        patientName: a.patient.name || a.patientName, // Fallback to stored patientName
        patientEmail: a.patient.email,
        patientPhone: a.patient.phone,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        notes: a.notes
      }));

    console.log("Returning appointments:", appts.length);
    res.json(appts);
  } catch (err) {
    console.error("Error in getAppointments:", err);
    
    // Check if it's a CastError (invalid ObjectId)
    if (err.name === 'CastError') {
      return res.status(400).json({ error: "Invalid doctor ID format" });
    }
    
    res.status(400).json({ error: err.message });
  }
};



export const requestAccessByEmail = async (req, res) => {
  try {
    const { patientEmail } = req.body;
    const doctorId = req.params.doctorId;

    if (!patientEmail) {
      return res.status(400).json({ error: "Patient email is required" });
    }

    // Find patient by email - use case-insensitive search
    const patient = await Patient.findOne({ 
      email: { $regex: new RegExp('^' + patientEmail + '$', 'i') }
    });
    
    if (!patient) {
      return res.status(404).json({ error: "No patient account found with this email address. The patient needs to register first." });
    }

    // Check if doctor already has access
    const hasAccess = patient.currentAccess?.some(
      docId => docId.toString() === doctorId
    ) || false;
    
    if (hasAccess) {
      return res.status(400).json({ error: "You already have access to this patient" });
    }

    // Check if request already exists - handle case where accessRequests might be undefined
    const alreadyRequested = patient.accessRequests?.some(
      r => r.doctor.toString() === doctorId
    ) || false;
    
    if (alreadyRequested) {
      return res.status(400).json({ error: "Access request already pending" });
    }

    // Initialize accessRequests array if it doesn't exist
    if (!patient.accessRequests) {
      patient.accessRequests = [];
    }

    // Add access request
    patient.accessRequests.push({ 
      doctor: doctorId,
      status: "pending",
      requestedAt: new Date()
    });
    
    // Save with validateModifiedOnly to only validate the changed fields
    await patient.save({ validateModifiedOnly: true });

    res.json({ 
      message: "Access request sent successfully",
      patientName: patient.name 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
