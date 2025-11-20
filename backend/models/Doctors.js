import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  specialization: String,

  address: String,
  bloodGroup: String,

  // Appointments for the day
  appointments: [
    {
      patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
      patientName: { type: String, required: true },
      appointmentDate: { type: Date, required: true },
      appointmentTime: { type: String }, // optional but useful for UI
      notes: String
    }
  ],

  // Doctors currently having access to patients’ records
  currentAccessToPatients: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }
  ],

  usertype: { type: String, default: "doctor", immutable: true }

}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);
