import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  phone: String,
  gender: { 
    type: String, 
    enum: {
      values: ["male", "female", "other"],
      message: "Gender must be 'male', 'female', or 'other'"
    },
    required: false,
    set: function(v) {
      return v ? v.toLowerCase() : v;
    }
  },
  dateOfBirth: Date,
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  
  bloodGroup: String,
  address: String,

  allergies: [String],
  bp: String,
  currentMedications: [String],

  visitedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
  
  reports: [
    {
      fileName: { type: String, required: true },
      fileUrl: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      ffileType: {
  type: String,
  enum: [
    "lab report",
    "prescription",
    "scan",
    "other",
    "pdf",
    "doc",
    "docx",
    "jpg",
    "png",
    "txt"
  ],
  default: "other"
},

      summary: { type: mongoose.Schema.Types.Mixed } // Now accepts both String and Object
    }
  ],

  image: String,

  currentAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
  accessRequests: [
    {
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
      requestedAt: { type: Date, default: Date.now }
    }
  ],

  usertype: { type: String, default: "patient", immutable: true }

}, { timestamps: true });

export default mongoose.model("Patient", patientSchema);